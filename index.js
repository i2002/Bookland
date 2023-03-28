const express = require("express");
const fs = require("fs");
const path = require("path");


// Date aplicatie
obGlobal = {
    obErori: null,
    obImagini: null
};


// Initializare server
app = express();
console.log("Folder proiect", __dirname);
console.log("Cale fisier", __filename);
console.log("Director de lucru", process.cwd());
app.set("view engine", "ejs");

// - creare foldere
vectorFoldere = ["temp"];
for (let folder of vectorFoldere) {
    caleFolder = path.join(__dirname, folder)
    if (! fs.existsSync(caleFolder)) {
        fs.mkdirSync(caleFolder);
    }
}


// Definire rutari
// - incarcare resurse statice
app.use("/resurse", express.static(path.join(__dirname, "resurse")));

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
app.get(["/index", "/", "/home"], function(req, res){
    res.render("pagini/index", {ip: req.ip, a: 10, b: 20});
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

// Pornire server
app.listen(8080);
console.log("Serverul a pornit");
