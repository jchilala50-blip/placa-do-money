(function () {

let janela = null;

window.abrirJanelaAnalise = function () {

    if (janela) {
        janela.style.display = "block";
        return;
    }

    janela = document.createElement("div");

    janela.id = "janela-analise";

    janela.innerHTML = `
        <div id="topo-analise">

            <span id="titulo-analise">
                SISTEMA DE ANÁLISES DO MERCADO
            </span>

            <span id="fechar-analise">
                ✖
            </span>

        </div>

        <div id="status-live">

            <span id="led-live"></span>

            <span>LIVE</span>

        </div>

        <div id="conteudo-analise">

    <div id="painel-status">

        <div id="status-tick">

            <span id="led-live"></span>

            <span id="texto-live">AGUARDANDO TICKS...</span>

        </div>

    </div>

    <div id="cards-analise">

<div class="card-analise">

<div class="titulo-card" id="titulo-volatilidade">
Volatility 100 (1s) Index
</div>

<div class="tipo-estrategia">
PARES
</div>

<div class="barra-texto">

<span class="blocos-barra" id="barra-pares">
□□□□□□□□□□
</span>

<span class="valor-percentagem" id="percentual-pares">
0%
</span>

</div>

<div class="bot-recomendado">
✔ Bot recomendado:
<b id="bot-pares">VORTEX</b>
</div>

</div>
</div>

</div>

</div>
    `;

    document.body.appendChild(janela);

    document
        .getElementById("fechar-analise")
        .onclick = function () {

            janela.style.display = "none";

        };

};

})();

// === FUNÇÃO ATUALIZAR CARTÃO ==

function atualizarCartaoPares(percentagem, bot) {

    const percentual =
        document.getElementById("percentual-pares");

    const barra =
        document.getElementById("barra-pares");

    const botRecomendado =
        document.getElementById("bot-pares");

    if (!percentual || !barra || !botRecomendado) {
        return;
    }

    percentual.innerText = percentagem + "%";

    const blocosCheios =
        Math.round(percentagem / 10);

    barra.innerText =
        "■".repeat(blocosCheios) +
        "□".repeat(10 - blocosCheios);

    if (percentagem <= 30) {

        barra.style.color = "#ff1744";

    } else {

        barra.style.color = "#00ff66";

    }

    botRecomendado.innerText = bot;

}

// === =========================================
function atualizarStatusLive() {

    const led = document.getElementById("led-live");
    const texto = document.getElementById("texto-live");

    if (!led || !texto) {
        return;
    }

    led.style.background = "#00ff00";
    led.style.boxShadow = "0 0 10px #00ff00";

    texto.innerText = "LIVE";

}
