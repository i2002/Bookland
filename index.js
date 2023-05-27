const express = require("express");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const sass = require("sass");
const { Client } = require("pg");


// Date aplicatie
obGlobal = {
    obErori: null,
    obImagini: null,
    optiuniMeniu: null,
    folderScss: path.join(__dirname, "resurse", "scss"),
    folderCss: path.join(__dirname, "resurse", "dist"),
    folderBackup: path.join(__dirname, "backup")
};


// Initializare server
app = express();
app.set("view engine", "ejs");

console.log("Folder proiect", __dirname);
console.log("Cale fisier", __filename);
console.log("Director de lucru", process.cwd());

// - conexiune baza de date
var client = new Client({ //FIXME: datele de conectare în env
    database: "Bookland",
    user: "tudor",
    password: "password",
    host: "localhost",
    port: 5432
});
client.connect();

// - preluare tipuri produse pentru meniu
client.query("SELECT * FROM UNNEST(ENUM_RANGE(NULL::TIPURI_CARTI))", function(err, rezCategorie) {
    if (err) {
        console.log(err);
    } else {
        obGlobal.optiuniMeniu = rezCategorie.rows;
    }
});


// Organizare foldere
// - creare foldere
vectorFoldere = ["temp", "backup"];
for (let folder of vectorFoldere) {
    caleFolder = path.join(__dirname, folder)
    if (! fs.existsSync(caleFolder)) {
        fs.mkdirSync(caleFolder);
    }
}


// Compilare automata scss
// - functie compilare
function compileazaScss(caleScss, caleCss) {
    // - daca nu este specificat caleCss consideram aceeași denumire cu cea a sursei
    if (!caleCss) {
        let numeFis = path.parse(caleScss).name;
        caleCss = numeFis + ".css";
    }

    // - transformare in cai absolute
    if (!path.isAbsolute(caleScss)) {
        caleScss = path.join(obGlobal.folderScss, caleScss);
    }

    if (!path.isAbsolute(caleCss)) {
        caleCss = path.join(obGlobal.folderCss, caleCss);
    }

    // - creez subfolder de backup daca nu exista
    let caleBackup = path.join(obGlobal.folderBackup, "resurse/css");
    if (!fs.existsSync(caleBackup)) {
        fs.mkdirSync(caleBackup, {recursive: true});
    }

    // - backup fisier css deja existent
    let numeFisCss = path.basename(caleCss);
    if (fs.existsSync(caleCss)) {
        fs.copyFileSync(caleCss, path.join(obGlobal.folderBackup, "resurse/css", numeFisCss));
    }

    // - compilare fisier sass
    let rez = sass.compile(caleScss, {"sourceMap": true});
    fs.writeFileSync(caleCss, rez.css);
}

// - compilare initiala
let vFisiere = fs.readdirSync(obGlobal.folderScss);
for (let numeFis of vFisiere) {
    if (path.extname(numeFis) == '.scss') {
        compileazaScss(numeFis);
    }
}

// - urmarire modificari sistem de fisiere
fs.watch(obGlobal.folderScss, function(eveniment, numeFis) {
    if (eveniment == "change" || eveniment == "rename") {
        let caleCompleta = path.join(obGlobal.folderScss, numeFis);
        if (fs.existsSync(caleCompleta) && path.extname(numeFis) == '.scss') {
            compileazaScss(caleCompleta);
        }
    }
    console.log(`- ${numeFis} compiled successfully`);
});


// Definire rutari
// - incarcare resurse statice
app.use("/resurse", express.static(path.join(__dirname, "resurse")));
app.use("/node_modules", express.static(path.join(__dirname, "node_modules")));

// - categorii produse pentru meniu
app.use("/*", function(req, res, next) {
    res.locals.optiuniMeniu = obGlobal.optiuniMeniu;
    next();
});

// - prevenire accesul direct la resurse
app.get(/^\/resurse(\/[a-zA-Z0-9]*)*$/, function(req, res) {
    afisareEroare(res, 403);
});

// - prevenire access direct la fisiere .ejs
app.get("/*.ejs", function(req, res) { // sau ^\w+\.ejs$
    afisareEroare(res, 400);
});

// - incarcarea unui favicon
app.get("/favicon.ico", function(req, res) {
    res.sendFile(path.join(__dirname,"resurse", "ico", "favicon.ico"));
});

// - pagina principala cu alias
app.get(["/index", "/", "/home"], function(req, res) {
    res.render("pagini/index", {
        ip: req.ip,
        galerie_statica: obGlobal.obImagini.imagini
    });
});

app.get("/biblioteca-virtuala", function(req, res) {
    res.render("pagini/biblioteca-virtuala", {
        galerie_statica: obGlobal.obImagini.imagini
    });
});

// - listare produse
app.get("/produse", function(req, res) {
    //TO DO query pentru a selecta toate produsele
    //TO DO se adauaga filtrarea dupa tipul produsului
    //TO DO se selecteaza si toate valorile din enum-ul categ_prajitura

    // preluare colecții carte
    // FIXME: probabil mai frumos cu async și promise-uri
    client.query("SELECT * FROM unnest(enum_range(null::colectii_carte))", function(err, rezCategorie) {
        if (err) {
            console.log(err);
            afisareEroare(res, 2);
        } else {
            let conditieWhere = "";

            // filtrare după tip
            if (req.query.tip) {
                conditieWhere = ` WHERE tip_carte='${req.query.tip}'`; // FIXME: SQL injection
            }

            // preluare listă de cărți
            client.query("SELECT * FROM carti" + conditieWhere, function(err, rez) {
                if (err) {
                    console.log(err);
                    afisareEroare(res, 2);
                } else {
                    res.render("pagini/produse", {
                        produse: rez.rows,
                        optiuni: rezCategorie.rows
                    });
                }
            });
        }
    });
});

app.get("/produs/:id", function(req, res) {
     client.query(`SELECT * FROM carti WHERE id=${req.params.id}`, function(err, rezultat) {
        if (err) {
            console.log(err);
            afisareEroare(res, 2);
        }
        else {
            res.render("pagini/produs", {
                prod: rezultat.rows[0]
            });
        }
    });
});

// - afisare pagini dinamic + mesaje de eroare daca nu sunt gasite
app.get("/*", function(req, res) {
    try {
        res.render("pagini" + req.url, function(err, rezRandare) {
            if (err) {
                if(err.message.startsWith("Failed to lookup view")) {
                    afisareEroare(res, 404);
                } else {
                    afisareEroare(res);
                }
            } else {
                res.send(rezRandare);
            }
        });
    } catch(err) {
        if(err.message.startsWith("Cannot find module")) {
            afisareEroare(res, 404);
        } else {
            afisareEroare(res);
        }
    }
});


// Functii ajutatoare erori
// - initializare erori
function initErori() {
    // citire fisier json
    let continut = fs.readFileSync(path.join(__dirname, "resurse", "json", "erori.json")).toString("utf-8");
    obGlobal.obErori = JSON.parse(continut);

    // actualizare cale imagine
    let vErori = obGlobal.obErori.info_erori;
    for (let eroare of vErori) {
        eroare.imagine = path.join(obGlobal.obErori.cale_baza, eroare.imagine);
    }

    // actualizare cale imagine eroare default
    let eroareDefault = obGlobal.obErori.eroare_default;
    eroareDefault.imagine = path.join(obGlobal.obErori.cale_baza,eroareDefault.imagine);
}
initErori();

function afisareEroare(res, _identificator, _titlu, _text, _imagine) {
    // incarcare erori
    let vErori = obGlobal.obErori.info_erori;
    let eroare = vErori.find(function(elem) {
        return elem.identificator == _identificator;
    });

    // daca nu este o eroare definita
    if (!eroare) {
        eroare = obGlobal.obErori.eroare_default;
        eroare.status = false;
    }

    // se alege prima care exista din: parametri dati functiei, valorile din erori.json sau data default
    let titlu1 = _titlu || eroare.titlu || "Eroare";
    let text1 = _text || eroare.text || "A aparut o eroare la încărcarea paginii";
    let imagine1 = _imagine || eroare.imagine || "";
    if (eroare.status) {
        res.status(_identificator).render("pagini/eroare", {titlu: titlu1, text: text1, imagine: imagine1});
    } else {
        res.render("pagini/eroare", {titlu: titlu1, text: text1, imagine: imagine1});
    }
}


// Galerie statica
// - initializare imagini
function initImagini() {
    var continut = fs.readFileSync(path.join(__dirname,"resurse", "json", "galerie.json")).toString("utf-8");
    obGlobal.obImagini = JSON.parse(continut);
    let vImagini = obGlobal.obImagini.imagini;
    let caleAbs = path.join(__dirname, obGlobal.obImagini.cale_galerie);
    let caleAbsMediu = path.join(caleAbs, "mediu");

    if(!fs.existsSync(caleAbsMediu)) {
        fs.mkdirSync(caleAbsMediu);
    }

    for(let imag of vImagini) {
        let numeFis = path.parse(imag.cale_imagine).name;
        let caleFisAbs = path.join(caleAbs, imag.cale_imagine);
        let caleFisMediuAbs = path.join(caleAbsMediu, numeFis + ".webp");
        sharp(caleFisAbs).resize(400).toFile(caleFisMediuAbs);
        imag.fisier_mediu = "/" + path.join(obGlobal.obImagini.cale_galerie, "mediu", numeFis + ".webp");
        imag.fisier = "/" + path.join(obGlobal.obImagini.cale_galerie, imag.cale_imagine);
    }
}
initImagini();


// Pornire server
app.listen(8080);
console.log("Serverul a pornit: http://localhost:8080/");
