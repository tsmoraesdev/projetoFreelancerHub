const db = require('../db');

// Lista os registros de tempo do usuário (apenas para exibição no Faturamentos.jsx)
async function list(req, res) {
    try {
        // Retorna todos os registros de tempo do usuário, unindo com a tarefa e o projeto
        const entries = await db('time_entries')
            .select(
                'time_entries.*',
                'tasks.title as task_title',
                'tasks.project_id',
                'projects.title as project_title',
                'projects.client_id',
            )
            .leftJoin('tasks', 'time_entries.task_id', 'tasks.id')
            .leftJoin('projects', 'tasks.project_id', 'projects.id')
            .where('projects.user_id', req.user.id) // Proteção pelo user_id do projeto
            .orderBy('start_time', 'desc');

        res.json(entries);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao listar registros de tempo.' });
    }
}

// Cria um novo registro de tempo (função principal de salvar do Cronometro.jsx)
async function create(req, res) {
    try {
        const { task_id, start_time, end_time, duration_seconds, notes } = req.body;

        // duration_seconds e start_time são obrigatórios, task_id é obrigatório.
        if (!task_id || !start_time || duration_seconds === undefined || duration_seconds === null) {
            return res.status(400).json({ error: 'Campos obrigatórios: task_id, start_time e duration_seconds.' });
        }

        // 1. Verifica se a tarefa pertence ao usuário (segurança)
        const project = await db('projects')
            .select('projects.id')
            .leftJoin('tasks', 'projects.id', 'tasks.project_id')
            .where({ 'tasks.id': task_id, 'projects.user_id': req.user.id })
            .first();

        if (!project) {
            return res.status(404).json({ error: 'Tarefa não encontrada ou não pertence ao seu projeto.' });
        }

        // 2. Cria o registro
        const dataToInsert = {
            task_id,
            start_time,
            duration_seconds,
            notes,
            is_billed: false
        };

        // Adiciona end_time apenas se for fornecido
        if (end_time) {
            dataToInsert.end_time = end_time;
        }


        const [id] = await db('time_entries').insert(dataToInsert);

        const newEntry = await db('time_entries').where({ id }).first();
        res.status(201).json(newEntry);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao salvar registro de tempo.' });
    }
}

// Exclui um registro de tempo
async function remove(req, res) {
    try {
        const id = req.params.id;

        // 1. Verifica se a entrada pertence ao usuário (segurança complexa)
        const count = await db('time_entries')
            .leftJoin('tasks', 'time_entries.task_id', 'tasks.id')
            .leftJoin('projects', 'tasks.project_id', 'projects.id')
            .where({ 'time_entries.id': id, 'projects.user_id': req.user.id })
            .del();

        if (count === 0) return res.status(404).json({ error: 'Registro não encontrado ou você não tem permissão.' });

        res.json({ message: 'Registro de tempo excluído com sucesso.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao excluir registro de tempo.' });
    }
}

module.exports = { list, create, remove };