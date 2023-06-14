var sirAlphaNum = "";
var v_intervale = [[48,57],[65,90],[97,122]];

for(let interval of v_intervale) {
    for (let i = interval[0]; i <= interval[1]; i++) {
        sirAlphaNum += String.fromCharCode(i);
    }
}

/**
 * Genereaza un token de n caractere alfanumerice (de forma [0-9a-zA-Z])
 * 
 * @param {number} n lungimea tokenului
 * @returns {string}
 */
function genereazaToken(n) {
    let token = "";
    for (let i = 0; i < n; i++) {
        token += sirAlphaNum[Math.floor(Math.random() * sirAlphaNum.length)];
    }
    return token;
}

module.exports.genereazaToken = genereazaToken;
