/*
 * Datas no horário das lojas (Brasília). O servidor roda em UTC, mas os
 * horários de agendamento são gravados no horário local, sem fuso.
 */
const FUSO_DAS_LOJAS = 'America/Sao_Paulo';

const formatador = new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO_DAS_LOJAS,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
});

/** Data ('AAAA-MM-DD') e data e hora ('AAAA-MM-DD HH:MM:SS') de agora no horário das lojas. */
function agoraNoHorarioDasLojas(agora = new Date()) {
    const partes = Object.fromEntries(formatador.formatToParts(agora).map(({ type, value }) => [type, value]));
    const data = `${partes.year}-${partes.month}-${partes.day}`;
    return { data, dataHora: `${data} ${partes.hour}:${partes.minute}:${partes.second}` };
}

/** Soma dias a uma data 'AAAA-MM-DD' (dias pode ser negativo). */
function adicionarDias(data, dias) {
    const resultado = new Date(`${data}T00:00:00Z`);
    resultado.setUTCDate(resultado.getUTCDate() + dias);
    return resultado.toISOString().slice(0, 10);
}

module.exports = { agoraNoHorarioDasLojas, adicionarDias };
