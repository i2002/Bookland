const express = require("express");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const sass = require("sass");
const ejs = require("ejs");
const formidable = require("formidable");
const session = require('express-session');
const AccesBD = require("./module_proprii/accesbd.js");
const { Utilizator } = require("./module_proprii/utilizator.js");
const Drepturi = require("./module_proprii/drepturi.js");


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

console.log("- Folder proiect:", `'${__dirname}'`);
console.log("- Cale fisier:", `'${__filename}'`);
console.log("- Director de lucru:", `'${process.cwd()}'`);

// - sesiune utilizator
app.use(session({
    secret: 'abcdefg',
    resave: true,
    saveUninitialized: false
}));

// - preluare tipuri produse pentru meniu
AccesBD.getInstanta().select({
    tabel: 'UNNEST(ENUM_RANGE(NULL::TIPURI_CARTI))',
    campuri: ['*']
}, function(err, rezCategorie) {
    if (err) {
        console.log(err);
    } else {
        obGlobal.optiuniMeniu = rezCategorie.rows;
    }
});


// Organizare foldere
// - creare foldere
vectorFoldere = ["temp", "backup", "poze_uploadate"];
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
app.use("/poze_uploadate", express.static(path.join(__dirname, "poze_uploadate")));

// - informatii pentru toate paginile (categorii meniu, utilizator logat)
app.use("/*", function(req, res, next) {
    res.locals.optiuniMeniu = obGlobal.optiuniMeniu;
    res.locals.Drepturi = Drepturi;
    if (req.session.utilizator) {
        req.utilizator = res.locals.utilizator = new Utilizator(req.session.utilizator);
    }
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
    AccesBD.getInstanta().select({
        tabel: 'carti',
        campuri: ['*']
    }, function(err, carti) {
        if (err) {
            afisareEroare(res, 2);
            return;
        }

        res.render("pagini/index", {
            ip: req.ip,
            galerie_statica: obGlobal.obImagini.imagini,
            imagini: obGlobal.obImagini.imagini,
            carti: JSON.stringify(carti.rows)
        });
    });
});

// - generare stiluri galerie animata
app.get("*/galerie-animata.css", function(req, res) {
    let stiluriScss = fs.readFileSync(path.join(__dirname, "/resurse/scss_ejs/galerie-animata.scss.ejs")).toString("utf8");

    let nr_imagini = 7 + Math.floor(Math.random() * 4);
    if (nr_imagini == 10) {
        nr_imagini++;
    }

    let stiluriScssPrelucrate = ejs.render(stiluriScss, {nr_imagini});
    let caleScss = path.join(__dirname, "/temp/galerie_animata.scss");
    fs.writeFileSync(caleScss, stiluriScssPrelucrate);

    try {
        let stiluriCss = sass.compile(caleScss, {sourceMap: true});

        let caleCss = path.join(__dirname, "/temp/galerie_animata.css");
        fs.writeFileSync(caleCss, stiluriCss.css);

        res.setHeader("Content-Type", "text/css");
        res.sendFile(caleCss);
    }
    catch (err) {
        console.error(err);
        afisareEroare(res, 500);
    }
});

app.get("*/galerie-animata.css.map", function(req, res) {
    res.sendFile(path.join(__dirname, "/temp/galerie-animata.css.map"));
});

// - afisare galerie statica
app.get("/biblioteca-virtuala", function(req, res) {
    res.render("pagini/biblioteca-virtuala", {
        galerie_statica: obGlobal.obImagini.imagini
    });
});

// - listare produse
app.get(["/produse", "/produse-fetch"], async function(req, res) {
    let context = AccesBD.getInstanta();

    try {
        let carti = await context.selectAsync({
            tabel: "carti",
            campuri: ["*"],
            conditii: req.query.tip ? [[`tip_carte='${req.query.tip}'`]] : []
        });

        let colectii = await context.selectAsync({
            tabel: "unnest(enum_range(null::colectii_carte))",
            campuri: ["*"]
        });

        let autori = await context.selectAsync({
            tabel: "carti",
            campuri: ["distinct autor"]
        });
        autori = autori.rows.map(row => row.autor);

        let limba = await context.selectAsync({
            tabel: "carti",
            campuri: ["distinct limba"]
        });
        limba = limba.rows.map(row => row.limba);

        let pagini = await context.selectAsync({
            tabel: "carti",
            campuri: ["nr_pagini"]
        });
        pagini = pagini.rows.map(row => row.nr_pagini)
        let minPagini = Math.min(...pagini);
        let maxPagini = Math.max(...pagini);

        let formate = await context.selectAsync({
            tabel: "carti",
            campuri: ["format"]
        });
        formate = formate.rows.reduce((res, row) => res.concat(...row.format), []);
        formate = [...new Set(formate)];

        res.render("pagini" + req.path, {
            produse: carti.rows,
            optiuni: colectii.rows,
            autori,
            limba,
            minPagini,
            maxPagini,
            formate
        });
    } catch(err) {
        console.log(err);
        afisareEroare(res, 2);
    }
});

app.get("/api/produse", async function(req, res) {
    // preluare parametri
    let titlu = req.query.val_titlu;
    let autor = req.query.val_autor;
    let descriere = req.query.val_descriere;
    let oferta = req.query.val_oferta;
    let formate = req.query.val_formate;
    let pagini = req.query.val_pagini;
    let col = req.query.val_col;
    let limba = req.query.val_limba;
    let sort_crit1 = req.query.sort_crit1;
    let sort_crit2 = req.query.sort_crit2;
    let sort_dir = req.query.sort_dir;
    let pinned = req.query.pinned;
    let removed = req.query.removed;

    // functie ajutatoare
    let text_query = function(column, value) {
        let parsed = value.toLowerCase()
            .replaceAll('ă', 'a')
            .replaceAll('â', 'a')
            .replaceAll('î', 'i')
            .replaceAll('ș', 's')
            .replaceAll('ț', 't');

        return `translate(lower(${column}), 'ăâîșț', 'aaist') like '${parsed}%'`;
    }

    // verificare pinned
    let check_pinned = "";
    if (pinned && pinned != "") {
        check_pinned = `id in (${pinned})`;
    }

    // verificare removed
    let check_removed = "";
    if (removed && removed != "null") {
        check_removed = `id in (${removed})`;
    }

    // criterii filtrare
    let criterii = [];
    if (titlu && titlu != "") {
        criterii.push(text_query("titlu", titlu));
    }

    if (autor && autor != "") {
        criterii.push(text_query("autor", autor));
    }

    if (descriere && descriere != "") {
        criterii.push(text_query("descriere", descriere));
    }

    if (oferta && oferta != "toate") {
        criterii.push(`oferta = ${oferta == "1" ? "TRUE" : "FALSE"}`);
    }

    if (formate && formate != "") {
        formate.split(",").forEach(format => {
            criterii.push(`'${format}' = any (format)`);
        });
    }

    if (pagini) {
        criterii.push(`nr_pagini >= ${pagini}`);
    }

    if (col && col != "toate") {
        criterii.push(`colectie = '${col}'`);
    }

    if (limba && limba != "") {
        let conditie = limba.split(",").map(l => `limba = '${l}'`).join(' or ');
        criterii.push(`(${conditie})`);
    }

    if (check_removed != "") {
        criterii.push(`not ${check_removed}`);
    }

    // conditii pinned
    let conditii_pinned = [];
    if (check_pinned != "") {
        conditii_pinned.push(check_pinned);
    }

    if (check_removed != "" && conditii_pinned.length > 0) {
        conditii_pinned.push(`not ${check_removed}`);
    }

    // conditii filtrare
    let conditii = [];
    if (criterii.length > 0) {
        conditii.push(criterii);
    }

    if (conditii_pinned.length > 0) {
        conditii.push(conditii_pinned);
    }

    // criterii sortare
    let sort = [];
    if (!sort_dir) {
        sort_dir = "asc";
    }

    if (sort_crit1) {
        sort.push(sort_crit1);
    }

    if (sort_crit2 && sort_crit1 != sort_crit2) {
        sort.push(sort_crit2);
    }

    // efectuare query
    let context = AccesBD.getInstanta();
    let carti = await context.selectAsync({
        tabel: "carti",
        campuri: ["*"],
        conditii: conditii,
        orderby: sort,
        orderdir: sort_dir
    });

    // intoarcere date
    res.json(carti);
});

app.get("/produs/:id", function(req, res) {
    AccesBD.getInstanta().select({
        tabel: 'carti',
        campuri: ['*'],
        conditii: [[`id=${req.params.id}`]]
    }, function(err, rezultat) {
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

// - inregistrare utilizator
app.post("/inregistrare", function(req, res) {
    // date user
    var username;
    var poza;

    // prelucrare formulare
    var formular = new formidable.IncomingForm();
    formular.parse(req, function(err, campuriText, campuriFisier) { //4
        var eroare = "";
        console.log(campuriText);

        var utilizNou = new Utilizator();
        try {
            utilizNou.setareUsername = campuriText.username;
            utilizNou.setareNume = campuriText.nume;
            utilizNou.setarePrenume = campuriText.prenume
            utilizNou.setareEmail = campuriText.email
            utilizNou.setareParola = campuriText.parola;
            utilizNou.setareDataNastere = campuriText.data_nastere;
            utilizNou.culoare_chat = campuriText.culoare_chat;
            utilizNou.poza = poza;

            Utilizator.getUtilizDupaUsername(campuriText.username, {}, function(u, parametru, eroareUser) {
                if (eroareUser == -1) { // nu exista username-ul in BD
                    utilizNou.salvareUtilizator();
                } else {
                    eroare += "Mai exista username-ul";
                }

                if (!eroare) {
                    res.render("pagini/inregistrare", {raspuns: "Inregistrare cu succes!"})
                } else {
                    res.render("pagini/inregistrare", {err: "Eroare: " + eroare});
                }
            });
        }
        catch(e) { 
            console.error(e);
            eroare += e.message;
            res.render("pagini/inregistrare", {err: "Eroare: " + eroare});
        }
    });

    formular.on("field", function(nume, val) { // 1 
        if (nume == "username") {
            username = val;
        }
    });

    formular.on("fileBegin", function(nume, fisier) { //2
        let folderUser = path.join(__dirname, "poze_uploadate", username);
        if (!fs.existsSync(folderUser)) {
            fs.mkdirSync(folderUser);
        }

        fisier.filepath = path.join(folderUser, fisier.originalFilename);
        poza = fisier.originalFilename;
    });

    formular.on("file", function(nume, fisier) { //3
    });
});

// - verificare utilizator
app.get("/confirmare_inreg/:token1/:username/:token2", function(req, res) {
    console.log(req.params);
    let username = req.params.username.split("").reverse().join("");
    let token = `${req.params.token1}${req.params.token2}`;
    try {
        Utilizator.getUtilizDupaUsername(username, {res: res, token}, function(u, obparam) {
            AccesBD.getInstanta().update({
                tabel: "utilizatori",
                campuri: {
                    confirmat_mail: 'true'
                }, 
                conditii: [[`cod='${obparam.token}'`]]
            }, function (err, rezUpdate) {
                if(err || rezUpdate.rowCount == 0) {
                    console.log("Cod:", err);
                    afisareEroare(res, 3);
                } else {
                    res.render("pagini/confirmare.ejs");
                }
            });
        });
    }
    catch (e) {
        console.log(e);
        renderError(res, 2);
    }
});

// - login utilizator
app.post("/login", function(req, res) {
    var username;
    var formular = new formidable.IncomingForm();
    formular.parse(req, function(err, campuriText, campuriFile) {
        Utilizator.getUtilizDupaUsername(campuriText.username, {req, res, parola: campuriText.parola}, function(u, obparam) {
            let parola_criptata = Utilizator.criptareParola(obparam.parola);
            if (u.parola == parola_criptata && u.confirmat_mail) {
                if (u.blocat) {
                    console.error("Utilizator blocat");
                    obparam.req.session.mesajLogin = "Utilizatorul este blocat!";
                    obparam.res.redirect("/login");
                    return;
                }

                u.poza = u.poza ? path.join("poze_uploadate", u.username, u.poza) : "";
                obparam.req.session.utilizator = u;
                obparam.req.session.mesajLogin = "";
                obparam.res.redirect("/index");
            } else {
                console.error("Eroare login");
                obparam.req.session.mesajLogin = "Date de logare incorecte sau nu ați confirmat adresa de email!";
                obparam.res.redirect("/login");
            }
        });
    });
});

// - afisare mesaje login
app.get("/login", function(req, res, next) {
    res.locals.eroareLogin = req.session.mesajLogin;
    req.session.mesajLogin = "";
    next();
});

// - logout utilizator
app.get("/logout", function(req, res) {
    req.session.destroy();
    res.locals.utilizator = null;
    res.render("pagini/logout");
});

// - actualizare profil utilizator
app.post("/profil", function(req, res) {
    // nu se permite utilizatorilor neinregistrati
    if (!req.session.utilizator) {
        afisareEroare(res, 403, undefined, "Nu sunteți logat.");
        return;
    }

    // date user
    var poza = "";
    var username = "";

    // prelucrare date formular
    var formular = new formidable.IncomingForm();
    formular.parse(req, function(err, campuriText, campuriFile) {
        var parola_criptata = Utilizator.criptareParola(campuriText.parola);

        // verificare campuri server-side
        try {
            var utilizNou = new Utilizator();
            utilizNou.setareUsername = campuriText.username;
            utilizNou.setareNume = campuriText.nume;
            utilizNou.setarePrenume = campuriText.prenume
            utilizNou.setareEmail = campuriText.email
            utilizNou.setareDataNastere = campuriText.data_nastere;
        } catch(e) {
            console.error(e);
            res.render("pagini/profil", {err: "Eroare: " + e.message});
            return;
        }

        // setare campuri
        let campuri = {
            nume: campuriText.nume,
            prenume: campuriText.prenume,
            email: campuriText.email,
            culoare_chat: campuriText.culoare_chat,
        };

        // daca a fost uploadata o alta poza
        if (poza != "") {
            campuri.poza = poza;
        }

        AccesBD.getInstanta().update({
            tabel: "utilizatori",
            campuri: campuri,
            conditii: [[`parola='${parola_criptata}'`, `username='${campuriText.username}'`]]
        }, function(err, rez) {
            if (err) {
                console.error(err);
                afisareEroare(res, 2);
                return;
            } else if (rez.rowCount != 1) {
                // nu a fost gasit niciun utilizator cu userul si parola respectiva
                res.render("pagini/profil", {err: "Parolă incorectă"});
                return;
            }
            
            // actualizare sesiune
            req.session.utilizator.nume = campuriText.nume;
            req.session.utilizator.prenume = campuriText.prenume;
            req.session.utilizator.email = campuriText.email;
            req.session.utilizator.culoare_chat = campuriText.culoare_chat;
            if (poza != "") {
                req.session.utilizator.poza = path.join("poze_uploadate", campuriText.username, poza);
            }
            res.locals.utilizator = req.session.utilizator;

            console.log("> sesiune actualizata");
            res.render("pagini/profil", {mesaj: "Date actualizate cu succes."});
        });
    });

    // preluare username
    formular.on("field", function(nume, val) { // 1 
        if (nume == "username") {
            username = val;
        }
    });

    // actualizare poza de profil
    formular.on("fileBegin", function(nume, fisier) {
        // - verificare folder user
        let folderUser = path.join(__dirname, "poze_uploadate", username);
        if (!fs.existsSync(folderUser)) {
            fs.mkdirSync(folderUser);
        }

        // - backup poza veche
        let poza_veche = req.utilizator.poza;
        if (fs.existsSync(poza_veche)) {
            fs.renameSync(poza_veche, path.join(folderUser, "poza" + path.extname(poza_veche)));
        }

        // - poza noua
        fisier.filepath = path.join(folderUser, fisier.originalFilename);
        poza = fisier.originalFilename;
    });
});

// - prevenire acces pagini neautorizate
app.get(["/profil"], function(req, res, next) {
    if (!req.session.utilizator) {
        afisareEroare(res, 403, undefined, "Nu sunteți logat.");
        return;
    }
    next();
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
console.log("> Serverul a pornit: http://localhost:8080/");
