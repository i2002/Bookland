window.onload = function() {
    var formular = document.getElementById("form_inreg");
    if (formular) {
        formular.onsubmit = function() {
            if (document.getElementById("parl").value != document.getElementById("rparl").value) {
                alert("Nu ati introdus același șir pentru câmpurile \"parolă\" și \"reintroducere parolă\".");
                return false;
            }

            return true;
        }
    }
}
