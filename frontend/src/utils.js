// src/utils.js

/**
 * Formata um número de segundos em uma string HH:MM:SS.
 * @param {number} seconds - O tempo em segundos.
 * @returns {string} O tempo formatado.
 */
export const formatTime = (seconds) => {
    // Garante que o número de segundos seja positivo
    const absSeconds = Math.abs(seconds);
    const h = String(Math.floor(absSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((absSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(absSeconds % 60).padStart(2, '0');

    return `${h}:${m}:${s}`;
};

/**
 * Formata uma string de data/tempo em um formato de data e hora em português (DD/MM/AAAA HH:MM).
 * @param {string} dateString - A string de data/tempo (ex: ISO 8601).
 * @returns {string} A data e hora formatada.
 */
export const formatDate = (dateString) => {
    // Verifica se a string de data é válida
    if (!dateString) return 'N/A';

    // Converte e formata para o padrão brasileiro com hora e minuto
    return new Date(dateString).toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};