// src/controllers/invoicesController.js

const db = require('../db');

// Lista todas as faturas do usuário
async function list(req, res) {
    try {
        const invoices = await db('invoices')
            .select('invoices.*', 'clients.name as client_name')
            .where('invoices.user_id', req.user.id)
            .leftJoin('clients', 'invoices.client_id', 'clients.id')
            .orderBy('issue_date', 'desc');

        res.json(invoices);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao listar faturas.' });
    }
}

// Atualiza o status de pagamento de uma fatura
async function updateStatus(req, res) {
    try {
        const id = req.params.id;
        const { status } = req.body;

        if (!['pending', 'paid', 'canceled'].includes(status)) {
            return res.status(400).json({ error: 'Status inválido.' });
        }

        await db('invoices')
            .where({ id, user_id: req.user.id })
            .update({ status, updated_at: db.fn.now() });

        const updatedInvoice = await db('invoices').where({ id }).first();
        res.json(updatedInvoice);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar status da fatura.' });
    }
}

// Cria uma nova fatura, recebendo time_entry_ids do corpo da requisição
async function create(req, res) {
    try {
        // Recebe a lista de IDs de entradas de tempo e a data de vencimento opcional
        const { time_entry_ids, due_date } = req.body;
        const user_id = req.user.id;

        // 1. Validação inicial
        if (!time_entry_ids || !Array.isArray(time_entry_ids) || time_entry_ids.length === 0) {
            return res.status(400).json({ error: 'A lista de IDs de entradas de tempo (time_entry_ids) é obrigatória.' });
        }

        // --- BUSCA DA TAXA HORÁRIA DO USUÁRIO ---
        // (Isso pressupõe uma tabela 'user_profiles' ou similar. Adaptar conforme seu DB)
        const hourlyRateResult = await db('user_profiles')
            .select('hourly_rate')
            .where('user_id', user_id)
            .first();

        // Pega a taxa horária ou usa um valor padrão de R$ 50,00 se não encontrada
        const HOURLY_RATE = hourlyRateResult ? parseFloat(hourlyRateResult.hourly_rate) : 50.00;
        // ------------------------------------------

        // 2. Busca e validação das entradas de tempo
        // Busca: duration_seconds, e o client_id através do join
        const entriesToBill = await db('time_entries')
            .select(
                'time_entries.id',
                'time_entries.duration_seconds',
                'projects.client_id' // Necessário para criar a fatura
            )
            .whereIn('time_entries.id', time_entry_ids)
            .leftJoin('tasks', 'time_entries.task_id', 'tasks.id')
            .leftJoin('projects', 'tasks.project_id', 'projects.id')
            .where('projects.user_id', user_id) // Segurança: garantir que as entradas pertencem ao usuário
            .where('time_entries.is_billed', false); // Apenas entradas que ainda não foram faturadas

        if (entriesToBill.length === 0) {
            return res.status(404).json({ error: 'Nenhuma entrada de tempo válida encontrada, ou as entradas já foram faturadas.' });
        }

        // 3. Cálculo do valor total e determinação do cliente
        let totalAmount = 0;
        let client_id = null;

        entriesToBill.forEach(entry => {
            const hours = entry.duration_seconds / 3600;
            totalAmount += hours * HOURLY_RATE;

            // Garante que todas as entradas sejam do mesmo cliente
            if (client_id === null) {
                client_id = entry.client_id;
            } else if (client_id !== entry.client_id) {
                // Se o cliente for diferente, impede a criação da fatura
                // (Uma fatura geralmente é emitida para um único cliente)
                throw new Error('Todas as entradas de tempo devem pertencer ao mesmo cliente.');
            }
        });

        if (client_id === null) {
            return res.status(500).json({ error: 'Erro ao determinar o cliente das entradas de tempo.' });
        }

        const issue_date = db.fn.now();

        // 4. Criação da fatura
        const invoice_number = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const [invoiceId] = await db('invoices').insert({
            user_id,
            client_id,
            invoice_number,
            amount: totalAmount,
            issue_date,
            due_date,
            status: 'pending'
        }).returning('id'); // Retorna o ID da fatura criada

        // 5. Marcação das entradas como faturadas
        const idsToUpdate = entriesToBill.map(e => e.id);
        await db('time_entries')
            .whereIn('id', idsToUpdate)
            .update({
                is_billed: true,
                // AQUI VOCÊ TAMBÉM PODE ATUALIZAR UM CAMPO invoice_id COM o valor 'invoiceId' SE SEU DB TIVER ESTA COLUNA.
                updated_at: db.fn.now()
            });

        // 6. Retorno
        const newInvoice = await db('invoices').where({ id: invoiceId }).first();
        res.status(201).json({
            message: 'Fatura criada e entradas de tempo marcadas como faturadas.',
            invoice: newInvoice
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message || 'Erro interno ao criar a fatura.'
        });
    }
}

module.exports = {
    list,
    create,
    updateStatus,
};