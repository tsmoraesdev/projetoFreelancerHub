// server/controllers/inicioController.js

const db = require('../config/db'); // Assumindo que você tem um módulo de conexão DB

// Função auxiliar simples para calcular a data daqui a 7 dias no formato YYYY-MM-DD (para SQL)
const getNext7Days = () => {
    const today = new Date();
    today.setDate(today.getDate() + 7);
    return today.toISOString().split('T')[0];
};

// Função Principal chamada pela rota GET /api/inicio/
exports.getDashboardData = async(req, res) => {

    // O ID do usuário vem do middleware de autenticação (authMiddleware)
    const userId = req.user.id;

    // Prepara a data limite para filtrar as tarefas
    const next7DaysDate = getNext7Days();

    let dashboardData = {
        totalProjects: 0,
        totalClients: 0,
        totalHoursAll: 0,
        totalValuePending: 0, // Faturamento de invoices pendentes
        upcomingTasks: [],
    };

    try {
        // --- 1. Contagem de Projetos e Clientes ---
        const [
            [projectsCountResult]
        ] = await db.query(
            'SELECT COUNT(*) AS count FROM projects WHERE user_id = ?', [userId]
        );
        dashboardData.totalProjects = projectsCountResult.count;

        const [
            [clientsCountResult]
        ] = await db.query(
            'SELECT COUNT(*) AS count FROM clients WHERE user_id = ?', [userId]
        );
        dashboardData.totalClients = clientsCountResult.count;


        // --- 2. Agregação de Horas e Faturamento ---

        // CÁLCULO DE HORAS TOTAIS
        // Nota: Assumindo que 'db.query' retorna um array de arrays [[rows], [fields]]
        const [
            [totalHoursResult]
        ] = await db.query(
            `SELECT SUM(te.duration_seconds) AS total_seconds
             FROM time_entries te
             JOIN tasks t ON te.task_id = t.id
             JOIN projects p ON t.project_id = p.id
             WHERE p.user_id = ?`, [userId]
        );
        const totalSeconds = totalHoursResult.total_seconds || 0;
        dashboardData.totalHoursAll = parseFloat((totalSeconds / 3600).toFixed(2)); // Converte e formata para horas


        // CÁLCULO DE FATURAMENTO PENDENTE (Invoices com status 'pending')
        const [
            [pendingInvoicesResult]
        ] = await db.query(
            `SELECT SUM(amount) AS total_pending 
             FROM invoices 
             WHERE user_id = ? AND status = 'pending'`, [userId]
        );
        dashboardData.totalValuePending = parseFloat(pendingInvoicesResult.total_pending || 0).toFixed(2);


        // --- 3. Busca de Tarefas Futuras (upcomingTasks) ---
        // Filtra por tarefas com due_date nos próximos 7 dias e status 'todo' ou 'doing'
        const [upcomingTasksResult] = await db.query(
            `SELECT 
                t.id, t.title, t.due_date, t.status, 
                p.title AS project_title,
                c.name AS client_name
             FROM tasks t
             JOIN projects p ON t.project_id = p.id
             JOIN clients c ON p.client_id = c.id
             WHERE 
                p.user_id = ? 
                AND t.due_date IS NOT NULL 
                AND t.status IN ('todo', 'doing')
                AND t.due_date <= ?  
             ORDER BY t.due_date ASC, t.title ASC`, [userId, next7DaysDate]
        );

        dashboardData.upcomingTasks = upcomingTasksResult;


        // --- 4. Resposta Final ---
        return res.json(dashboardData);

    } catch (error) {
        console.error('Erro ao buscar dados do dashboard (SQL/Lógica):', error);
        // Retorna JSON de erro 500 para evitar que o frontend receba HTML
        return res.status(500).json({ error: 'Falha interna ao buscar dados do dashboard.' });
    }
};