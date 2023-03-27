const express = require("express");
const fs = require("fs");


app = express();
console.log("Folder proiect", __dirname);
console.log("Cale fisier", __filename);
console.log("Director de lucru", process.cwd());

app.set("view engine", "ejs");

// app.get("/ceva", function(req, res){
//     console.log("cale:", req.url);
//     res.send("<h1>altceva</h1> ip: " + req.ip);
// });

app.use("/resurse", express.static(__dirname + "/resurse"));

app.get(["/index", "/", "/home"], function(req, res){
    res.render("pagini/index", {ip: req.ip, a: 10, b: 20});
});

app.get("/*", function(req, res) {
    res.render("pagini" + req.url, function(err, rezRandare) {
        if (err) {
            if(err.message.startsWith("Failed to lookup view")) {
                afisareEroare(res, {_identificator: 404, _titlu: "Titlu"});
            } else {
                afisareEroare(res);
            }
        } else {
            res.send(rezRandare);
        }
    });

});

function initErori() {
    let continut = fs.readFileSync(__dirname + "/resurse/json/erori.json").toString("utf-8");
    obGlobal.obErori = JSON.parse(continut);
    let vErori = obGlobal.obErori.info_erori;
    // for (let i = 0; i < vErori.length; i++)
    for (let eroare of vErori) {
        eroare.imagine = obGlobal.obErori.cale_baza + "/" + eroare.imagine;
    }
}
initErori();

/* 
daca programatorul seteaza default, se ia titlul din argument
daca nu e setat, se ia cel din json
daca nu avem titlul nici in JSON se ia titlul din valoarea default
idem pentru celelalte
*/
function afisareEroare(res, {_identificator, _titlu, _text, _imagine} = {}) {
    let vErori = obGlobal.obErori.info_erori;
    let eroare = vErori.find(function(elem) {
        return elem.identificator == _identificator;
    });

    if(eroare) {
        let titlu1 = _titlu || eroare.titlu;
        let text1 = _text || eroare.text;
        let imagine1 = _imagine || eroare.imagine;
        if (eroare.status) {
            res.status(_identificator).render("pagini/eroare", {titlu: titlu1, text: text1, imagine: imagine1});
        } else {
            res.render("pagini/eroare", {titlu: titlu1, text: text1, imagine: imagine1});
        }
    } else {
        let eroareDefault = obGlobal.obErori.eroare_default;
        res.render("pagini/eroare", {titlu: eroareDefault.titlu, text: eroareDefault.text, imagine: obGlobal.obErori.cale_baza+"/"+eroareDefault.imagine});
    }
}

app.listen(8080);
console.log("Serverul a pornit");
