/**
 * @typedef Drepturi
 * @type {Object}
 * @property {Symbol} vizualizareUtilizatori Dreptul de a intra pe pagina cu tabelul de utilizatori.
 * @property {Symbol} stergereUtilizatori Dreptul de a sterge un utilizator
 * @property {Symbol} cumparareProduse Dreptul de a cumpara
 * @property {Symbol} modificareListaProduse Dreptul de a adauga sau sterge produse
 * @property {Symbol} modificareProduse Dreptul de a modifica detaliile despre un produs
 * @property {Symbol} accesareBibliotecaVirtuala Dreptul de a accesa biblioteca virtuala
 * @property {Symbol} vizualizareGrafice Dreptul de a vizualiza graficele de vanzari
 */

/**
 * @name module.exports.Drepturi
 * @type {Drepturi}
 */
const Drepturi = {
    vizualizareUtilizatori: Symbol("vizualizareUtilizatori"),
    stergereUtilizatori: Symbol("stergereUtilizatori"),
    cumparareProduse: Symbol("cumparareProduse"),
    modificareListaProduse: Symbol("modificareListaProduse"),
    modificareProduse: Symbol("modificareProduse"),
    accesareBibliotecaVirtuala: Symbol("accesareBibliotecaVirtuala"),
    vizualizareGrafice: Symbol("vizualizareGrafice")
}

module.exports = Drepturi;