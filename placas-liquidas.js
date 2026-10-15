/* 💧 PLACAS CIRCULARES DE SALDO E LUCRO/PERDA */

function atualizarPlacasLiquidas() {

    const saldoElemento = document.getElementById("saldo-real");
    const lucroElemento = document.getElementById("lucro-real");

    const liquidoSaldo = document.getElementById("liquido-saldo");
    const liquidoLucro = document.getElementById("liquido-lucro");

    const circuloSaldo = document.getElementById("circulo-saldo");
    const circuloLucro = document.getElementById("circulo-lucro");

    if (!saldoElemento || !lucroElemento || !liquidoSaldo || !liquidoLucro) return;

    /* SALDO */
    const saldo = parseFloat(
        saldoElemento.innerText
            .replace(/[^0-9,.-]/g, "")
            .replace(",", ".")
    ) || 0;

    /* 0 = vazio | quanto maior o saldo, mais cheio */
    const nivelSaldo = saldo <= 0
        ? 0
        : Math.min(88, Math.log10(1 + saldo) * 32);

    liquidoSaldo.style.height = nivelSaldo + "%";


    /* COR DO SALDO */
    if (saldo >= 0) {

        liquidoSaldo.style.backgroundColor = "#00e676";
        liquidoSaldo.style.boxShadow =
            "0 -3px 10px rgba(0, 230, 118, 0.65)";

        circuloSaldo.style.borderColor = "#00e676";
        circuloSaldo.style.boxShadow =
            "0 0 8px rgba(0, 230, 118, 0.55), inset 0 0 12px rgba(0, 0, 0, 0.7)";

    } else {

        liquidoSaldo.style.backgroundColor = "#ff1744";
        liquidoSaldo.style.boxShadow =
            "0 -3px 10px rgba(255, 23, 68, 0.65)";

        circuloSaldo.style.borderColor = "#ff1744";
        circuloSaldo.style.boxShadow =
            "0 0 8px rgba(255, 23, 68, 0.55), inset 0 0 12px rgba(0, 0, 0, 0.7)";
    }


    /* LUCRO / PERDA */
    const lucro = parseFloat(
        lucroElemento.innerText
            .replace(/[^0-9,.-]/g, "")
            .replace(",", ".")
    ) || 0;

    /* 0 = vazio | lucro/perda aumenta o nível */
    const nivelLucro = lucro === 0
        ? 0
        : Math.min(88, Math.log10(1 + Math.abs(lucro)) * 40);

    liquidoLucro.style.height = nivelLucro + "%";


    /* LUCRO = VERDE | PERDA = VERMELHO */
    if (lucro >= 0) {

        liquidoLucro.style.backgroundColor = "#00e676";
        liquidoLucro.style.boxShadow =
            "0 -3px 10px rgba(0, 230, 118, 0.65)";

        circuloLucro.style.borderColor = "#00e676";
        circuloLucro.style.boxShadow =
            "0 0 8px rgba(0, 230, 118, 0.55), inset 0 0 12px rgba(0, 0, 0, 0.7)";

    } else {

        liquidoLucro.style.backgroundColor = "#ff1744";
        liquidoLucro.style.boxShadow =
            "0 -3px 10px rgba(255, 23, 68, 0.65)";

        circuloLucro.style.borderColor = "#ff1744";
        circuloLucro.style.boxShadow =
            "0 0 8px rgba(255, 23, 68, 0.65), inset 0 0 12px rgba(0, 0, 0, 0.7)";
    }
}

/* Mantém as placas sincronizadas */
setInterval(atualizarPlacasLiquidas, 500);
