const db = require('../db');

// Lista todos os projetos do usuário, incluindo o nome do cliente
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
        const { client_id, title, description, start_date, due_date, billing_type, fixed_value, } = req.body;

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
            fixed_value: billing_type === 'fixed' ? fixed_value : 0.00 // Garante 0 se for por hora
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

// Retorna um projeto específico (necessário para a página Kanban)
async function get(req, res) {
    try {
        const id = req.params.id;
        const project = await db('projects')
            .select('projects.*', 'clients.name as client_name')
            .where({ 'projects.id': id, 'projects.user_id': req.user.id })
            .leftJoin('clients', 'projects.client_id', 'clients.id')
            .first();

        if (!project) return res.status(404).json({ error: 'Projeto não encontrado ou acesso negado.' });

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
                status
            });

        const updatedProject = await db('projects').where({ id }).first();
        res.json(updatedProject);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar projeto.' });
    }
}

// Exclui um projeto (as tarefas associadas serão excluídas por CASCADE)
async function remove(req, res) {
    try {
        const id = req.params.id;
        // O ON DELETE CASCADE na tabela 'tasks' garante a limpeza automática
        const count = await db('projects')
            .where({ id, user_id: req.user.id })
            .del();

        if (count === 0) return res.status(404).json({ error: 'Projeto não encontrado ou você não tem permissão.' });

        res.json({ message: 'Projeto excluído com sucesso.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao excluir projeto.' });
    }
}

/**
 * **Correção:** Verifica se o projeto existe antes de tentar atualizar o status.
 * Essa função é chamada por tasksController quando tarefas são adicionadas, atualizadas ou removidas.
 */
async function autoStatus(project_id, user_id) {
    // 1. Verifica se o projeto existe (Importante se a tarefa foi a última excluída)
    const projectExists = await db('projects')
        .where({ id: project_id, user_id })
        .first();

    if (!projectExists) {
        // Se o projeto não existe mais (pode ter sido excluído logo após a tarefa), retorna.
        return;
    }

    const tasks = await db('tasks')
        .where('tasks.project_id', project_id)
        // É possível remover o JOIN se o `tasksController` já garantiu a permissão.
        // Mantenho o JOIN para maior segurança na consulta, mas removo a condição projects.user_id,
        // pois a existência do projeto já garante o acesso.
        .join('projects', 'tasks.project_id', '=', 'projects.id')
        .andWhere('projects.user_id', user_id);


    // Se não há tarefas associadas, o status deve ser 'Proposta' ou similar.
    if (tasks.length === 0) {
        await db('projects').where({ id: project_id }).update({ status: 'Planejamento' });
        return;
    }

    const allDone = tasks.every(t => t.status === 'done');
    const anyDoing = tasks.some(t => t.status === 'doing');

    if (allDone) {
        await db('projects').where({ id: project_id }).update({ status: 'Concluído' });
    } else if (anyDoing) {
        await db('projects').where({ id: project_id }).update({ status: 'Em Andamento' });
    } else {
        // Se há tarefas (tasks.length > 0) e nenhuma está 'doing' ou 'done', estão todas em 'todo'
        await db('projects').where({ id: project_id }).update({ status: 'Planejamento' });
    }
}

module.exports = { list, create, get, update, remove, autoStatus };