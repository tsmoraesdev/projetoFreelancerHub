const db = require('../db');

// Função auxiliar para formatar a data
function formatForMysqlDate(dueDate) {
    if (!dueDate) {
        return null;
    }
    // Converte a string ISO (ex: '2025-11-08T00:00:00.000Z') para 'YYYY-MM-DD'
    return new Date(dueDate).toISOString().split('T')[0];
}

async function list(req, res) {
    try {
        const tasks = await db('tasks').where({ user_id: req.user.id }).orderBy('created_at', 'asc');
        res.json(tasks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server error' });
    }
}

async function create(req, res) {
    try {
        const { title, description, dueDate } = req.body;

        // Formata a data para o MySQL DATE
        const formattedDueDate = formatForMysqlDate(dueDate);

        const [id] = await db('tasks').insert({ user_id: req.user.id, title, description, dueDate: formattedDueDate });

        const task = await db('tasks').where({ id }).first();
        res.json(task);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server error' });
    }
}

async function get(req, res) {
    try {
        const id = req.params.id;
        const task = await db('tasks').where({ id, user_id: req.user.id }).first();
        if (!task) return res.status(404).json({ error: 'not found' });
        res.json(task);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server error' });
    }
}

async function update(req, res) {
    try {
        const id = req.params.id;
        const { title, description, status, dueDate } = req.body;

        //  Formata a data para o MySQL DATE
        const formattedDueDate = formatForMysqlDate(dueDate);

        await db('tasks')
            .where({ id, user_id: req.user.id })
            .update({
                title,
                description,
                status,
                dueDate: formattedDueDate, // Usa a data formatada
                updated_at: db.fn.now()
            });

        const task = await db('tasks').where({ id }).first();
        res.json(task);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server error' });
    }
}

async function updateStatus(req, res) {
    try {
        const id = req.params.id;
        const { status } = req.body;
        if (!['todo', 'doing', 'done'].includes(status)) return res.status(400).json({ error: 'invalid status' });
        await db('tasks').where({ id, user_id: req.user.id }).update({ status, updated_at: db.fn.now() });
        const task = await db('tasks').where({ id }).first();
        res.json(task);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server error' });
    }
}

async function remove(req, res) {
    try {
        const id = req.params.id;
        await db('tasks').where({ id, user_id: req.user.id }).del();
        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server error' });
    }
}

module.exports = { list, create, get, update, updateStatus, remove };