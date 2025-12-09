const db = require('../db');
const { autoStatus } = require('./projectsController');

// Função auxiliar para formatar a data (Mantida)
function formatForMysqlDate(due_date) {
    if (!due_date) return null;
    return new Date(due_date).toISOString().split('T')[0];
}

// 1. Lista tarefas filtrando por projectId
async function list(req, res) {
    try {
        const { projectId } = req.query;

        let query = db('tasks')
            .select('tasks.*')
            .join('projects', 'tasks.project_id', '=', 'projects.id')
            .where('projects.user_id', req.user.id)
            .orderBy('tasks.created_at', 'asc');

        if (projectId) {
            query = query.where('tasks.project_id', projectId);
        }

        res.json(await query);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao listar tarefas.' });
    }
}

// 2. Cria nova tarefa
async function create(req, res) {
    try {
        const { project_id, title, description, due_date } = req.body;

        if (!project_id || !title) {
            return res.status(400).json({ error: 'Os campos project_id e title são obrigatórios.' });
        }

        const project = await db('projects').where({ id: project_id, user_id: req.user.id }).first();
        if (!project) return res.status(404).json({ error: 'Projeto não encontrado ou sem permissão' });

        const formattedDueDate = formatForMysqlDate(due_date);

        const [id] = await db('tasks').insert({
            project_id,
            title,
            description,
            due_date: formattedDueDate
        });
        await autoStatus(project_id, req.user.id);

        res.status(201).json(await db('tasks').where({ id }).first());
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar tarefa.' });
    }
}

// 3. Obtém tarefa
async function get(req, res) {
    try {
        const id = req.params.id;

        const task = await db('tasks')
            .select('tasks.*')
            .join('projects', 'tasks.project_id', '=', 'projects.id')
            .where('tasks.id', id)
            .where('projects.user_id', req.user.id)
            .first();

        if (!task) return res.status(404).json({ error: 'Tarefa não encontrada.' });
        res.json(task);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar tarefa.' });
    }
}

// 4. Atualiza tarefa
async function update(req, res) {
    try {
        const id = req.params.id;
        const { project_id, title, description, status, due_date } = req.body;

        // 1. Busca a tarefa ANTES de atualizar para obter o project_id original, 
        // caso ele não seja fornecido no body, e verificar permissão.
        const originalTask = await db('tasks')
            .select('tasks.project_id')
            .join('projects', 'tasks.project_id', '=', 'projects.id')
            .where('tasks.id', id)
            .where('projects.user_id', req.user.id)
            .first();

        if (!originalTask) return res.status(404).json({ error: 'Tarefa não encontrada ou sem permissão.' });

        const formattedDueDate = formatForMysqlDate(due_date);

        // Define o project_id que será usado no autoStatus
        const projectIdToUpdate = project_id || originalTask.project_id;

        await db('tasks')
            .where('tasks.id', id)
            .update({
                'tasks.title': title,
                'tasks.description': description,
                'tasks.status': status,
                'tasks.due_date': formattedDueDate,
                'tasks.updated_at': db.fn.now(),
                // Atualiza project_id se fornecido
                ...(project_id && { 'tasks.project_id': project_id })
            });

        if (updatedCount === 0) return res.status(404).json({ error: 'Tarefa não encontrada após a checagem.' });

        res.json(await db('tasks').where('id', id).first());

        // Chama autoStatus com o project_id correto (novo ou original)
        await autoStatus(projectIdToUpdate, req.user.id);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar tarefa.' });
    }
}

// 5. Atualiza status
async function updateStatus(req, res) {
    try {
        const id = req.params.id;
        const { status } = req.body;

        if (!['todo', 'doing', 'done'].includes(status))
            return res.status(400).json({ error: 'Status inválido.' });

        // 1. Buscar a tarefa ANTES de atualizar para obter o project_id e verificar permissão
        const task = await db('tasks')
            .select('tasks.project_id')
            .join('projects', 'tasks.project_id', '=', 'projects.id')
            .where('tasks.id', id)
            .where('projects.user_id', req.user.id)
            .first();

        if (!task) return res.status(404).json({ error: 'Tarefa não encontrada ou sem permissão.' });

        // 2. Atualiza o status da tarefa
        await db('tasks')
            .where('id', id)
            .update({ 'tasks.status': status, 'tasks.updated_at': db.fn.now() });

        // 3. Retorna a tarefa atualizada
        res.json(await db('tasks').where('id', id).first());

        // 4. Chama autoStatus com o project_id obtido
        await autoStatus(task.project_id, req.user.id);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar status.' });
    }
}

// 6. Remove tarefa
async function remove(req, res) {
    try {
        const id = req.params.id;

        // 1. Busca a tarefa para obter o project_id antes de excluir
        const task = await db('tasks')
            .select('tasks.project_id')
            .join('projects', 'tasks.project_id', '=', 'projects.id')
            .where('tasks.id', id)
            .where('projects.user_id', req.user.id)
            .first();

        if (!task) return res.status(404).json({ error: 'Tarefa não encontrada ou sem permissão.' });

        // 2. Exclui a tarefa
        await db('tasks').where('id', id).del();

        res.json({ message: 'Tarefa excluída com sucesso.' });

        // 3. Chama autoStatus com o project_id obtido
        await autoStatus(task.project_id, req.user.id);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao excluir tarefa.' });
    }
}

module.exports = { list, create, get, update, updateStatus, remove };