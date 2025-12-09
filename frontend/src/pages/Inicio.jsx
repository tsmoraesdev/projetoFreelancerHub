// src/pages/Inicio.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
    ClipboardDocumentListIcon,
    UserGroupIcon,
    ClockIcon,
    CurrencyDollarIcon,
    CalendarDaysIcon,
} from '@heroicons/react/24/solid';

// Importação das constantes do sistema e mocks
import { MOCK_PROJECTS, MOCK_CLIENTES } from '../data/mocks'; 
import { formatDate } from '../utils'; // Reutiliza a função de formatar data

// Chaves do LocalStorage
const TIME_ENTRIES_KEY = 'freelancerhub_time_entries';
const HOURLY_RATE_KEY = 'freelancerhub_hourly_rate';

// Status de Pagamento (igual ao Faturamentos.jsx)
const PAYMENT_STATUS = {
    UNBILLED: "Não Faturado",
    PENDING: "Pendente",
    PAID: "Pago",
};

// --- DADOS SIMULADOS PARA NOVOS GRÁFICOS ---
const MOCK_MONTHLY_DATA = [
    { month: 'Jan', billed: 12000, target: 15000 },
    { month: 'Fev', billed: 9500, target: 15000 },
    { month: 'Mar', billed: 16200, target: 15000 },
    { month: 'Abr', billed: 18000, target: 15000 },
    { month: 'Mai', billed: 14000, target: 15000 },
    { month: 'Jun', billed: 20000, target: 15000 },
];


// --- Componente Simulado de Gráfico de Faturamento Mensal ---
function FaturamentoMensalSimulacao({ data }) {
    // Encontra o valor máximo para dimensionamento (escala do gráfico)
    const maxVal = Math.max(...data.map(d => Math.max(d.billed, d.target))) * 1.2;

    return (
        <div className="p-4 bg-gray-700 rounded-xl h-full flex flex-col">
            <h3 className="text-xl font-semibold mb-6 border-b border-gray-600 pb-2">
                <CurrencyDollarIcon className="w-5 h-5 text-green-400 inline-block mr-2" /> Faturamento Mensal (Últimos 6 Meses)
            </h3>
            <div className="flex justify-around items-end h-48 space-x-2 px-4">
                {data.map((item, index) => (
                    <div key={index} className="flex flex-col items-center flex-grow h-full justify-end min-w-0 max-w-[60px]">
                        <div className="text-xs text-gray-400 mb-1">R$ {Math.round(item.billed / 1000)}k</div>
                        {/* Barra de Faturamento */}
                        <div 
                            className="w-8 rounded-t-lg bg-green-500 hover:bg-green-400 transition-all duration-300 relative" 
                            style={{ height: `${(item.billed / maxVal) * 100}%` }}
                        >
                            {/* Linha da Meta */}
                            <div 
                                className="absolute top-0 left-0 right-0 h-0.5 bg-red-400 transform -translate-y-1/2"
                                style={{ top: `${100 - (item.target / maxVal) * 100}%` }}
                                title={`Meta: R$ ${item.target.toFixed(2)}`}
                            ></div>
                        </div>
                        <p className="mt-2 text-sm text-gray-300">{item.month}</p>
                    </div>
                ))}
            </div>
            <div className="mt-6 text-sm text-gray-400 flex justify-center space-x-6 pt-4 border-t border-gray-600">
                <span className="flex items-center"><span className="w-3 h-3 bg-green-500 rounded-full mr-1"></span> Faturado</span>
                <span className="flex items-center"><span className="w-3 h-0.5 bg-red-400 mr-1"></span> Meta</span>
            </div>
        </div>
    );
}

// --- Componente Simulado de Calendário ---
function CalendarioSimulacao({ soonestDeadline }) {
    // Simulação simplificada de um mês
    const days = [
        'D', 'S', 'T', 'Q', 'Q', 'S', 'S',
        ...Array(5).fill(''), 
        ...Array.from({ length: 30 }, (_, i) => i + 1)
    ].slice(0, 35); 

    let deadlineDay = null;
    if (soonestDeadline && soonestDeadline.prazo) {
        // Pega o dia (número) do prazo mais próximo
        deadlineDay = new Date(soonestDeadline.prazo).getDate();
    }

    return (
        <div className="p-4 bg-gray-700 rounded-xl h-full flex flex-col">
            <h3 className="text-xl font-semibold mb-3 border-b border-gray-600 pb-2 flex items-center gap-2">
                <CalendarDaysIcon className="w-6 h-6 text-indigo-400" /> Planejamento do Mês
            </h3>
            <div className="grid grid-cols-7 gap-1 text-center text-sm mt-2 flex-grow">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
                    <div key={index} className="font-bold text-indigo-300">{day}</div>
                ))}
                
                {days.map((day, index) => (
                    <div 
                        key={index} 
                        className={`p-1 rounded-md transition-colors duration-200 cursor-pointer
                            ${day === '' ? 'text-gray-600' : 'text-gray-300'}
                            ${day === deadlineDay ? 'bg-red-600 font-bold text-white shadow-lg ring-2 ring-red-400 transform scale-105' : 'hover:bg-gray-600'}
                        `}
                    >
                        {day}
                    </div>
                ))}
            </div>
            {deadlineDay && (
                <p className="mt-3 text-sm text-red-300 text-center">
                    Prazo {deadlineDay} destacado (Vencimento: {formatDate(soonestDeadline.prazo).split(' ')[0]}).
                </p>
            )}
        </div>
    );
}


// --- Componente Simulado de Gráfico de Pizza/Doughnut (Mantido) ---
function ChartSimulacao({ title, data, valueKey, labelKey, colors, totalMetricLabel = 'Total' }) {
    if (!data || data.length === 0) return <p className="text-gray-400">Sem dados para o gráfico.</p>;

    const total = data.reduce((sum, item) => sum + item[valueKey], 0);

    return (
        <div className="p-4 bg-gray-700 rounded-xl h-full flex flex-col">
            <h3 className="text-xl font-semibold mb-3 border-b border-gray-600 pb-2">{title}</h3>
            
            <div className="flex flex-col sm:flex-row items-center justify-around flex-grow py-4">
                
                {/* Simulação Visual do Gráfico (Agora mostra o Total) */}
                <div className="relative w-32 h-32 flex flex-col items-center justify-center rounded-full bg-gray-600 mb-6 sm:mb-0 border-4 border-indigo-500/50 shadow-inner">
                    <p className="text-xs text-gray-400 uppercase tracking-wider">{totalMetricLabel}</p>
                    <p className="text-2xl font-bold text-white">
                        {total}
                    </p>
                </div>
                
                {/* Legenda */}
                <ul className="space-y-2">
                    {data.map((item, index) => (
                        <li key={index} className="flex items-center text-sm">
                            <span 
                                className={`w-3 h-3 rounded-full mr-2`} 
                                style={{ backgroundColor: colors[index % colors.length] }}
                            ></span>
                            <span className="font-medium">{item[labelKey]}:</span> 
                            <span className="ml-1 text-gray-300">
                                {item[valueKey]} 
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

// --- Componente auxiliar KPI (Refatorado) ---
function KPI({ icon: Icon, label, value, color }) {
    // Classes de cores para os ícones e bordas
    const colorClasses = {
        indigo: 'text-indigo-400 border-indigo-500',
        blue: 'text-blue-400 border-blue-500',
        yellow: 'text-yellow-400 border-yellow-500',
        green: 'text-green-400 border-green-500',
    };
    
    return (
        <div className={`p-5 bg-gray-800 rounded-xl shadow-lg border-l-4 ${colorClasses[color]}`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">{label}</p>
                    <p className="mt-1 text-3xl font-bold text-white">{value}</p>
                </div>
                {/* Ícone menos invasivo, apenas como detalhe de fundo */}
                <Icon className={`h-8 w-8 text-gray-500 opacity-70`} />
            </div>
        </div>
    );
}


// --- Componente Principal ---
export default function Inicio() {
    const [entries, setEntries] = useState([]);
    
    // Carrega entradas de tempo (time entries) do LocalStorage
    useEffect(() => {
        setEntries(JSON.parse(localStorage.getItem(TIME_ENTRIES_KEY) || "[]"));
    }, []);

    // ----------------------------------------------------------------------
    // 1. Processamento de Dados de Faturamento
    // ----------------------------------------------------------------------
    const { totalValuePending, totalValueUnbilled, totalHoursAll, totalClients } = useMemo(() => {
        // Combina Time Entries e Fixed Projects 
        const allItems = [
            // Time Entries (Por Hora)
            ...entries.map(e => ({
                ...e,
                type: 'entry',
                value: e.totalValue,
                hours: e.durationSeconds / 3600,
                paymentStatus: e.paymentStatus || PAYMENT_STATUS.UNBILLED,
            })),
            // Fixed Value Projects (Valor Fixo)
            ...MOCK_PROJECTS
                .filter(p => p.valorFixo > 0)
                .map(p => ({
                    id: p.id,
                    type: 'project',
                    value: p.valorFixo,
                    hours: 0,
                    paymentStatus: p.status === 'Faturado' ? PAYMENT_STATUS.PENDING :
                                   p.status === 'Pago' ? PAYMENT_STATUS.PAID : 
                                   PAYMENT_STATUS.UNBILLED,
                }))
        ];

        // Cálculos de Faturamento
        const totalValuePending = allItems.filter(i => i.paymentStatus === PAYMENT_STATUS.PENDING).reduce((t, e) => t + e.value, 0);
        // const totalValuePaid = allItems.filter(i => i.paymentStatus === PAYMENT_STATUS.PAID).reduce((t, e) => t + e.value, 0); // Não é mais usado diretamente nos KPIs
        const totalValueUnbilled = allItems.filter(i => i.paymentStatus === PAYMENT_STATUS.UNBILLED).reduce((t, e) => t + e.value, 0);
        const totalHoursAll = allItems.reduce((t, e) => t + e.hours, 0);
        const totalClients = MOCK_CLIENTES.length;

        return { totalValuePending, totalValueUnbilled, totalHoursAll, totalClients };
    }, [entries]);


    // 2. Processamento de Dados de Projetos
  
    const projectStats = useMemo(() => {
        const total = MOCK_PROJECTS.length;
        
        // Contagem de projetos por status
        const statusCounts = MOCK_PROJECTS.reduce((acc, project) => {
            acc[project.status] = (acc[project.status] || 0) + 1;
            return acc;
        }, {});
        
        // Encontra o prazo mais próximo (exclui Concluído/Faturado)
        const soonestDeadline = MOCK_PROJECTS
            .filter(p => p.status !== 'Concluído' && p.status !== 'Faturado' && p.prazo)
            .sort((a, b) => new Date(a.prazo) - new Date(b.prazo))[0];

        // Dados formatados para o gráfico de status
        const projectChartData = Object.entries(statusCounts).map(([status, count]) => ({
            status,
            count
        }));

        return { total, projectChartData, soonestDeadline };
    }, []);
    

    // 3. Renderização
  

    return (
        <div className="p-8 min-h-screen bg-gray-900 text-white space-y-8">
            <h1 className="text-4xl font-bold mb-6">Dashboard de Produtividade</h1>

            {/* --- CARDS DE RESUMO (KPIs - 4 Manunidos) --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <KPI
                    icon={ClipboardDocumentListIcon}
                    label="Projetos Ativos"
                    value={projectStats.total}
                    color="indigo"
                />
                <KPI
                    icon={UserGroupIcon}
                    label="Clientes Cadastrados"
                    value={totalClients}
                    color="blue"
                />
                <KPI
                    icon={CurrencyDollarIcon}
                    label="Faturamento Pendente"
                    value={`R$ ${totalValuePending.toFixed(2)}`}
                    color="yellow"
                />
                <KPI
                    icon={ClockIcon}
                    label="Horas Totais Registradas"
                    value={`${totalHoursAll.toFixed(2)}h`}
                    color="green"
                />
            </div>

            {/* --- GRÁFICOS PRINCIPAIS (Faturamento Mensal e Prazos) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                
                {/* Coluna 1: Faturamento Mensal (ocupa 2/3) */}
                <div className="lg:col-span-2">
                     <FaturamentoMensalSimulacao data={MOCK_MONTHLY_DATA} />
                </div>

                {/* Coluna 2: Prazos e Valor a Faturar (ocupa 1/3) */}
                <div className="flex flex-col gap-6">
                    
                    {/* Card: Valor a Faturar Imediatamente (Receita Potencial) */}
                    <div className="p-5 bg-gray-800 rounded-xl border-l-4 border-yellow-500 shadow-lg flex-shrink-0">
                        <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                            <CurrencyDollarIcon className="w-6 h-6 text-yellow-400" /> Valor a Faturar Imediatamente
                        </h2>
                        <p className="text-3xl font-bold text-yellow-300 mb-2">
                            R$ {totalValueUnbilled.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-400">
                            Total de trabalho **Não Faturado** (Horas + Valor Fixo) que exige sua ação.
                        </p>
                    </div>
                    
                    {/* Seção de Prazos (Mantida) */}
                    <div className="p-4 bg-gray-700 rounded-lg flex-shrink-0 shadow-md h-full">
                        <h3 className="text-xl font-semibold mb-3 border-b border-gray-600 pb-2 flex items-center gap-2">
                            <CalendarDaysIcon className="w-6 h-6 text-red-400" /> Próximo Prazo
                        </h3>
                        
                        {projectStats.soonestDeadline ? (
                            <div className="space-y-2 p-3 bg-gray-600/50 rounded-md border border-red-500/50">
                                <p className="text-lg font-bold truncate">{projectStats.soonestDeadline.titulo}</p>
                                <p className="text-sm text-gray-300 truncate">Cliente: {MOCK_CLIENTES.find(c => c.id === projectStats.soonestDeadline.clienteId)?.nome || 'N/A'}</p>
                                <p className="text-md font-semibold text-red-300">Vence em: {formatDate(projectStats.soonestDeadline.prazo).split(' ')[0]}</p>
                            </div>
                        ) : (
                            <p className="text-gray-400">Nenhum prazo ativo encontrado.</p>
                        )}
                    </div>
                </div>
            </div>
            
            {/* --- VISUALIZAÇÕES ADICIONAIS (Status de Projeto e Calendário) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                
                {/* Gráfico 1: Status de Projetos (ocupa 2/3) */}
                <div className="lg:col-span-2">
                    <ChartSimulacao
                        title="Distribuição de Projetos por Status"
                        data={projectStats.projectChartData}
                        labelKey="status"
                        valueKey="count"
                        totalMetricLabel="Projetos"
                        colors={['#8B5CF6', '#FBBF24', '#34D399', '#D8B4FE']}
                    />
                </div>
                
                {/* Calendário (ocupa 1/3) */}
                <CalendarioSimulacao soonestDeadline={projectStats.soonestDeadline} />
            </div>
        </div>
    );
}