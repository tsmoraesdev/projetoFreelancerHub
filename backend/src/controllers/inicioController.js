// src/controllers/inicioController.js

const db = require('../db');

// ATENÇÃO: Se a taxa horária do usuário estiver salva em outro lugar (e.g., tabela 'users'),
// substitua esta constante por uma busca dinâmica.
const HOURLY_RATE_FALLBACK = 50.00;

async function getDashboardData(req, res) {
    const user_id = req.user.id;

    try {
        // --- 1. Total de Clientes e Projetos ---
        const [totalClientsResult, totalProjectsResult] = await Promise.all([
            db('clients').where({ user_id }).count('* as total'),
            db('projects').where({ user_id }).count('* as total'),
        ]);
        const totalClients = parseInt(totalClientsResult[0].total);
        const totalProjects = parseInt(totalProjectsResult[0].total);

        // --- 2. Horas Totais Registradas e Valor Não Faturado (Time Entries) ---
        // Busca todas as entradas de tempo do usuário para cálculo de horas e não faturado
        const timeEntries = await db('time_entries')
            .select('time_entries.duration_seconds', 'time_entries.is_billed')
            .join('tasks', 'time_entries.task_id', 'tasks.id')
            .join('projects', 'tasks.project_id', 'projects.id')
            .where('projects.user_id', user_id);

        const totalHoursAll = timeEntries.reduce((sum, e) => sum + (e.duration_seconds / 3600), 0);

        // Valor Não Faturado de Entradas de Tempo
        const unbilledEntriesValue = timeEntries
            .filter(e => !e.is_billed)
            .reduce((sum, e) => sum + (e.duration_seconds / 3600) * HOURLY_RATE_FALLBACK, 0);

        // --- 3. Valor Não Faturado de Projetos Fixos ---
        const unbilledFixedProjectsResult = await db('projects')
            .where({ user_id, billing_type: 'fixed' })
            .where('status', 'not in', ['Concluído', 'Faturado', 'Cancelado']) // Ajuste os status de "não faturado"
            .sum('fixed_value as unbilled_fixed_value');

        const unbilledFixedValue = parseFloat(unbilledFixedProjectsResult[0].unbilled_fixed_value || 0);
        const totalValueUnbilled = unbilledEntriesValue + unbilledFixedValue;


        // --- 4. Faturamento Pendente (Invoices) ---
        const totalValuePendingResult = await db('invoices')
            .where({ user_id, status: 'pending' })
            .sum('amount as total_pending');

        const totalValuePending = parseFloat(totalValuePendingResult[0].total_pending || 0);

        // --- 5. Próximas Tarefas (Próximos 7 dias) ---
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
        const nextWeekStr = nextWeek.toISOString().split('T')[0]; // YYYY-MM-DD

        const upcomingTasks = await db('tasks')
            .select('tasks.id', 'tasks.title', 'tasks.due_date', 'projects.title as project_title', 'clients.name as client_name')
            .join('projects', 'tasks.project_id', 'projects.id')
            .join('clients', 'projects.client_id', 'clients.id')
            .where('projects.user_id', user_id)
            .andWhere('tasks.status', '!=', 'done') // Exclui tarefas concluídas
            .andWhere('tasks.due_date', '>=', todayStr)
            .andWhere('tasks.due_date', '<=', nextWeekStr)
            .orderBy('tasks.due_date', 'asc');


        // --- 6. Resposta Agregada ---
        res.json({
            totalProjects,
            totalClients,
            totalHoursAll: parseFloat(totalHoursAll.toFixed(2)),
            // Faturamento pendente: faturas emitidas mas não pagas
            totalValuePending: parseFloat(totalValuePending.toFixed(2)),
            // Valor a faturar: trabalho feito ou valor fixo não faturado
            totalValueUnbilled: parseFloat(totalValueUnbilled.toFixed(2)),
            upcomingTasks,
        });

    } catch (err) {
        console.error('Erro no Dashboard Controller:', err);
        res.status(500).json({ error: 'Erro ao buscar dados do dashboard.' });
    }
}

module.exports = {
    getDashboardData,
};