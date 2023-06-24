// --- Preluare produse ---
async function query_prods(filtre = {}, sortare = {}) {
    // query produse 
    let res = await fetch("/api/produse?" + new URLSearchParams({
        pinned: Array.from(pinnedProds),
        removed: sessionStorage.getItem("removed_prods"),
        ...filtre,
        ...sortare
    }));
    let data = await res.json();
    let prods = data.rows;

    // stergere lista produse
    let produse = document.querySelector(".grid-produse");
    produse.innerHTML = "";

    // generare elemente produse
    for (const prod_data of prods) {
        let prod = populare_produs(prod_data);
        produse.append(prod);
    }

    // actualiazre produse pinned
    pinnedProds.forEach(id => pin_product(id));

    // mesaj fara produse
    document.querySelector(".fara-produse").classList.toggle("d-none", prods.length != 0)

    // recalculare paginare
    paginate();
}

function populare_produs(prod_data) {
    // functii formatare
    let formatareData = function(data) {
        let d = new Date(data);

        let zi = d.getDate();
        let luna = new Intl.DateTimeFormat("ro-RO", {month: "long"}).format(d);
        luna = luna[0].toUpperCase() + luna.slice(1);
        let an = d.getFullYear();
        let zi_sapt = new Intl.DateTimeFormat("ro-RO", {weekday: "long"}).format(d);
        zi_sapt = zi_sapt[0].toUpperCase() + zi_sapt.slice(1);

        return `${zi} ${luna} ${an} (${zi_sapt})`;
    }

    let normalizareNumeColectie = function(colectie) {
        return colectie
            .toLowerCase()
            .replaceAll(' ', '_')
            .replaceAll('ă', 'a')
            .replaceAll('â', 'a')
            .replaceAll('î', 'i')
            .replaceAll('ș', 's')
            .replaceAll('ț', 't');
    }

    // preluare template
    let prod_template = document.getElementById("template-produs");
    let prod = prod_template.content.cloneNode(true);

    // introducere date
    prod.querySelector("article").setAttribute("id", `elem_${prod_data.id}`);
    prod.querySelector("article").classList.add(normalizareNumeColectie(prod_data.colectie));
    prod.querySelector(".titlu a").setAttribute("href", `/produs/${prod_data.id}`);
    prod.querySelector(".val-titlu").innerText = prod_data.titlu;
    prod.querySelector(".val-pret").innerText = prod_data.pret;
    prod.querySelector(".val-pagini").innerText = prod_data.nr_pagini;
    prod.querySelector(".val-limba").innerText = prod_data.limba;
    prod.querySelector(".val-formate").innerText = prod_data.format;
    prod.querySelector("time").innerText = formatareData(prod_data.data_adaugare);
    prod.querySelector("time").setAttribute("datetime", (new Date(prod_data.data_adaugare)).toISOString());
    prod.querySelector(".val-oferta").innerText = prod_data.oferta ? "Da" : "Nu";
    prod.querySelector(".val-an-aparitie").innerText = prod_data.anul_aparitiei;
    prod.querySelector("figure a").setAttribute("href", `/produs/${prod_data.id}`);
    prod.querySelector("figure a img").setAttribute("src", `/resurse/img/produse/${prod_data.imagine ? prod_data.imagine : "book-cover.jpg"}`);
    prod.querySelector(".descriere-prod").innerText = prod_data.descriere;
    prod.querySelector(".val-colectie").innerText = prod_data.colectie;
    prod.querySelector(".pin-prod").setAttribute("onclick", `pin_product(${prod_data.id})`);
    prod.querySelector(".hide-prod").setAttribute("onclick", `hide_product(${prod_data.id})`);
    prod.querySelector(".remove-prod").setAttribute("onclick", `remove_product(${prod_data.id})`);

    return prod;
}


// --- Filtrare produse ---
// Filtrare date
var filter_data = {};
function filter() {
    // preluare date filtrare
    filter_data = get_filter_data();

    // salvare inputuri
    if(getCookie("acceptat_banner") && document.getElementById("salvare-filtre").checked) {
        setCookie("filtre_produse", JSON.stringify(filter_data), 100000);
    }

    // preluare produse        
    query_prods(filter_data, sort_data);
}

// Preluare date filtrare
function get_filter_data() {
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

    return {
        val_titlu,
        val_autor,
        val_descriere,
        val_oferta,
        val_formate,
        val_pagini,
        val_col,
        val_limba
    }
}

// Initializare filtre
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

// Resetare filtre
function resetare_filtre() {
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


// --- Sortare produse ---
// Efectuare sortare
var sort_data = {};
function sort() {
    // preluare date filtrare si sortare
    sort_data = get_sort_data();

    // preluare produse
    query_prods(filter_data, sort_data);
}

// Preluare date sortare
function get_sort_data() {
    let sort_crit1 = document.getElementById("sort-crit1").value;
    let sort_crit2 = document.getElementById("sort-crit2").value;
    let sort_dir = document.getElementById("sort-dir").value;

    return {
        sort_crit1,
        sort_crit2,
        sort_dir
    }
}


// --- Paginare produse ---
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

// --- Actiuni produse ---
var pinnedProds = new Set();
function pin_product(prod_id) {
    // adaugare in lista
    pinnedProds.add(prod_id);

    // modificare produs
    let prod = document.getElementById("elem_" + prod_id);
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
    // scoatere din lista
    pinnedProds.delete(prod_id);

    // modifcare produs
    let prod = document.getElementById("elem_" + prod_id);
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
    // confirmare stergere
    if (!confirm("Doriți să ștergeți produsul pentru sesiunea curentă?")) {
        return;
    }

    // stergere
    rem = sessionStorage.getItem("removed_prods");
    new_rem = rem != null ? [...rem.split(","), prod_id].join(",") : String(prod_id);
    sessionStorage.setItem("removed_prods", new_rem)
    
    // refresh produse
    paginate();
}


// --- Initializare pagina ---
window.onload = function() {
    // Initializare componente pagina
    // - query produse initial
    query_prods();

    // - initializare filtre
    initializare_filtre();
    
    // Inregistrare evenimente
    // - executare filtrare
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

    // - resetare filtrare
    document.getElementById("resetare").onclick = resetare_filtre;

    // - validare texarea
    document.getElementById("inp-descriere").oninput = function() {
        if (!this.value.match(/.*\d.*/)) {
            document.getElementById("inp-descriere").classList.remove("is-invalid");
            document.querySelector("#inp-descriere + label").innerText = "";
        }
    }

    // - actualizare label input range
    document.getElementById("inp-pagini").onchange = function() {
        document.getElementById("infoRange").innerHTML = `(${this.value})`;
    }

    // - executare sortare
    document.getElementById("sortCustom").onclick = sort;
}
