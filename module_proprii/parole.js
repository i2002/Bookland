// var sirAlphaNum = "";
// var v_intervale = [[48,57],[65,90],[97,122]];

// for(let interval of v_intervale) {
//     for (let i = interval[0]; i <= interval[1]; i++) {
//         sirAlphaNum += String.fromCharCode(i);
//     }
// }

// /**
//  * Genereaza un token de n caractere alfanumerice (de forma [0-9a-zA-Z])
//  * 
//  * @param {number} n lungimea tokenului
//  * @returns {string}
//  */
// function genereazaToken(n) {
//     let token = "";
//     for (let i = 0; i < n; i++) {
//         token += sirAlphaNum[Math.floor(Math.random() * sirAlphaNum.length)];
//     }
//     return token;
// }

/**
 * Genereaza un token de de n caractere cu codurile in vectorul dat
 * 
 * @param {number} n - lungimea tokenului
 * @param {number[]} range - vector cu codul de inceput si codul de final
 * @returns {string}
 */
function genereazaSir(n, charCodes = [48,57]) {
    let token = "";
    for (let i = 0; i < n; i++) {
        let code = charCodes[0] + Math.floor(Math.random() * (charCodes[1] - charCodes[0] + 1));
        token += String.fromCharCode(code);
    }

    return token;
}

/**
 * Genereaza token pentru utilizator
 * 
 * @param {string} username - numele de utilizator
 * @returns {string}
 */
function genereazaToken(username) {
    let token1 = genereazaSir(10, [48, 57]);
    let token2 = genereazaSir(70, [65, 80]);
    return `${token1}${username}-${token2}`;
}

module.exports.genereazaToken = genereazaToken;
