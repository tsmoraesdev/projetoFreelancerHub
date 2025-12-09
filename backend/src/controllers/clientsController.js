const db = require('../db');

// Retorna todos os clientes do usuário logado
async function list(req, res) {
    try {
        const clients = await db('clients')
            .where({ user_id: req.user.id })
            .orderBy('name', 'asc');
        res.json(clients);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao listar clientes.' });
    }
}

// Cria um novo cliente
async function create(req, res) {
    try {
        const { name, contact_person, email, phone } = req.body;

        if (!name) return res.status(400).json({ error: 'O nome do cliente é obrigatório.' });

        const [id] = await db('clients').insert({
            user_id: req.user.id, // Garante que o cliente é do usuário logado
            name,
            contact_person,
            email,
            phone
        });

        const newClient = await db('clients').where({ id }).first();
        res.status(201).json(newClient);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar cliente.' });
    }
}

// Atualiza um cliente existente
async function update(req, res) {
    try {
        const id = req.params.id;
        const { name, contact_person, email, phone } = req.body;

        await db('clients')
            .where({ id, user_id: req.user.id }) // Proteção: só atualiza se for do usuário
            .update({ name, contact_person, email, phone });

        const updatedClient = await db('clients').where({ id }).first();
        res.json(updatedClient);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar cliente.' });
    }
}

// Exclui um cliente
async function remove(req, res) {
    try {
        const id = req.params.id;
        // O ON DELETE RESTRICT no BD garante que não se pode apagar cliente com projetos
        const count = await db('clients')
            .where({ id, user_id: req.user.id })
            .del();

        if (count === 0) return res.status(404).json({ error: 'Cliente não encontrado ou você não tem permissão.' });

        res.json({ message: 'Cliente excluído com sucesso.' });
    } catch (err) {
        console.error(err);
        // Pode ser um erro de FK se houver projetos associados (ON DELETE RESTRICT)
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ error: 'Não é possível excluir o cliente. Ele está associado a projetos existentes.' });
        }
        res.status(500).json({ error: 'Erro ao excluir cliente.' });
    }
}

module.exports = { list, create, update, remove };