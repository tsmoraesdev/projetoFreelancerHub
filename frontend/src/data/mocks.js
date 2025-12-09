// criapara simulacao pode remover depois de integrar com a API

// --- 1. MOCK DE CLIENTES ---
export const MOCK_CLIENTES = [
    { id: 1, nome: "Cliente Alpha S.A.", email: "alpha@sa.com", contato: "11987654321" },
    { id: 2, nome: "Empresa Beta Ltda.", email: "beta@ltda.com", contato: "21912345678" },
    { id: 3, nome: "Consultoria Gama", email: "gama@consultoria.com", contato: "41999887766" },
];

// --- 2. STATUS DE PROJETOS ---
export const PROJECT_STATUSES = ["Proposta", "Em Andamento", "Concluído", "Faturado"];

// --- 3. MOCK DE PROJETOS ---
export const MOCK_PROJECTS = [{
        id: 101,
        titulo: "Criação de App Mobile",
        descricao: "Desenvolvimento de um aplicativo para Android/iOS.",
        clienteId: 1,
        clienteNome: "Cliente Alpha S.A.",
        status: "Em Andamento",
        valorFixo: 15000.00,
        prazo: "2026-03-30"
    },
    {
        id: 102,
        titulo: "Revisão de Marca",
        descricao: "Design e branding da nova identidade visual.",
        clienteId: 2,
        clienteNome: "Empresa Beta Ltda.",
        status: "Concluído",
        valorFixo: 3500.00,
        prazo: "2025-12-15"
    },
    {
        id: 103,
        titulo: "Orçamento para Campanha",
        descricao: "Preparação de proposta para nova campanha de marketing.",
        clienteId: 3,
        clienteNome: "Consultoria Gama",
        status: "Proposta",
        valorFixo: 0.00, // Não tem valor fixo, será por hora
        prazo: "2026-01-20"
    }
];

// --- 4. MOCK DE TAREFAS (para o Kanban) ---
export const MOCK_TASKS_ALL = [
    // Tarefas para o Projeto 101 (App Mobile)
    { id: 1, projectId: 101, title: 'Definir escopo do App', description: 'Reunião inicial com o cliente.', status: 'done', dueDate: '2025-12-05' },
    { id: 2, projectId: 101, title: 'Wireframes e Layout', description: 'Criação das telas principais.', status: 'doing', dueDate: '2025-12-15' },
    { id: 3, projectId: 101, title: 'Configurar Ambiente', description: 'Setup inicial do React Native.', status: 'todo', dueDate: '2025-12-10' },

    // Tarefas para o Projeto 102 (Revisão de Marca)
    { id: 4, projectId: 102, title: 'Pesquisa de Mercado', description: 'Análise de concorrentes.', status: 'done', dueDate: '2025-11-20' },

    // Tarefas para o Projeto 103 (Orçamento)
    { id: 5, projectId: 103, title: 'Cálculo de Custos', description: 'Mapear tempo e recursos necessários.', status: 'todo', dueDate: '2025-12-08' },
];