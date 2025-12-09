// src/utils/generateInvoicePDF.js
import jsPDF from "jspdf";
import QRCode from "qrcode";
import logo from '../assets/Freelancerhub.svg'; // Importação do logo solicitada

// Chave do LocalStorage, importada para consistência (definida em Perfil.jsx)
const PROFILE_DATA_KEY = 'FREELANCERHUB_PROFILE_DATA';

/**
 * Gera CRC16/CCITT (XModem) necessário para o campo 6304 do payload EMV (Pix).
 * Implementação padrão: polinômio 0x1021, init 0xFFFF.
 */
function crc16(payload) {
    let crc = 0xFFFF;
    for (let i = 0; i < payload.length; i++) {
        crc ^= payload.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
            else crc <<= 1;
            crc &= 0xffff;
        }
    }
    return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Insere o campo 54 (valor) no payload EMV (string pixFullPayloadBase) e recalcula o CRC (6304).
 */
function buildPixPayloadWithAmount(pixFullPayloadBase, amount) {
    const amountStr = Number(amount).toFixed(2);
    const idx6304 = pixFullPayloadBase.indexOf("6304");
    let baseNoCRC;
    if (idx6304 !== -1) {
        baseNoCRC = pixFullPayloadBase.slice(0, idx6304);
    } else {
        baseNoCRC = pixFullPayloadBase;
    }

    const idx58 = baseNoCRC.indexOf("58");
    let insertPos = baseNoCRC.length;
    if (idx58 !== -1) insertPos = idx58;

    const valorFieldValue = amountStr;
    const valorLength = String(valorFieldValue.length).padStart(2, "0");
    const valorField = `54${valorLength}${valorFieldValue}`;

    const newBase = baseNoCRC.slice(0, insertPos) + valorField + baseNoCRC.slice(insertPos);
    const payloadToCRC = newBase + "6304";

    const crc = crc16(payloadToCRC);
    const finalPayload = newBase + "6304" + crc;
    return finalPayload;
}

/**
 * Gera dataURL do QR code a partir do payload EMV.
 */
async function generateQRDataURLFromPayload(payload) {
    const opts = { errorCorrectionLevel: "M", type: "image/png", scale: 6 };
    return QRCode.toDataURL(payload, opts);
}

// ------------------- VALOR PADRÃO DA CHAVE PIX -------------------
const DEFAULT_PIX_PAYLOAD = "00020126580014BR.GOV.BCB.PIX01364a6ee2aa-088d-4c6b-a25b-fecb9ca505fd5204000053039865802BR5922Tatiane Santana Moraes6009SAO PAULO621405103mvHrk0CPv63041BFE";

/**
 * Gera PDF da fatura/cobrança.
 * @param {object} params
 * - projectName
 * - client { nome, email }
 * - items: array de { taskTitle, value, hours, ... }
 * - pixPayloadBase (opcional)
 */
export async function generateInvoicePDF({ projectName, client, items = [], pixPayloadBase = DEFAULT_PIX_PAYLOAD }) {
    try {
        const doc = new jsPDF();
        const date = new Date();
        const marginLeft = 10;
        const marginRight = 190;
        const lineStart = marginLeft;
        const lineEnd = marginRight;

        // --- Configurações Monocromáticas ---
        doc.setTextColor(0); // Preto para todo o texto
        doc.setDrawColor(0); // Preto para todas as linhas
        doc.setFillColor(255); // Branco para fundo padrão

        // --- Recuperação dos Dados do Emissor (Prestador de Serviço) ---
        const storedProfile = localStorage.getItem(PROFILE_DATA_KEY);
        const emissor = storedProfile ? JSON.parse(storedProfile) : {};


        // --- 1. CABEÇALHO/LOGOMARCA (EMISSOR) ---
        let y = 10;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        // Nome/Razão Social do Emissor (Prestador de Serviço)
        const emissorNome = emissor.nomeRazao || "Nome do Prestador de Serviço (Emissor)";
        doc.text(emissorNome, lineStart, y);

        // Logo (Placeholder para SVG)
        const logoWidth = 30;
        const logoHeight = 8;
        doc.setFont("helvetica", "bold");
        doc.text("FREELANCERHUB", lineEnd, y, null, null, "right");

        // Código para adicionar o logo:
        /* try {
            doc.addImage(logo, "SVG/PNG", lineEnd - logoWidth, y - 5, logoWidth, logoHeight);
        } catch(e) { 
            // Fallback: se o SVG não carregar, mantemos apenas o texto
        }
        */

        y += 4;

        // Linha divisória
        doc.setLineWidth(0.5);
        doc.line(lineStart, y, lineEnd, y);
        y += 4;

        // Endereço e Contato do Emissor
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        const emissorInfo = [
            emissor.cpfCnpj ? `CPF/CNPJ: ${emissor.cpfCnpj}` : '',
            emissor.endereco || 'Endereço Completo: N/A',
            emissor.cidade && emissor.estado ? `${emissor.cidade}/${emissor.estado}` : 'Cidade/Estado: N/A',
            emissor.email ? `E-mail: ${emissor.email}` : 'E-mail: N/A'
        ].filter(Boolean).join(' | ');

        const emissorLines = doc.splitTextToSize(emissorInfo, lineEnd - lineStart);
        doc.text(emissorLines, lineStart, y);
        y += (emissorLines.length * 3.5);


        // --- 2. TÍTULO E INFORMAÇÕES DO CLIENTE ---
        y += 4;
        doc.setLineWidth(0.2);

        // Título Fatura
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("FATURA DE SERVIÇOS", lineStart, y);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`Projeto: ${projectName}`, lineEnd, y, null, null, "right");
        y += 5;

        // Caixa do Cliente
        const clientBoxY = y;
        const clientBoxH = 12;
        doc.setLineWidth(0.2);
        doc.rect(lineStart, clientBoxY, lineEnd - lineStart, clientBoxH);

        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("COBRANÇA PARA (CLIENTE):", marginLeft + 2, clientBoxY + 3);

        doc.setFont("helvetica", "normal");
        doc.text(`${client?.nome || "N/A"}`, marginLeft + 2, clientBoxY + 7.5);

        doc.setFont("helvetica", "bold");
        doc.text("DATA DE VENCIMENTO:", lineEnd - 40, clientBoxY + 3);
        doc.setFont("helvetica", "normal");
        // Adicione uma data de vencimento (ex: 5 dias após a emissão)
        const dueDate = new Date(date);
        dueDate.setDate(date.getDate() + 5);
        doc.text(`${dueDate.toLocaleDateString("pt-BR")}`, lineEnd - 40, clientBoxY + 7.5);

        y += clientBoxH + 4;


        // --- 3. TABELA DE ITENS/SERVIÇOS ---

        // Cabeçalho da Tabela
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("DESCRIÇÃO DOS SERVIÇOS", marginLeft, y);
        doc.text("HORAS", 135, y);
        doc.text("VALOR (R$)", marginRight, y, null, null, "right");
        y += 2;
        doc.setLineWidth(0.2);
        doc.line(lineStart, y, lineEnd, y);
        y += 4;

        let total = 0;
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");

        items.forEach((it) => {
            const taskText = `${it.taskTitle}`;
            const taskLines = doc.splitTextToSize(taskText, 120);

            doc.text(taskLines, marginLeft, y);

            doc.text(`${(it.hours || 0).toFixed(2)}h`, 135, y);
            doc.text(`${Number(it.value).toFixed(2)}`, marginRight, y, null, null, "right");

            y += (taskLines.length * 3.5) + 2;

            total += Number(it.value || 0);

            if (y > 270) {
                doc.addPage();
                y = 20;

                doc.setFontSize(9);
                doc.setFont("helvetica", "bold");
                doc.text("DESCRIÇÃO DOS SERVIÇOS", marginLeft, y);
                doc.text("HORAS", 135, y);
                doc.text("VALOR (R$)", marginRight, y, null, null, "right");
                y += 2;
                doc.setLineWidth(0.2);
                doc.line(lineStart, y, lineEnd, y);
                y += 4;

                doc.setFontSize(8);
                doc.setFont("helvetica", "normal");
            }
        });

        y += 4;

        // --- 4. TOTAL GERAL (Estilo Fatura/Destaque) ---

        // Caixa do Total
        const totalBoxX = lineEnd - 55;
        const totalBoxW = 55;
        const totalBoxH = 8;

        doc.setLineWidth(0.5);
        doc.rect(totalBoxX, y, totalBoxW, totalBoxH);

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        // Título alinhado à esquerda da caixa do total
        doc.text("VALOR A PAGAR (R$):", totalBoxX - 6, y + totalBoxH - 2, null, null, "right");

        doc.setFontSize(12);
        // Valor dentro da caixa, alinhado à direita
        doc.text(`${total.toFixed(2)}`, totalBoxX + totalBoxW - 2, y + totalBoxH - 2, null, null, "right");
        y += totalBoxH + 6;

        doc.line(lineStart, y, lineEnd, y);
        y += 6;


        // --- 5. INFORMAÇÕES PIX/QR CODE ---

        if (y > 200) {
            doc.addPage();
            y = 20;
        }

        const payloadWithValue = buildPixPayloadWithAmount(String(pixPayloadBase), Number(total || 0));
        const qrDataUrl = await generateQRDataURLFromPayload(payloadWithValue);

        const qrSize = 50;
        doc.addImage(qrDataUrl, "PNG", marginLeft, y, qrSize, qrSize);

        const qrRight = marginLeft + qrSize + 10;
        const codeBlockW = lineEnd - qrRight;

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("FORMA DE PAGAMENTO (PIX)", qrRight, y + 5);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`Valor: R$ ${total.toFixed(2)}`, qrRight, y + 13);

        doc.setFontSize(8);
        doc.text("1. Escaneie o QR Code ou utilize a chave Copia e Cola abaixo:", qrRight, y + 21);

        const codeBlockY = y + 24;

        // Caixa do código Copia e Cola 
        doc.setFillColor(245);
        doc.setDrawColor(0);
        doc.setLineWidth(0.2);
        doc.rect(qrRight, codeBlockY, codeBlockW, 15, 'F');

        doc.setFontSize(7);
        doc.setFont("courier", "normal");
        doc.setTextColor(50);

        const cLines = doc.splitTextToSize(payloadWithValue, codeBlockW - 2);
        doc.text(cLines, qrRight + 1, codeBlockY + 3);

        y += qrSize + 10;

        // --- 6. INFORMAÇÕES ADICIONAIS ---
        doc.setLineWidth(0.5);
        doc.line(lineStart, y, lineEnd, y);
        y += 4;

        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(50);
        doc.text(`Fatura emitida em ${date.toLocaleDateString("pt-BR")}. Por favor, efetue o pagamento até o vencimento.`, marginLeft, y);


        doc.save(`Fatura_Projeto_${projectName.replace(/\s+/g, "_")}.pdf`);

    } catch (err) {
        console.error("Erro ao gerar PDF de fatura:", err);
        throw err;
    }
}

// Exporta apenas a função de projeto