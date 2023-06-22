// paginare
const k = 4; // numar de elemente afisate pe o pagina

function check_removed_prod(id) {
    let rem = sessionStorage.getItem("removed_prods");
    return rem == null ? false : rem.split(",").includes(id);
}

function ignored_prod(prod) {
    let id = prod.id.split("_")[1];
    return prod.dataset.filtered == "true" || prod.dataset.hidden == "true" || check_removed_prod(id);
}

function paginate(page = 1) {
    // compute number of products
    let produse = document.getElementsByClassName("produs");
    let len = Array.from(produse).reduce((res, prod) => res += ignored_prod(prod) ? 0 : 1, 0);
    let nrl = Math.ceil(len / k);

    // pagination buttons
    let pagination = "";
    for (let i = 0; i < nrl; i++) {
        pagination += `<button type="button" class="btn btn-outline-secondary${i + 1 == page ? " active" : ""}" href="#" onclick="paginate(${i + 1})">${i + 1}</button>`;
    }
    document.querySelector(".pagination").innerHTML = pagination;

    // show only selected page
    let start = (page - 1) * k;
    let end = page * k - 1;
    for (let i = 0, j = 0; i < produse.length; i++) {
        let prod = produse[i];
        prod.style.display = "none";
        if (!ignored_prod(prod)) {
            if (j >= start && j <= end) {
                prod.style.display = "";
            }
            j++;
        }
    }
}

function pin_product(prod_id) {
    // setare informatie produs
    let prod = document.getElementById("elem_" + prod_id);
    prod.dataset.pinned = "true";
    prod.querySelector("div").classList.add("bg-secondary-subtle");

    // modificare buton
    let btn = document.querySelector(`#elem_${prod_id} .pin-prod`);
    let icon = document.querySelector(`#elem_${prod_id} .pin-prod i`);
    icon.classList.remove("bi-pin-angle-fill");
    icon.classList.add("bi-pin-fill");
    btn.classList.remove("btn-outline-primary");
    btn.classList.add("btn-primary");

    // actualizare callback
    btn.setAttribute("onclick", `unpin_product(${prod_id})`);
}

function unpin_product(prod_id) {
    // setare informatie produs
    let prod = document.getElementById("elem_" + prod_id);
    prod.dataset.pinned = "false";
    prod.querySelector("div").classList.remove("bg-secondary-subtle");

    // modificare buton
    let btn = document.querySelector(`#elem_${prod_id} .pin-prod`);
    let icon = document.querySelector(`#elem_${prod_id} .pin-prod i`);
    icon.classList.add("bi-pin-angle-fill");
    icon.classList.remove("bi-pin-fill");
    btn.classList.add("btn-outline-primary");
    btn.classList.remove("btn-primary");

    // actualizare callback
    btn.setAttribute("onclick", `pin_product(${prod_id})`);
}

function hide_product(prod_id) {
    // setare informatie produs
    let prod = document.getElementById("elem_" + prod_id);
    prod.dataset.hidden = "true";
    prod.style.display = "none";
    paginate();
}

function remove_product(prod_id) {
    if (!confirm("Doriți să ștergeți produsul pentru sesiunea curentă?")) {
        return;
    }

    rem = sessionStorage.getItem("removed_prods");
    new_rem = rem != null ? [...rem.split(","), prod_id].join(",") : String(prod_id);
    sessionStorage.setItem("removed_prods", new_rem)
    
    // refresh produse
    paginate();
}

window.onload = function() {
    // Initializare paginare
    paginate();

    // Filtrare
    let filter = function() {
        // functii ajutatoare
        let parseText = function(str) {
            return str.toLowerCase()
                .replaceAll(' ', '_')
                .replaceAll('ă', 'a')
                .replaceAll('â', 'a')
                .replaceAll('î', 'i')
                .replaceAll('ș', 's')
                .replaceAll('ț', 't');
        }

        // preluare valori formular filtrare
        let val_titlu = document.getElementById("inp-titlu").value;
        let val_autor = document.getElementById("inp-autor").value;
        let val_descriere = document.getElementById("inp-descriere").value;
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

        // salvare inputuri    
        if(getCookie("acceptat_banner") && document.getElementById("salvare-filtre").checked) {
            setCookie("filtre_produse", JSON.stringify({
                val_titlu,
                val_autor,
                val_descriere,
                val_oferta,
                val_formate,
                val_pagini,
                val_col,
                val_limba
            }), 100000);
        }

        // filtrare produse
        let fara_produse = true;
        var produse = document.getElementsByClassName("produs");
        for (let prod of produse) {
            prod.style.display = "none";
            prod.dataset.filtered = "true";
            prod.dataset.hidden = "false";

            // preluare informatii produse
            let titlu = parseText(prod.getElementsByClassName("val-titlu")[0].innerHTML);
            let autor = parseText(prod.getElementsByClassName("val-autor")[0].innerHTML);
            let descriere = parseText(prod.getElementsByClassName("descriere-prod")[0].innerHTML);
            let oferta = prod.getElementsByClassName("val-oferta")[0].innerHTML;
            let pagini = parseFloat(prod.getElementsByClassName("val-pagini")[0].innerHTML);
            let colectie = prod.getElementsByClassName("val-colectie")[0].innerHTML;
            let formate = prod.getElementsByClassName("val-formate")[0].innerHTML.split(',');
            let limba = prod.getElementsByClassName("val-limba")[0].innerHTML;

            // calculare conditii filtrare
            let cond1 = titlu.startsWith(parseText(val_titlu));
            let cond2 = autor.startsWith(parseText(val_autor));
            let cond3 = descriere.startsWith(parseText(val_descriere));
            let cond4 = val_oferta == "toate" || (val_oferta == "1" && oferta == "Da" || val_oferta == "0" && oferta == "Nu");
            let cond5 = pagini >= val_pagini;
            let cond6 = val_col == "toate" || (val_col == colectie);
            let cond7 = val_formate.length == 0 || formate.reduce((found, value) => found || val_formate.includes(value), false);
            let cond8 = val_limba.length == 0 || val_limba.includes(limba);
            let filter = cond1 && cond2 && cond3 && cond4 && cond5 && cond6 && cond7 && cond8

            // verificare daca este exclus din sesiune
            let id = prod.id.split("_")[1];
            let excluded = check_removed_prod(id);

            // afisare produs daca corespunde conditiilor
            if (!excluded && (prod.dataset.pinned == "true" || filter)) {
                prod.style.display = "";
                prod.dataset.filtered = "false";
                fara_produse = false;
            }
        }

        // afisare mesaj fara produse
        document.querySelector(".fara-produse").style.display = fara_produse ? "" : "none";

        // recalculare paginare
        paginate();
    }

    // Initializare filtrare
    function initializare_filtre() {
        // preluare valori din cookie
        let valori = getCookie("filtre_produse")
        if(!valori) {
            return;
        }
        
        const {val_titlu, val_autor, val_descriere, val_oferta, val_formate, val_pagini, val_col, val_limba} = JSON.parse(valori);
        
        // preluare valori formular filtrare
        document.getElementById("inp-titlu").value = val_titlu;
        document.getElementById("inp-autor").value = val_autor;
        document.getElementById("inp-descriere").value = val_descriere;
        let radio_buttons = document.getElementsByName("gr_rad");
        for (let r of radio_buttons) {
            if (r.value == val_oferta) {
                r.checked = true;
                break;
            }
        }
        let checkbox_buttons = document.getElementsByName("gr_chk");
        for (let c of checkbox_buttons) {
            if (val_formate.includes(c.value)) {
                c.checked = true;
            }
        }
        document.getElementById("inp-pagini").value = val_pagini;
        document.getElementById("inp-colectie").value = val_col;
        Array.from(document.getElementById("inp-limba").options).forEach(option => {
            if (val_limba.includes(option.value)) {
                option.selected = true;
            }
        });
        
        // aplicare filtrare
        filter();
    }
    initializare_filtre();
    
    // Executare filtrare
    document.getElementById("filtrare").onclick = filter;
    document.getElementById("inp-titlu").onchange = filter;
    document.getElementById("inp-autor").onchange = filter;
    document.getElementById("inp-descriere").onchange = filter;
    for (let r of document.getElementsByName("gr_rad")) {
        r.onchange = filter;
    }
    for (let c of document.getElementsByName("gr_chk")) {
        c.onchange = filter;
    }
    document.getElementById("inp-pagini").oninput = filter;
    document.getElementById("inp-colectie").onchange = filter;
    document.getElementById("inp-limba").onchange = filter;
    document.getElementById("salvare-filtre").onchange = filter;

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
        document.getElementById("salvare-filtre").checked = false;

        // afisare toate produsele
        filter();

        // stergere cookie
        deleteCookie("filtre_produse");
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
            if (!ignored_prod(prod)) {
                let pret = parseFloat(prod.getElementsByClassName("val-pret")[0].innerHTML);
                suma += pret;
                nr++;
            }
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
