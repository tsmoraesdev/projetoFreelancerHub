// src/pages/Inicio.jsx

import React, { useState, useEffect } from 'react';
import {
    ClipboardDocumentListIcon,
    UserGroupIcon,
    ClockIcon,
    CurrencyDollarIcon,
    CalendarDaysIcon,
    CheckCircleIcon
} from '@heroicons/react/24/solid';


// Função utilitária simples para formatar a data de exibição
const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr.replace(/-/g, '/')); 
    return date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'short', day: 'numeric' });
};


// --- COMPONENTE KPI (CARD DE RESUMO) ---
const KPI = ({ icon: Icon, label, value, color }) => (
    <div className={`p-5 bg-gray-800 rounded-xl shadow-lg border-l-4 border-${color}-500 transition duration-300 hover:shadow-xl hover:bg-gray-700`}>
        <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">{label}</h2>
            <Icon className={`w-6 h-6 text-${color}-400`} />
        </div>
        <p className="mt-1 text-3xl font-bold text-white">{value}</p>
    </div>
);

// --- NOVO COMPONENTE: CALENDÁRIO REAL DE TAREFAS ---
const CalendarioReal = ({ tasks }) => {
    const groupedTasks = tasks.reduce((acc, task) => {
        const dateKey = formatDate(task.due_date);
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(task);
        return acc;
    }, {});

    const sortedDates = Object.keys(groupedTasks).sort((a, b) => {
        const parseDate = (dateStr) => {
            const [day, month, year] = dateStr.split('/');
            return new Date(`${year}-${month}-${day}`);
        };
        return parseDate(a) - parseDate(b);
    });

    return (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg h-full overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-gray-700 pb-2">
                <CalendarDaysIcon className="w-6 h-6 text-cyan-300" /> Tarefas Pendentes (Próximos 7 Dias)
            </h2>
            
            {sortedDates.length === 0 ? (
                <p className="text-gray-400 text-center py-4">
                    Nenhuma tarefa pendente com prazo nos próximos 7 dias.
                </p>
            ) : (
                <div className="space-y-4">
                    {sortedDates.map(dateKey => (
                        <div key={dateKey} className="border-l-4 border-indigo-500 pl-3">
                            <h3 className="font-bold text-lg text-indigo-400 mb-1">{dateKey}</h3>
                            <ul className="space-y-1 text-sm">
                                {groupedTasks[dateKey].map(task => (
                                    <li key={task.id} className="text-gray-300 flex items-start gap-2">
                                        <CheckCircleIcon className="w-4 h-4 mt-1 flex-shrink-0 text-gray-500" />
                                        <div>
                                            <p className="font-semibold leading-tight">{task.title}</p>
                                            <p className="text-xs text-gray-400 leading-tight truncate">
                                                {task.project_title} ({task.client_name})
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


// --- COMPONENTE PRINCIPAL ---
export default function Inicio() {
    
    // 1. Estados para receber os dados do controller
    const [data, setData] = useState({
        totalProjects: 0,
        totalClients: 0,
        totalHoursAll: 0,
        totalValueUnbilled: 0,
        totalValuePending: 0,
        upcomingTasks: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            setLoading(true);
            const token = localStorage.getItem('authToken'); 
            
            try {
                const response = await fetch('/api/inicio/', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    const errorDetails = await response.text().catch(() => 'Sem detalhes de erro');
                    console.error("Resposta não OK:", response.status, errorDetails.substring(0, 100));
                    throw new Error(`Erro ${response.status}: Falha na requisição da API.`);
                }
                
                const result = await response.json(); 
                setData(result);
            } catch (error) {
                console.error("Falha ao carregar dados do dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, []); 


    // 3. Renderização
    
    if (loading) {
        return <div className="p-8 min-h-screen bg-gray-900 text-white text-center text-2xl">Carregando dados...</div>;
    }

    return (
        <div className="p-8 min-h-screen bg-gray-900 text-white space-y-8">
            <h1 className="text-4xl font-bold mb-6">Dashboard de Produtividade</h1>

            {/* --- CARDS DE RESUMO (KPIs) --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <KPI
                    icon={ClipboardDocumentListIcon}
                    label="Projetos Totais"
                    value={data.totalProjects}
                    color="indigo"
                />
                <KPI
                    icon={UserGroupIcon}
                    label="Clientes Cadastrados"
                    value={data.totalClients}
                    color="blue"
                />
                <KPI
                    icon={CurrencyDollarIcon}
                    label="Faturamento Pendente"
                    value={`R$ ${data.totalValuePending.toFixed(2)}`}
                    color="yellow"
                />
                <KPI
                    icon={ClockIcon}
                    label="Horas Totais Registradas"
                    value={`${data.totalHoursAll.toFixed(2)}h`}
                    color="green"
                />
            </div>

            {/* --- CALENDÁRIO COM TAREFAS REAIS --- */}
            <div className="mt-8">
                <CalendarioReal tasks={data.upcomingTasks} />
            </div>
            
        </div>
    );
}