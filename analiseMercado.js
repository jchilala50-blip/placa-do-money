// ===============================
// SISTEMA DE ANÁLISES DO MERCADO
// ===============================

const memoriaAnalise = {};

function obterMemoriaVolatilidade(simbolo) {
    if (!memoriaAnalise[simbolo]) {
        memoriaAnalise[simbolo] = {
            cartao1: { ticks: [], ultimoDigito: null },
            cartao2: { ticks: [], ultimoDigito: null },
            cartao3: { ticks: [], ultimoDigito: null }
        };
    }
    return memoriaAnalise[simbolo];
}


function receberTickAnalise(ultimoDigito, simbolo) {
    const memoria = obterMemoriaVolatilidade(simbolo);

    if (typeof atualizarStatusLive === "function") {
        atualizarStatusLive();
    }

    // --- CARTÃO 1: MEMÓRIA ISOLADA ---
    memoria.cartao1.ticks.push({ digito: ultimoDigito, tempo: Date.now() });
    memoria.cartao1.ultimoDigito = ultimoDigito;
    memoria.cartao1.ticks = memoria.cartao1.ticks.filter(tick => Date.now() - tick.tempo <= 60000);

    // --- CARTÃO 2: MEMÓRIA ISOLADA ---
    memoria.cartao2.ticks.push({ digito: ultimoDigito, tempo: Date.now() });
    memoria.cartao2.ultimoDigito = ultimoDigito;
    memoria.cartao2.ticks = memoria.cartao2.ticks.filter(tick => Date.now() - tick.tempo <= 60000);

    // --- CARTÃO 3: MEMÓRIA ISOLADA (MONEY PHANTOM) ---
    memoria.cartao3.ticks.push({ digito: ultimoDigito, tempo: Date.now() });
    memoria.cartao3.ultimoDigito = ultimoDigito;
    memoria.cartao3.ticks = memoria.cartao3.ticks.filter(tick => Date.now() - tick.tempo <= 60000);


    // ==========================================
    // LÓGICA EM TEMPO REAL: CARTÃO 1 (PARES/ÍMPARES)
    // ==========================================
    const totalC1 = memoria.cartao1.ticks.length;
    let pares = 0;
    let impares = 0;

    for (const tick of memoria.cartao1.ticks) {
        if (tick.digito % 2 === 0) {
            pares++;
        } else {
            impares++;
        }
    }

    const percentagemPares = totalC1 > 0 ? Math.round((pares / totalC1) * 100) : 0;
    const percentagemImpares = totalC1 > 0 ? Math.round((impares / totalC1) * 100) : 0;

    if (typeof atualizarCartaoPares === "function") {
        let botRecomendado = "-";

        if (percentagemPares >= 80) {
            botRecomendado = "ORION";
        } else if (percentagemImpares >= 80) {
            botRecomendado = "VORTEX";
        }

        if (botRecomendado === "ORION") {
            contadorOrion++;
            const visor = document.getElementById("contador-orion");
            if (visor) visor.innerText = "ORION: " + contadorOrion;
        } else if (botRecomendado === "VORTEX") {
            contadorVortex++;
            const visor = document.getElementById("contador-vortex");
            if (visor) visor.innerText = "VORTEX: " + contadorVortex;
        }

        atualizarCartaoPares(percentagemPares, botRecomendado);
    }


    // ==========================================
    // LÓGICA EM TEMPO REAL: CARTÃO 2 (UNDER/OVER)
    // ==========================================
    const totalC2 = memoria.cartao2.ticks.length;
    let under = 0;
    let over = 0;

    for (const tick of memoria.cartao2.ticks) {
        if (tick.digito < 5) {
            under++;
        } else if (tick.digito > 5) {
            over++;
        }
    }

    const percentagemUnder = totalC2 > 0 ? Math.round((under / totalC2) * 100) : 0;
    const percentagemOver = totalC2 > 0 ? Math.round((over / totalC2) * 100) : 0;

    if (typeof atualizarCartaoUnder === "function") {
        let botUnder = "-";

        if (percentagemUnder >= 80) {
            botUnder = "SUPER EPIC";
        } else if (percentagemOver >= 80) {
            botUnder = "TITAN";
        }

        if (botUnder === "TITAN") {
            contadorTitan++;
            const visor = document.getElementById("contador-titan");
            if (visor) visor.innerText = "TITAN: " + contadorTitan;
        } else if (botUnder === "SUPER EPIC") {
            contadorEpic++;
            const visor = document.getElementById("contador-epic");
            if (visor) visor.innerText = "SUPER EPIC: " + contadorEpic;
        }

        atualizarCartaoUnder(percentagemUnder, botUnder);
    }
}


function calcularAnalisePares() {
    // Procura a memória específica da volatilidade ativa (ex: "1HZ100V")
    const memoria = obterMemoriaVolatilidade("1HZ100V");
    const total = memoria.cartao1.ticks.length;

    if (total === 0) return;

    let pares = 0;
    let impares = 0;

    for (const tick of memoria.cartao1.ticks) {
        if (tick.digito % 2 === 0) {
            pares++;
        } else {
            impares++;
        }
    }

    const percentagemPares = Math.round((pares / total) * 100);
    const percentagemImpares = Math.round((impares / total) * 100);
    let botRecomendado = "-";

    if (percentagemPares >= 80) {
        botRecomendado = "ORION";
    } else if (percentagemImpares >= 80) {
        botRecomendado = "VORTEX";
    }

    if (typeof atualizarCartaoPares === "function") {
        atualizarCartaoPares(percentagemPares, botRecomendado);
    }

    // Limpa RIGOROSAMENTE apenas a memória do Cartão 1
    memoria.cartao1.ticks = [];
}

function calcularAnaliseUnder() {
    // Procura a memória específica da volatilidade ativa (ex: "1HZ100V")
    const memoria = obterMemoriaVolatilidade("1HZ100V");
    const total = memoria.cartao2.ticks.length;

    if (total === 0) return;

    let under = 0;
    let over = 0;

    for (const tick of memoria.cartao2.ticks) {
        if (tick.digito < 5) {
            under++;
        } else if (tick.digito > 5) {
            over++;
        }
    }

    const percentagemUnder = Math.round((under / total) * 100);
    const percentagemOver = Math.round((over / total) * 100);
    let botUnder = "-";

    if (percentagemUnder >= 80) {
        botUnder = "SUPER EPIC";
    } else if (percentagemOver >= 80) {
        botUnder = "TITAN";
    }

    if (typeof atualizarCartaoUnder === "function") {
        atualizarCartaoUnder(percentagemUnder, botUnder);
    }

    // Limpa RIGOROSAMENTE apenas a memória do Cartão 2
    memoria.cartao2.ticks = [];
}

//=== COMEÇO DA ANALISE DO MOMEY PANTHON ===



function calcularAnalisePhantom() {
    const memoria = obterMemoriaVolatilidade("1HZ100V");
    const ticks = memoria.cartao3.ticks;
    const total = ticks.length;

    if (total < 2) {
        memoria.cartao3.ticks = [];
        return;
    }

    let repeticoes = 0;

    // Varre os ticks comparando o dígito atual com o anterior para achar repetições
    for (let i = 1; i < total; i++) {
        if (ticks[i].digito === ticks[i - 1].digito) {
            repeticoes++;
        }
    }

    // Calcula a percentagem baseada na taxa de padrões repetidos no ciclo
    // Se o mercado repetiu muitos dígitos seguidos, a percentagem sobe
    const percentagemPhantom = Math.min(Math.round((repeticoes / (total - 1)) * 100) * 2, 100); 
    let botPhantom = "-";

    // Regra Rigorosa: Se a taxa de repetição estoirar os 80%
    if (percentagemPhantom >= 80) {
        botPhantom = "MONEY PHANTOM";
        
        contadorPhantom++;
        const visor = document.getElementById("contador-phantom");
        if (visor) visor.innerText = "PHANTOM: " + contadorPhantom;
    }

    if (typeof atualizarCartaoPhantom === "function") {
        atualizarCartaoPhantom(percentagemPhantom, botPhantom);
    }

    // Limpa RIGOROSAMENTE apenas a memória do Cartão 3 para o próximo minuto
    memoria.cartao3.ticks = [];
}

