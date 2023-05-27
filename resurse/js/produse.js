window.onload = function() {
    document.getElementById("inp-pagini").onchange = function() {
        document.getElementById("infoRange").innerHTML = `(${this.value})`;
    }

    document.getElementById("filtrare").onclick = function() {
        let val_titlu = document.getElementById("inp-titlu").value.toLowerCase();
    
        let radio_buttons = document.getElementsByName("gr_rad");
        let val_aparitie = "";
        for (let r of radio_buttons) {
            if (r.checked) {
                val_aparitie = r.value;
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

        if (val_aparitie != "toate") {
            var [an_a, an_b] = val_aparitie.split(":");
            an_a = parseInt(an_a);
            an_b = parseInt(an_b);
        }

        let val_pagini = parseInt(document.getElementById("inp-pagini").value);

        let val_col = document.getElementById("inp-colectie").value;

        let val_limba = Array.from(document.getElementById("inp-limba").selectedOptions).map(option => option.value);
    
        var produse = document.getElementsByClassName("produs");
        for (let prod of produse) {
            prod.style.display = "none";
            let titlu = prod.getElementsByClassName("val-titlu")[0].innerHTML.toLowerCase();
            let an_aparitie = parseInt(prod.getElementsByClassName("val-an-aparitie")[0].innerHTML);
            let pagini = parseFloat(prod.getElementsByClassName("val-pagini")[0].innerHTML);
            let colectie = prod.getElementsByClassName("val-colectie")[0].innerHTML;
            let formate = prod.getElementsByClassName("val-formate")[0].innerHTML.split(',');
            let limba = prod.getElementsByClassName("val-limba")[0].innerHTML;

            let cond1 = (titlu.startsWith(val_titlu));
            let cond2 = val_aparitie == "toate" || (an_a <= an_aparitie && an_aparitie <= an_b);
            let cond3 = pagini >= val_pagini;
            let cond4 = val_col == "toate" || (val_col == colectie);
            let cond5 = val_formate.length == 0 || formate.reduce((found, value) => found || val_formate.includes(value), false);
            let cond6 = val_limba.length == 0 || val_limba.includes(limba);

            if (cond1 && cond2 && cond3 && cond4 && cond5 && cond6) {
                prod.style.display = "";
            }
        }
    }

    document.getElementById("resetare").onclick = function() {
        if (!confirm("Doriți să resetați filtrele?")) {
            return;
        }

        document.getElementById("inp-titlu").value = "";
        document.getElementById("inp-pagini").value = parseInt(document.getElementById("inp-pagini").min);
        document.getElementById("inp-colectie").value = "toate";
        document.getElementById("inp-limba").value = "";
        document.getElementById("i_rad4").checked = true;
        for (let i = 0; i < 5; i++) {
            document.getElementById(`i_chk${i + 1}`).checked = false;
        }
        document.getElementById("infoRange").innerHTML = `(${document.getElementById("inp-pagini").min})`;
        var produse = document.getElementsByClassName("produs");

        for (let prod of produse) {
            prod.style.display = "";
        }
    }

    function sortare(semn) {
        var produse = document.getElementsByClassName("produs");
        var v_produse = Array.from(produse);
        v_produse.sort(function (a, b) {
            let pret_a = parseFloat(a.getElementsByClassName("val-pret")[0].innerHTML);
            let pagini_a = parseInt(a.getElementsByClassName("val-pagini")[0].innerHTML);
            let pret_b = parseFloat(b.getElementsByClassName("val-pret")[0].innerHTML);
            let pagini_b = parseInt(b.getElementsByClassName("val-pagini")[0].innerHTML);
            let raport_a = 1.0 * pagini_a / pret_a;
            let raport_b = 1.0 * pagini_b / pret_b;

            if (raport_a == raport_b) {
                let nume_a = a.getElementsByClassName("val-colectie")[0].innerHTML.toLowerCase();
                let nume_b = b.getElementsByClassName("val-colectie")[0].innerHTML.toLowerCase();
                return nume_a.localeCompare(nume_b) * semn;
            }
            
            return (raport_a - raport_b) * semn;
        });

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

    document.getElementById("calcul").onclick = function() {
        let suma = 0;
        let nr = 0;
        
        var produse = document.getElementsByClassName("produs");
        for (let prod of produse) {
            let pret = parseFloat(prod.getElementsByClassName("val-pret")[0].innerHTML);
            suma += pret;
            nr++;
        }

        let medie = suma / nr;
        let mesaj = document.createElement("div");
        mesaj.innerText = "Media prețurilor este: " + medie;
        mesaj.style.position = "fixed";
        mesaj.style.padding = "0.5rem";
        mesaj.style.bottom = "10px";
        mesaj.style.right = "30px";
        mesaj.style.backgroundColor = "white";
        mesaj.style.border = "1px solid black";
        document.body.appendChild(mesaj);

        setTimeout(() => document.body.removeChild(mesaj), 2000);
    }
}