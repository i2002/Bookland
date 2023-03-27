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


app.listen(8080);
console.log("Serverul a pornit");
