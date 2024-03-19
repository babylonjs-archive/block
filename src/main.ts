import { Game } from "./Game.js";

function start() {
    window.removeEventListener("click", start);
    document.getElementById("intro")!.style.display = "none";
    document.getElementById("game")!.style.display = "block";
    const game = new Game("renderCanvas");
    game.start();
}

window.addEventListener("click", start);
