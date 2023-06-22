let tema = localStorage.getItem("tema");

if (tema) {
    document.body.classList.add("dark");
    document.body.dataset.bsTheme = "dark";
}

function setTheme(theme) {
    document.getElementById("switchTema").checked = theme == "dark";
    switch(theme) {
        case "light":
            document.body.classList.remove("dark");
            document.body.dataset.bsTheme = "light";
            document.querySelector("#theme-switch i").classList.add("fa-moon");
            document.querySelector("#theme-switch i").classList.remove("fa-sun");
            localStorage.removeItem("tema");
            break;

        case "dark":
            document.body.classList.add("dark")
            document.body.dataset.bsTheme = "dark";
            document.querySelector("#theme-switch i").classList.remove("fa-moon");
            document.querySelector("#theme-switch i").classList.add("fa-sun");
            localStorage.setItem("tema","dark");
            break;
    }
}

toggleTheme = function() {
    let newTheme = document.body.classList.contains("dark") ? "light" : "dark";
    setTheme(newTheme);
}

window.addEventListener("DOMContentLoaded", function() {
    setTheme(tema == "dark" ? "dark" : "light");
    document.getElementById("switchTema").onchange = toggleTheme;
    document.querySelector("#theme-switch i").onclick = toggleTheme;
});
