// ===============================
// SISTEMA DE ANÁLISES DO MERCADO
// ===============================

const memoriaAnalise = {};

function obterMemoriaVolatilidade(simbolo) {

    if (!memoriaAnalise[simbolo]) {

        memoriaAnalise[simbolo] = {

            ticks: [],
            ultimoDigito: null

        };

    }

    return memoriaAnalise[simbolo];

}

function receberTickAnalise(ultimoDigito, simbolo) {

    const memoria = obterMemoriaVolatilidade(simbolo);

if (typeof atualizarStatusLive === "function") {
    atualizarStatusLive();
}

    memoria.ticks.push({

        digito: ultimoDigito,
        tempo: Date.now()

    });

    memoria.ultimoDigito = ultimoDigito;

    // Mantém apenas os últimos 60 segundos
    memoria.ticks = memoria.ticks.filter(tick =>

        Date.now() - tick.tempo <= 60000

    );

const total = memoria.ticks.length;

let pares = 0;

let impares = 0;

let under = 0;

let over = 0;

for (const tick of memoria.ticks) {

    if (tick.digito % 2 === 0) {

        pares++;

    } else {

        impares++;

    }

if (tick.digito < 5) {

    under++;

} else if (tick.digito > 5) {

    over++;

}

}

const percentagemPares =
    total > 0
        ? Math.round((pares / total) * 100)
        : 0;

const percentagemImpares =
    total > 0
        ? Math.round((impares / total) * 100)
        : 0;

const percentagemUnder =
    total > 0
        ? Math.round((under / total) * 100)
        : 0;

const percentagemOver =
    total > 0
        ? Math.round((over / total) * 100)
        : 0;


if (typeof atualizarCartaoPares === "function") {

let botRecomendado = "-";

if (percentagemPares >= 80) {

    botRecomendado = "ORION";

} else if (percentagemImpares >= 80) {

    botRecomendado = "VORTEX";

}

atualizarCartaoPares(

    percentagemPares,

    botRecomendado

);

}

}
