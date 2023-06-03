let tema = localStorage.getItem("tema");

if (tema) {
    document.body.classList.add("dark");
    document.body.dataset.bsTheme = "dark";
}

window.addEventListener("DOMContentLoaded", function() {
    document.getElementById("switchTema").checked = tema == "dark";
    document.getElementById("switchTema").onchange = function() {
        if (document.body.classList.contains("dark")) {
            document.body.classList.remove("dark");
            document.body.dataset.bsTheme = "light";
            localStorage.removeItem("tema");
        } else {
            document.body.classList.add("dark")
            document.body.dataset.bsTheme = "dark";
            localStorage.setItem("tema","dark");
        }
    }
});
