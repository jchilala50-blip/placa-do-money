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
