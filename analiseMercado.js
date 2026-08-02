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

}

// ================================================================

atualizarCartaoPares(

    percentagemPares,

    botRecomendado

);

}

}


function calcularAnalisePares() {

    const memoria =
        obterMemoriaVolatilidade("1HZ100V");

    const total = memoria.ticks.length;

    if (total === 0) {
        return;
    }

    let pares = 0;
    let impares = 0;

    for (const tick of memoria.ticks) {

        if (tick.digito % 2 === 0) {

            pares++;

        } else {

            impares++;

        }

    }

    const percentagemPares =
        Math.round((pares / total) * 100);

    const percentagemImpares =
        Math.round((impares / total) * 100);

    let botRecomendado = "-";

    if (percentagemPares >= 80) {

        botRecomendado = "ORION";

        contadorOrion++;

        const visor =
            document.getElementById("contador-orion");

        if (visor) {

            visor.innerText =
                "ORION: " + contadorOrion;

        }

    } else if (percentagemImpares >= 80) {

        botRecomendado = "VORTEX";

        contadorVortex++;

        const visor =
            document.getElementById("contador-vortex");

        if (visor) {

            visor.innerText =
                "VORTEX: " + contadorVortex;

        }

    }

    if (typeof atualizarCartaoPares === "function") {

        atualizarCartaoPares(
            percentagemPares,
            botRecomendado
        );

    }

    // Reinicia a memória para o próximo ciclo de 60 segundos
    memoria.ticks = [];

}
