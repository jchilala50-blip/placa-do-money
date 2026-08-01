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

<div class="titulo-card">
Volatility 100 (1s) Index
</div>

<div class="tipo-estrategia">
PARES
</div>

<div class="barra-fundo">

<div class="barra-progresso"
style="width:35%;"></div>

</div>

<div class="percentagem">
35%
</div>

<div class="bot-recomendado">
✔ Bot recomendado:
<b>VORTEX</b>
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
