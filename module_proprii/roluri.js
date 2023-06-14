const Drepturi = require('./drepturi.js');

class Rol {
    /**
     * @type {string} - denumirea tipului
     */
    static get tip() {
        return "generic";
    }

    /**
     * @type {Symbol[]} - drepturi lista de drepturi pentru rol
     */
    static get drepturi() {
        return [];
    }

    constructor() {
        this.cod = this.constructor.tip;
    }

    /**
     * Verifica daca rolul are un anumit drept
     * 
     * @param {Symbol} drept Dreptul pe care vrem sa vedem daca il are rolul
     * @returns {boolean}
     */
    areDreptul(drept) {
        console.log("in metoda rol!!!!");
        return this.constructor.drepturi.includes(drept);
    }
}

class RolAdmin extends Rol {
    static get tip() {
        return "admin";
    }

    constructor() {
        super();
    }

    areDreptul() {
        return true;
    }
}

class RolModerator extends Rol {
    static get tip() {
        return "moderator"
    }

    static get drepturi() { 
        return [
            Drepturi.vizualizareUtilizatori,
            Drepturi.stergereUtilizatori
        ];
    }

    constructor() {
        super();
    }
}

class RolClient extends Rol {
    static get tip() {
        return "comun"
    }
    
    static get drepturi() {
        return [
            Drepturi.cumparareProduse,
            Drepturi.accesareBibliotecaVirtuala
        ];
    }
    constructor() {
        super();
    }
}

class RolFactory {
    /**
     * Returneaza un rol pe baza string-ului corespunzator
     *
     * @param {string} tip codul corespunzator rolului
     * @returns {RolAdmin | RolModerator | RolClient}
     */
    static creeazaRol(tip) {
        switch(tip) {
            case RolAdmin.tip : return new RolAdmin();
            case RolModerator.tip : return new RolModerator();
            case RolClient.tip : return new RolClient();
        }
    }
}

module.exports = {
    RolFactory:RolFactory,
    RolAdmin:RolAdmin
}
