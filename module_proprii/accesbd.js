/*
ATENTIE!
inca nu am implementat protectia contra SQL injection
*/

const {Client} = require("pg");


class AccesBD {
    static #instanta = null;
    static #initializat = false;

    constructor() {
        if (AccesBD.#instanta) {
            throw new Error("Deja a fost instantiat");
        } else if (!AccesBD.#initializat) {
            throw new Error("Trebuie apelat doar din getInstanta; fara sa fi aruncat vreo eroare");
        }
    }


    /**
     * Initializeaza conexiunea cu serverul de baza de date
     */
    initLocal() {
        this.client = new Client({
            database:"Bookland",
            user:"tudor",
            password:"password", 
            host:"localhost", 
            port:5432
        });
        this.client.connect();
    }


    /**
     * Returneaza clientul configurat
     * 
     * @returns {Client}
     */
    getClient() {
        if (!AccesBD.#instanta) {
            throw new Error("Nu a fost instantiata clasa");
        }

        return this.client;
    }


    /**
     * @typedef {object} ObiectConexiune - obiect primit de functiile care realizeaza un query
     * @property {string} init - tipul de conexiune ("init", "render" etc.)
     * 
     */

    /**
     * Returneaza instanta unica a clasei
     *
     * @param {ObiectConexiune} obj - un obiect cu datele pentru query
     * @returns {AccesBD}
     */
    static getInstanta({init = "local"} = {}) {
        // console.log(this); // this-ul e clasa nu instanta pt ca metoda statica
        if (!this.#instanta) {
            this.#initializat = true;
            this.#instanta = new AccesBD();

            // initializarea poate arunca erori
            // vom adauga aici cazurile de initializare 
            // pentru baza de date cu care vrem sa lucram
            try {
                switch (init) {
                    case "local":
                        this.#instanta.initLocal();
                        break;
                }

                // daca ajunge aici inseamna ca nu s-a produs eroare la initializare
            }
            catch (e) {
                console.error("Eroare la initializarea bazei de date!");
            }

        }

        return this.#instanta;
    }


    /**
     * @typedef {object} ObiectQuerySelect Obiect primit de functiile care realizeaza un query
     * @property {string} tabel - numele tabelului
     * @property {string[]} campuri - o lista de stringuri cu numele coloanelor afectate de query; poate cuprinde si elementul "*"
     * @property {string[]} conditiiAnd - lista de stringuri cu conditii pentru where
     */

    /**
     * @callback QueryCallBack Callback pentru query-uri.
     * @param {Error} err - eventuala eroare in urma query-ului
     * @param {Object} rez - rezultatul query-ului
     */

    /**
     * Selecteaza inregistrari din baza de date
     *
     * @param {ObiectQuerySelect} obj - un obiect cu datele pentru query
     * @param {QueryCallBack} callback - o functie callback cu 2 parametri: eroare si rezultatul query-ului
     */
    select({tabel = "", campuri = [], conditiiAnd = []} = {}, callback, parametriQuery = []) {
        let conditieWhere = "";
        if (conditiiAnd.length > 0) {
            conditieWhere = `where ${conditiiAnd.join(" and ")}`; 
        }

        let comanda = `select ${campuri.join(",")} from ${tabel} ${conditieWhere}`;
        console.log("select:", comanda);
        this.client.query(comanda, parametriQuery, callback);
        /*comanda = `select id, camp1, camp2 from tabel where camp1=$1 and camp2=$2`;
        this.client.query(comanda,[val1, val2],callback) */
    }

    /**
     * Selecteaza asincron inregistrari din baza de date
     * 
     * @param {ObiectQuerySelect} obj - un obiect cu datele pentru query
     * @returns {QueryResult}
     */
    async selectAsync({tabel = "", campuri = [], conditiiAnd = []} = {}) {
        let conditieWhere = "";
        if (conditiiAnd.length > 0) {
            conditieWhere = `where ${conditiiAnd.join(" and ")}`;
        }
        
        let comanda = `select ${campuri.join(",")} from ${tabel} ${conditieWhere}`;
        console.log("selectAsync:", comanda);

        try {
            let rez = await this.client.query(comanda);
            console.log("selectasync:", rez);
            return rez;
        } catch (e) {
            console.log(e);
            return null;
        }
    }


    /**
     * @typedef {object} ObiectQueryInsert - obiect primit de functiile care realizeaza un query de insert
     * @property {string} tabel - numele tabelului
     * @property {object} campuri - un obiect cu asocierea nume coloana si valoare pentru coloanele ce vor fi setate in noua inregistrare
     */

    /**
     * Insereaza o inregistrare in baza de date
     *
     * @param {ObiectQueryInsert} obj - un obiect cu datele pentru insert 
     * @param {QueryCallBack} callback - o functie callback cu parametri de eroare si rezultatul query-ului
     */
    insert({tabel = "", campuri = {}} = {}, callback) {
        let strCampuri = Object.keys(campuri).join(",");
        let strValori = Object.values(campuri).map((x) => `'${x}'`).join(",");
        let comanda = `insert into ${tabel} (${strCampuri}) values (${strValori})`;
        console.log(comanda);
        this.client.query(comanda,callback)
    }


    /**
     * @typedef {object} ObiectQueryUpdate - obiect primit de functiile care realizeaza un query de update
     * @property {string} tabel - numele tabelului
     * @property {object} campuri - un obiect cu asocierea nume coloana si valoare pentru coloanele ce vor fi modificate
     * @property {string[]} conditiiAnd - lista de stringuri cu conditii pentru where
     */
    
    /**
     * Actualizarea unor inregistrari din baza de date
     * 
     * @param {ObiectQueryUpdate} obj - un obiect cu datele pentru update
     * @param {QueryCallBack} callback - o functie callback cu parametri de eroare si rezultatul query-ului
     */
    update({tabel = "", campuri = {}, conditiiAnd = []} = {}, callback) {
        let campuriActualizate = [];
        for (let prop in campuri) {
            campuriActualizate.push(`${prop}='${campuri[prop]}'`);
        }

        let conditieWhere = "";
        if (conditiiAnd.length > 0) {
            conditieWhere = `where ${conditiiAnd.join(" and ")}`;
        }

        let comanda = `update ${tabel} set ${campuriActualizate.join(", ")} ${conditieWhere}`;
        console.log(comanda);

        this.client.query(comanda, callback)
    }


    /**
     * @typedef {object} ObiectQueryDelete - obiect primit de functiile care realizeaza un query de update
     * @property {string} tabel - numele tabelului
     * @property {string[]} conditiiAnd - lista de stringuri cu conditii pentru where
     */

    /**
     * Sterge inregistrari din baza de date pe baza conditiei specificate
     *
     * @param {ObiectQueryDelete} obj - un obiect cu datele pentru delete
     * @param {QueryCallBack} callback - functie de callback pentru rezultat
     */
    delete({tabel = "", conditiiAnd = []} = {}, callback) {
        let conditieWhere = "";
        if (conditiiAnd.length > 0) {
            conditieWhere = `where ${conditiiAnd.join(" and ")}`;
        }
        
        let comanda = `delete from ${tabel} ${conditieWhere}`;
        console.log(comanda);
        this.client.query(comanda, callback)
    }


    /**
     * Trimite o comanda de SQL catre baza de date si executa callback-ul cu rezultatul primit
     *
     * @param {string} comanda - comanda SQL de executat
     * @param {QueryCallBack} callback - functie de callback pentru prelucrarea rezultatului
     */
    query(comanda, callback) {
        this.client.query(comanda, callback);
    }
}

module.exports = AccesBD;
