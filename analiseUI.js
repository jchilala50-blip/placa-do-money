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

            <span id="texto-live">LIVE</span>

        </div>

        <div id="conteudo-analise">

    <div id="painel-status">

    <div id="status-tick">

        <span id="led-status">🟡</span>

        <span id="texto-status">Working</span>

    </div>

</div>

    <div id="cards-analise">

<div class="card-analise">

<div style="
display:flex;
justify-content:space-between;
align-items:center;
">

<div class="titulo-card" id="titulo-volatilidade">
Volatility 100 (1s) Index
</div>

<div style="
display:flex;
align-items:center;
gap:10px;
font-size:10px;
font-weight:bold;
color:#00e676;
">

<span id="contador-orion">
ORION: 0
</span>

<span id="contador-vortex">
VORTEX: 0
</span>

<span id="temporizador-pares">
0s
</span>

</div>

</div>

<div class="tipo-estrategia">
ANÁLISE: ORION / VORTEX
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

<div class="card-analise">

<div style="
display:flex;
justify-content:space-between;
align-items:center;
">

<div class="titulo-card">
Volatility 100 (1s) Index
</div>

<div style="
display:flex;
align-items:center;
gap:10px;
font-size:10px;
font-weight:bold;
color:#00e676;
">

<span id="contador-titan">
TITAN: 0
</span>

<span id="contador-epic">
SUPER EPIC: 0
</span>

<span id="temporizador-under">
0s
</span>

</div>

</div>

<div class="tipo-estrategia">
ANÁLISE: TITAN / SUPER EPIC
</div>

<div class="barra-texto">

<span class="blocos-barra" id="barra-under">
□□□□□□□□□□
</span>

<span class="valor-percentagem" id="percentual-under">
0%
</span>

</div>

<div class="bot-recomendado">
✔ Bot recomendado:
<b id="bot-under">-</b>
</div>

</div>


<div class="card-analise">

<div style="
display:flex;
justify-content:space-between;
align-items:center;
">

<div class="titulo-card">
Volatility 100 (1s) Index
</div>

<div style="
display:flex;
align-items:center;
gap:10px;
font-size:10px;
font-weight:bold;
color:#00e676;
">

<span id="contador-phantom">
PHANTOM: 0
</span>

<span id="temporizador-phantom">
0s
</span>

</div>

</div>

<div class="tipo-estrategia">
ANÁLISE: MONEY PHANTOM
</div>

<div class="barra-texto">

<span class="blocks-barra" id="barra-phantom">
□□□□□□□□□□
</span>

<span class="valor-percentagem" id="percentual-phantom">
0%
</span>

</div>

<div class="bot-recommended">
✔ Bot recomendado:
<b id="bot-phantom">-</b>
</div>

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


let contadorOrion = 0;
let contadorVortex = 0;

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

// === SEGUNDO CARTÃO ==

function atualizarCartaoUnder(percentagem, bot) {

    const percentual =
        document.getElementById("percentual-under");

    const barra =
        document.getElementById("barra-under");

    const botRecomendado =
        document.getElementById("bot-under");

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

let temporizadorSemTicks = null;

function atualizarStatusLive() {

    const ledLive = document.getElementById("led-live");
    const textoLive = document.getElementById("texto-live");

    const ledStatus = document.getElementById("led-status");
    const textoStatus = document.getElementById("texto-status");

    if (
        !ledLive ||
        !textoLive ||
        !ledStatus ||
        !textoStatus
    ){
        return;
    }

    ledLive.style.background = "#00ff00";
    ledLive.style.boxShadow = "0 0 10px #00ff00";
    textoLive.innerText = "LIVE";

    ledStatus.style.background = "#ffd600";
    ledStatus.style.boxShadow = "0 0 10px #ffd600";
    textoStatus.innerText = "Working";

    clearTimeout(temporizadorSemTicks);

    temporizadorSemTicks = setTimeout(function(){

        ledLive.style.background = "#ff1744";
        ledLive.style.boxShadow = "0 0 10px #ff1744";
        textoLive.innerText = "LIVE";

        ledStatus.style.background = "#ff1744";
        ledStatus.style.boxShadow = "0 0 10px #ff1744";
        textoStatus.innerText = "No Ticks";

    },5000);

}


// ===============================
// TEMPORIZADOR DO CARTÃO PARES
// ===============================

let segundosAnalise = 0;

setInterval(function () {

    const visor =
        document.getElementById("temporizador-pares");

    if (!visor) {
        return;
    }

    segundosAnalise++;

    if (segundosAnalise >= 60) {

    if (typeof calcularAnalisePares === "function") {
        calcularAnalisePares();
    }

    segundosAnalise = 1;

}

    visor.innerText = segundosAnalise + "s";

}, 1000);

let contadorTitan = 0;
let contadorEpic = 0;
let segundosUnder = 0;

// ===============================
// TEMPORIZADOR DO CARTÃO UNDER/OVER
// ===============================
setInterval(function () {
    const visor = document.getElementById("temporizador-under");
    if (!visor) return;

    segundosUnder++;

    if (segundosUnder >= 60) {
        if (typeof calcularAnaliseUnder === "function") {
            calcularAnaliseUnder();
        }
        segundosUnder = 1;
    }

    visor.innerText = segundosUnder + "s";
}, 1000);


// == INICIO TEMPORIZADOR DO MONEY PANTHOM === 


let contadorPhantom = 0;
let segundosPhantom = 0;

// === FUNÇÃO ATUALIZAR CARTÃO 3 (MONEY PHANTOM) ==
function atualizarCartaoPhantom(percentagem, bot) {
    const percentual = document.getElementById("percentual-phantom");
    const barra = document.getElementById("barra-phantom");
    const botRecomendado = document.getElementById("bot-phantom");

    if (!percentual || !barra || !botRecomendado) return;

    percentual.innerText = percentagem + "%";

    const blocosCheios = Math.round(percentagem / 10);
    barra.innerText = "■".repeat(blocosCheios) + "□".repeat(10 - blocosCheios);

    if (percentagem <= 30) {
        barra.style.color = "#ff1744";
    } else {
        barra.style.color = "#00ff66";
    }

    botRecomendado.innerText = bot;
}

// ===============================
// TEMPORIZADOR DO CARTÃO 3 (MONEY PHANTOM)
// ===============================
setInterval(function () {
    const visor = document.getElementById("temporizador-phantom");
    if (!visor) return;

    segundosPhantom++;

    if (segundosPhantom >= 60) {
        if (typeof calcularAnalisePhantom === "function") {
            calcularAnalisePhantom();
        }
        segundosPhantom = 1;
    }

    visor.innerText = segundosPhantom + "s";
}, 1000);

