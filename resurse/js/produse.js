window.onload = function() {
    // Filtrare
    document.getElementById("filtrare").onclick = function() {
        // preluare valori formular filtrare
        let val_titlu = document.getElementById("inp-titlu").value.toLowerCase();
        let val_autor = document.getElementById("inp-autor").value.toLowerCase();
        let val_descriere = document.getElementById("inp-descriere").value.toLowerCase();
        let radio_buttons = document.getElementsByName("gr_rad");
        let val_oferta = "";
        for (let r of radio_buttons) {
            if (r.checked) {
                val_oferta = r.value;
                break;
            }
        }
        let checkbox_buttons = document.getElementsByName("gr_chk");
        let val_formate = [];
        for (let c of checkbox_buttons) {
            if (c.checked) {
                val_formate.push(c.value);
            }
        }
        let val_pagini = parseInt(document.getElementById("inp-pagini").value);
        let val_col = document.getElementById("inp-colectie").value;
        let val_limba = Array.from(document.getElementById("inp-limba").selectedOptions).map(option => option.value);

        // validare input-uri
        if (val_descriere.match(/.*\d.*/)) {
            document.getElementById("inp-descriere").classList.add("is-invalid");
            document.querySelector("#inp-descriere + label").innerText = "Input invalid";
            return;
        }

        // filtrare produse
        var produse = document.getElementsByClassName("produs");
        for (let prod of produse) {
            prod.style.display = "none";

            // preluare informatii produse
            let titlu = prod.getElementsByClassName("val-titlu")[0].innerHTML.toLowerCase();
            let autor = prod.getElementsByClassName("val-autor")[0].innerHTML.toLowerCase();
            let descriere = prod.getElementsByClassName("descriere-prod")[0].innerHTML.toLowerCase();
            let oferta = prod.getElementsByClassName("val-oferta")[0].innerHTML;
            let pagini = parseFloat(prod.getElementsByClassName("val-pagini")[0].innerHTML);
            let colectie = prod.getElementsByClassName("val-colectie")[0].innerHTML;
            let formate = prod.getElementsByClassName("val-formate")[0].innerHTML.split(',');
            let limba = prod.getElementsByClassName("val-limba")[0].innerHTML;

            // calculare conditii filtrare
            let cond1 = titlu.startsWith(val_titlu);
            let cond2 = autor.startsWith(val_autor);
            let cond3 = descriere.startsWith(val_descriere);
            let cond4 = val_oferta == "toate" || (val_oferta == "1" && oferta == "Da" || val_oferta == "0" && oferta == "Nu");
            let cond5 = pagini >= val_pagini;
            let cond6 = val_col == "toate" || (val_col == colectie);
            let cond7 = val_formate.length == 0 || formate.reduce((found, value) => found || val_formate.includes(value), false);
            let cond8 = val_limba.length == 0 || val_limba.includes(limba);

            // afisare produs daca corespunde conditiilor
            if (cond1 && cond2 && cond3 && cond4 && cond5 && cond6 && cond7 && cond8) {
                prod.style.display = "";
            }
        }
    }

    // Resetare filtrare
    document.getElementById("resetare").onclick = function() {
        // mesaj confirmare
        if (!confirm("Doriți să resetați filtrele?")) {
            return;
        }

        // resetare valori inputuri
        document.getElementById("inp-titlu").value = "";
        document.getElementById("inp-autor").value = "";
        document.getElementById("inp-descriere").value = "";
        document.getElementById("inp-pagini").value = parseInt(document.getElementById("inp-pagini").min);
        document.getElementById("inp-colectie").value = "toate";
        document.getElementById("inp-limba").value = "";
        document.getElementById("i_rad3").checked = true;
        for (let i = 0; i < 5; i++) {
            document.getElementById(`i_chk${i + 1}`).checked = false;
        }
        document.getElementById("infoRange").innerHTML = `(${document.getElementById("inp-pagini").min})`;
        document.getElementById("inp-descriere").classList.remove("is-invalid");
        document.querySelector("#inp-descriere + label").innerText = "";

        // afisare toate produsele
        var produse = document.getElementsByClassName("produs");
        for (let prod of produse) {
            prod.style.display = "";
        }
    }

    // Actualizare validare texarea
    document.getElementById("inp-descriere").oninput = function() {
        if (!this.value.match(/.*\d.*/)) {
            document.getElementById("inp-descriere").classList.remove("is-invalid");
            document.querySelector("#inp-descriere + label").innerText = "";
        }
    }

    // Actualizare label input range
    document.getElementById("inp-pagini").onchange = function() {
        document.getElementById("infoRange").innerHTML = `(${this.value})`;
    }

    // Sortare
    function sortare(semn) {
        // preluare lista produse
        var produse = document.getElementsByClassName("produs");
        var v_produse = Array.from(produse);

        v_produse.sort(function (a, b) {
            // preluare informatii produse de comparat
            let pret_a = parseFloat(a.getElementsByClassName("val-pret")[0].innerHTML);
            let pagini_a = parseInt(a.getElementsByClassName("val-pagini")[0].innerHTML);
            let pret_b = parseFloat(b.getElementsByClassName("val-pret")[0].innerHTML);
            let pagini_b = parseInt(b.getElementsByClassName("val-pagini")[0].innerHTML);

            // calculare raport pagini - pret
            let raport_a = 1.0 * pagini_a / pret_a;
            let raport_b = 1.0 * pagini_b / pret_b;

            // criteriul secundar de comparare
            if (raport_a == raport_b) {
                let nume_a = a.getElementsByClassName("val-colectie")[0].innerHTML.toLowerCase();
                let nume_b = b.getElementsByClassName("val-colectie")[0].innerHTML.toLowerCase();
                return nume_a.localeCompare(nume_b) * semn;
            }
            
            return (raport_a - raport_b) * semn;
        });

        // actualizare lista produse cu noua ordine
        for (let prod of v_produse) {
            prod.parentElement.appendChild(prod);
        }
    }

    document.getElementById("sortCresc").onclick = function() {
        sortare(1);
    }

    document.getElementById("sortDescresc").onclick = function() {
        sortare(-1);
    }

    // Calculare medie preturi
    document.getElementById("calcul").onclick = function() {
        let suma = 0;
        let nr = 0;
        
        // calculare medie
        var produse = document.getElementsByClassName("produs");
        for (let prod of produse) {
            let pret = parseFloat(prod.getElementsByClassName("val-pret")[0].innerHTML);
            suma += pret;
            nr++;
        }
        let medie = suma / nr;

        // creare si stilizare element
        let mesaj = document.createElement("div");
        mesaj.innerText = "Media prețurilor este: " + medie;
        mesaj.style.position = "fixed";
        mesaj.style.padding = "0.5rem";
        mesaj.style.bottom = "10px";
        mesaj.style.right = "30px";
        mesaj.style.backgroundColor = "white";
        mesaj.style.border = "1px solid black";

        // afisare element pentru 2 secunde
        document.body.appendChild(mesaj);
        setTimeout(() => document.body.removeChild(mesaj), 2000);
    }
}
