const AccesBD = require('./accesbd.js');
const { RolFactory } = require('./roluri.js');
const parole = require('./parole.js');
const crypto = require("crypto");
const nodemailer = require("nodemailer");


/**
 * Reprezinta datele despre un utilizator al site-ului
 */
class Utilizator {
    static tipConexiune = "local";
    static tabel = "utilizatori"
    static parolaCriptare = "tehniciweb";
    static emailServer = "i2002.mailer@gmail.com";
    static lungimeCod = 64;
    static numeDomeniu = "localhost:8080";
    #eroare;


    /**
     * Constructor instanta utilizator
     * 
     * @param {ObiectUtilizator} obj
     */
    constructor({id, username, nume, prenume, email, parola, rol, data_nastere, culoare_chat = "black", poza} = {}) {
        this.id = id;

        try {
            if (this.checkUsername(username)) {
                this.username = username;
            }
        }
        catch(e) {
            this.#eroare = e.message
        }

        for (let prop in arguments[0]) {
            this[prop] = arguments[0][prop];
        }

        if (this.rol) {
            this.rol = this.rol.cod ? RolFactory.creeazaRol(this.rol.cod) : RolFactory.creeazaRol(this.rol);
        }

        this.#eroare = "";
    }


    /**
     * Setter proprietatea username (folosita doar la inregistrare si modificare profil)
     * 
     * @param {string} username - username-ul dorit
     */
    set setareUsername(username) {
        if (this.checkUsername(username)) {
            this.username = username;
        } else {
            throw new Error("Username greșit");
        }
    }

    /**
     * Setter proprietatea nume
     *
     * @param {string} nume - numele dorit
     */
    set setareNume(nume) {
        if (this.checkName(nume)) {
            this.nume = nume;
        } else {
            throw new Error("Prenume greșit");
        }
    }

    /**
     * Setter proprietatea prenume
     *
     * @param {string} prenume - prenumele dorit
     */
    set setarePrenume(prenume) {
        if (this.checkName(prenume)) {
            this.prenume = prenume;
        } else {
            throw new Error("Prenume greșit");
        }
    }

    /**
     * Setter proprietatea email
     *
     * @param {string} email - email-ul dorit
     */
    set setareEmail(email) {
        if (this.checkEmail(email)) {
            this.email = email;
        } else {
            throw new Error("Format email greșit");
        }
    }

    /**
     * Setter proprietatea parola
     *
     * @param {string} parola - parola dorita
     */
    set setareParola(parola) {
        if (this.checkParola(parola)) {
            this.parola = parola;
        } else {
            throw new Error("Parola trebuie să conțină cel puțin o cifră");
        }
    }

    /**
     * Setter proprietatea parola
     *
     * @param {string} data_nastere - parola dorita
     */
    set setareDataNastere(data_nastere) {
        if (data_nastere != "") {
            this.data_nastere = data_nastere;
        } else {
            throw new Error("Data nașterii este obligatorie");
        }
    }


    /**
     * Verifica daca username-ul corespunde formatului dorit
     *
     * @param {string} username - username-ul de verificat
     * @returns {boolean}
     */
    checkUsername(username) {
        return username != "" && username.match(new RegExp("^[A-Za-z0-9#_./]+$"));
    }

    /**
     * Verifica daca numele corespunde formatului dorit
     *
     * @param {string} nume - numele de verificat
     * @returns {boolean}
     */
    checkName(nume) {
        return nume != "" && nume.match(new RegExp("^[A-ZĂÂÎȘȚ][a-zăâîșț]+$"));
    }

    /**
     * Verifica daca email-ul corespunde formatului dorit
     * 
     * @param {string} email - email-ul de verificat
     * @returns {boolean}
     */
    checkEmail(email) {
        return email != "" && email.match(new RegExp("^[A-Za-z0-9\-_]*@[a-zA-Z0-9]*.[a-zA-Z]{2,3}$"));
    }

    /**
     * Verifica daca parola corespunde formatului dorit
     * 
     * @param {string} parola - parola de verificat
     * @returns {boolean}
     */
    checkParola(parola) {
        return parola != "" && parola.match(new RegExp("^.*[0-9].*$"));
    }


    /**
     * Cripteaza parola data
     * 
     * @param {string} parola - parola in cleartext
     * @returns {string}
     */
    static criptareParola(parola) {
        return crypto.scryptSync(parola, Utilizator.parolaCriptare, Utilizator.lungimeCod).toString("hex");
    }

    /**
     * Genereaza link-ul de confirmare pe baza tokenului salvat
     * 
     * @param {string} token - tokenul generat
     * @returns {string}
     */
    generareLinkConfirmare(token) {
        let token1 = token.slice(0, 10);
        let token2 = token.slice(10);
        let username = this.username.split("").reverse().join("");
        return `http://${Utilizator.numeDomeniu}/confirmare_inreg/${token1}/${username}/${token2}`;
    }

    /**
     * Salveaza datele despre utilizator in baza de date
     */
    salvareUtilizator() {
        let parolaCriptata = Utilizator.criptareParola(this.parola);
        let utiliz = this;
        let token = parole.genereazaToken(this.username);

        AccesBD.getInstanta(Utilizator.tipConexiune).insert({
            tabel: Utilizator.tabel,
            campuri: {
                username: this.username,
                nume: this.nume,
                prenume: this.prenume,
                parola: parolaCriptata,
                email: this.email,
                data_nastere: this.data_nastere,
                culoare_chat: this.culoare_chat,
                cod: token,
                poza: this.poza
            }
        }, function(err, rez) {
            if (err) {
                console.log(err);
            } else {
                utiliz.trimiteMail(
                    `Bună, ${utiliz.username}`,
                    "Username-ul tau este " + utiliz.username,
                    `<p><span style='font-size:1.25rem;background-color:lightblue;'>Bine ai venit<span> în comunitatea Bookland!</p><p>Username-ul tau este ${utiliz.username}.</p><p><a href='${utiliz.generareLinkConfirmare(token)}'>Click aici pentru a confirma contul</a></p>`,
                );
            }
        });
    }

    /**
     * Modifica datele despre utilizator in baza de date
     * 
     * @param {Object} obParam - coloana si valoarea specifica
     */
    modifica(obParam) {
        Utilizator.getUtilizDupaUsername(this.username, obParam, function(u, obParam, err) {
            // utilizatorul nu exista
            if (err == -1) {
                console.error("Utilizatorul nu exista in baza de date");
                throw new Error("Utilizatorul nu exista in baza de date");
            }

            AccesBD.getInstanta(Utilizator.tipConexiune).update({
                tabel: Utilizator.tabel,
                campuri: obParam,
                conditii: [[`username='${this.username}'`]]
            }, function(err, rez) {
                if (err) {
                    console.error("Modificare utilizator:", err);
                } else {
                    // actualizare campuri clasa
                    for (let prop in obParam) {
                        this[prop] = obParam[prop];
                    }

                    console.log("Utilizatorul a fost modificat cu succes");
                }
            });
        });
    }

    /**
     * Sterge utilizator din baza de date
     */
    sterge() {
        Utilizator.getUtilizDupaUsername(this.username, null, function(u, obparam, err) {
            // utilizatorul nu exista
            if (err == -1) {
                console.error("Utilizatorul nu exista in baza de date");
                throw new Error("Utilizatorul nu exista in baza de date");
            }

            AccesBD.getInstanta(Utilizator.tipConexiune).delete({
                tabel: Utilizator.tabel,
                conditii: [[`username='${this.username}'`]]
            }, function(err, rez) {
                if (err) {
                    console.error("Stergere utilizator:", err);
                } else {
                    console.log("Utilizatorul a fost sters cu succes");
                }
            });
        });
    }

    /**
     * Trimite un email catre adresa utilizatorului cu continutul specificat de parametri
     * 
     * @param {string} subiect - subiectul email-ului
     * @param {string} mesajText - mesajul care apare daca email-ul este vizualizat in format text
     * @param {string} mesajHtml - mesajul care apare daca email-ul este vizualizat in format HTML
     * @param {Array} atasamente - vector de fisiere atasate
     */
    async trimiteMail(subiect, mesajText, mesajHtml, atasamente = []) {
        var transp = nodemailer.createTransport({
            service: "gmail",
            secure: false,
            auth: {
                user: Utilizator.emailServer,
                pass: "wreoigzypqarvivu"
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        await transp.sendMail({
            from: Utilizator.emailServer,
            to: this.email,
            subject: subiect,
            text: mesajText,
            html: mesajHtml,
            attachments: atasamente
        });

        console.log(`> Email trimis catre "${this.email}"`);
    }


    /**
     * Verifica daca utilizatorul are un anumit drept
     *
     * @param {Symbol} drept dreptul de verificat
     * @returns {boolean}
     */
    areDreptul(drept) {
        return this.rol.areDreptul(drept);
    }


    /**
     * Preia asincron utilizatorul dupa username-ul lui
     * 
     * @param {string} username - username-ul utilizatorului dorit
     * @returns {Utilizator}
     */
    static async getUtilizDupaUsernameAsync(username) {
        if (!username) {
            return null;
        }

        try {
            let rezSelect = await AccesBD.getInstanta(Utilizator.tipConexiune).selectAsync({
                tabel: "utilizatori",
                campuri: ['*'],
                conditii: [[`username='${username}'`]]
            });

            if(rezSelect.rowCount != 0) {
                return new Utilizator(rezSelect.rows[0]);
            } else {
                console.log("getUtilizDupaUsernameAsync: Nu am gasit utilizatorul");
                return null;
            }
        }
        catch (e) {
            console.log(e);
            return null;
        }
    }


    /**
     * @callback UserQueryCallback Callback pentru cautarea unui utilizator
     * @param {Utilizator} u - utilizatorul gasit
     * @param {Object} obparam - proprietatile primite
     * @param {number} eroare - codul erorii, daca exista
     */

    /**
     * Preia utilizatorul dupa username-ul lui
     * 
     * @param {string} username - username-ul utilizatorului dorit
     * @param {Object} obparam - proprietati pentru functia de callback
     * @param {UserQueryCallback} proceseazaUtiliz - functie callback pentru prelucrarea rezultatului
     * @returns 
     */
    static getUtilizDupaUsername(username, obparam, proceseazaUtiliz) {
        if (!username) {
            return null;
        }

        let eroare = null;
        AccesBD.getInstanta(Utilizator.tipConexiune).select({
            tabel: "utilizatori",
            campuri: ['*'],
            conditii: [[`username='${username}'`]]
        }, function (err, rezSelect) {
            if (err) {
                console.error("Utilizator:", err);
                console.log("Utilizator", rezSelect.rows.length);
                eroare = -2;
            } else if (rezSelect.rowCount==0) {
                eroare = -1;
            }

            let u = new Utilizator(rezSelect.rows[0]);
            proceseazaUtiliz(u, obparam, eroare);
        });
    }


    /**
     * @callback UserMultiQueryCallback Callback pentru cautarea de utilizatori
     * @param {Error} err - eventuala eroare in urma query-ului
     * @param {Utilizator[]} listaUtiliz - lista de utilizatori returnata
     */

    /**
     * Cauta utilizatori dupa anumite criterii
     * 
     * @param {Object} obParam - perechi nume coloana valoare cu conditiile de cautare
     * @param {UserMultiQueryCallback} callback - functie de callback pentru procesarea rezultatului
     */
    static cauta(obParam, callback) {
        let campuriCautare = [];
        for (let prop in obParam) {
            campuriCautare.push(`${prop}='${obParam[prop]}'`);
        }

        AccesBD.getInstanta(Utilizator.tipConexiune).select({
            tabel: Utilizator.tabel,
            campuri: ['*'],
            conditii: [campuriCautare]
        }, function(err, rez) {
            if (err) {
                console.error("Cautare utilizatori:", err);
                callback(err, []);
                return;
            }

            let listaUtiliz = rez.rows.map(row => new Utilizator(row));
            callback(null, listaUtiliz);
        });
    }


    static async cautaAsync(obParam) {
        let campuriCautare = [];
        for (let prop in obParam) {
            campuriCautare.push(`${prop}='${obParam[prop]}'`);
        }

        try {
            let res = await AccesBD.getInstanta(Utilizator.tipConexiune).selectAsync({
                tabel: Utilizator.tabel,
                campuri: ['*'],
                conditii: [campuriCautare]
            });

            return res.map(row => new Utilizator(row));
        }
        catch (err) {
            console.error("Cautare async utilizatori:", err);
            return [];
        }
    }
}

module.exports = {Utilizator:Utilizator}
