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

// Cria uma nova fatura (pode ser complexo: deve ligar projetos e entradas de tempo)
async function create(req, res) {
    // ESTA É UMA FUNÇÃO COMPLEXA: A lógica real deve:
    // 1. Calcular o valor total baseado nos projetos e time_entries enviados.
    // 2. Marcar as time_entries/projetos como 'is_billed = true' ou vincular à invoice_id.
    // 3. Gerar um invoice_number único.

    // Por enquanto, criamos um placeholder para simular a criação:
    try {
        const { client_id, amount, issue_date, due_date } = req.body;

        if (!client_id || !amount) {
            return res.status(400).json({ error: 'Cliente e valor são obrigatórios.' });
        }

        // Simulação de número de fatura
        const invoice_number = `INV-${Date.now()}`;

        const [id] = await db('invoices').insert({
            user_id: req.user.id,
            client_id,
            invoice_number,
            amount,
            issue_date: issue_date || db.fn.now(),
            due_date,
            status: 'pending'
        });

        const newInvoice = await db('invoices').where({ id }).first();
        res.status(201).json(newInvoice);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar fatura.' });
    }
}


module.exports = { list, updateStatus, create };