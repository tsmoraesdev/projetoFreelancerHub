const db = require('../db');

// Lista todos os projetos
async function list(req, res) {
    try {
        const projects = await db('projects')
            .select('projects.*', 'clients.name as client_name')
            .where('projects.user_id', req.user.id)
            .leftJoin('clients', 'projects.client_id', 'clients.id')
            .orderBy('projects.created_at', 'desc');

        res.json(projects);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao listar projetos.' });
    }
}

// Cria um novo projeto
async function create(req, res) {
    try {
        const { client_id, title, description, start_date, due_date, billing_type, fixed_value } = req.body;

        if (!client_id || !title || !billing_type) {
            return res.status(400).json({ error: 'Campos obrigatórios: cliente, título e tipo de cobrança.' });
        }

        const [id] = await db('projects').insert({
            user_id: req.user.id,
            client_id,
            title,
            description,
            start_date,
            due_date,
            billing_type,
            fixed_value: billing_type === 'fixed' ? fixed_value : 0.00,
            status: "Proposta" // Status inicial correto
        });

        const newProject = await db('projects')
            .select('projects.*', 'clients.name as client_name')
            .where('projects.id', id)
            .leftJoin('clients', 'projects.client_id', 'clients.id')
            .first();

        res.status(201).json(newProject);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar projeto.' });
    }
}

// Retorna um projeto específico
async function get(req, res) {
    try {
        const id = req.params.id;

        const project = await db('projects')
            .select('projects.*', 'clients.name as client_name')
            .where({ 'projects.id': id, 'projects.user_id': req.user.id })
            .leftJoin('clients', 'projects.client_id', 'clients.id')
            .first();

        if (!project) return res.status(404).json({ error: 'Projeto não encontrado.' });

        res.json(project);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar projeto.' });
    }
}

// Atualiza um projeto
async function update(req, res) {
    try {
        const id = req.params.id;
        const { client_id, title, description, start_date, due_date, billing_type, fixed_value, status } = req.body;

        await db('projects')
            .where({ id, user_id: req.user.id })
            .update({
                client_id,
                title,
                description,
                start_date,
                due_date,
                billing_type,
                fixed_value: billing_type === 'fixed' ? fixed_value : 0.00,
                status // o status do frontend é salvo aqui
            });

        // CORREÇÃO 1: Chama autoStatus para garantir que o estado do projeto é consistente
        // com as regras de automação.
        await autoStatus(id, req.user.id);

        const updatedProject = await db('projects').where({ id }).first();
        res.json(updatedProject);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar projeto.' });
    }
}

// Remove um projeto
async function remove(req, res) {
    try {
        const id = req.params.id;

        const count = await db('projects')
            .where({ id, user_id: req.user.id })
            .del();

        if (count === 0) {
            return res.status(404).json({ error: 'Projeto não encontrado ou sem permissão.' });
        }

        res.json({ message: 'Projeto excluído com sucesso.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao excluir projeto.' });
    }
}

// Atualização automática do status baseada em tarefas
async function autoStatus(project_id, user_id) {
    const project = await db('projects')
        .where({ id: project_id, user_id })
        .first();

    if (!project) return;

    // CORREÇÃO 2: Adiciona a proteção para o status "Concluído"
    if (project.status === "Faturado" || project.status === "Concluído") return;

    const tasks = await db('tasks')
        .where('tasks.project_id', project_id)
        .join('projects', 'tasks.project_id', '=', 'projects.id')
        .andWhere('projects.user_id', user_id);

    if (tasks.length === 0) {
        // Se não existe nenhuma task → volta para "Proposta"
        await db('projects').where({ id: project_id }).update({ status: "Proposta" });
        return;
    }

    const allDone = tasks.every(t => t.status === "done");
    const anyDoing = tasks.some(t => t.status === "doing");

    if (allDone) {
        await db('projects').where({ id: project_id }).update({ status: "Concluído" });
    } else if (anyDoing) {
        await db('projects').where({ id: project_id }).update({ status: "Em Andamento" });
    } else {
        // Todas estão "todo"
        await db('projects').where({ id: project_id }).update({ status: "Proposta" });
    }
}

module.exports = { list, create, get, update, remove, autoStatus };