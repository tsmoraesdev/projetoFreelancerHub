// src/pages/Faturamentos.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    CurrencyDollarIcon,
    ClockIcon,
    DocumentTextIcon,
    XMarkIcon,
    TagIcon, 
    ArrowUturnLeftIcon, 
    UserCircleIcon,
    BanknotesIcon, 
} from "@heroicons/react/24/solid";

// Importações necessárias
import { MOCK_PROJECTS, MOCK_CLIENTES } from "../data/mocks";
import { generateInvoicePDF } from "../utils/generateInvoicePDF";
import { formatDate, formatTime } from "../utils"; 

const TIME_ENTRIES_KEY = "freelancerhub_time_entries";
const HOURLY_RATE_KEY = "freelancerhub_hourly_rate";
const USER_PROFILE_KEY = 'user_profile'; 
// Chave para rastrear projetos que foram marcados como TOTALMENTE pagos
const BILLED_PROJECTS_KEY = "freelancerhub_billed_projects"; 


// --- Constantes de Status ATUALIZADAS (Simplificadas para a UI) ---
const PAYMENT_STATUS = {
    // UNBILLED (Não Faturado) é mantido para entradas novas, mas tratado como PENDING na UI
    UNBILLED: "Não Faturado", 
    PENDING: "Pendente",
    PAID: "Pago",
};

// --- Funções Auxiliares de Sincronização ---
const getBilledProjects = () => {
    return JSON.parse(localStorage.getItem(BILLED_PROJECTS_KEY) || '[]');
};

const saveBilledProjects = (projectIds) => {
    localStorage.setItem(BILLED_PROJECTS_KEY, JSON.stringify(projectIds));
};

// --- Componentes Auxiliares ---
function Button({ children, onClick, color = 'indigo', title, disabled = false }) {
    // Adiciona o estado 'disabled'
    const baseClasses = `p-2 rounded flex items-center justify-center transition \
        ${disabled ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'hover:scale-105'} \
        `;

    const colorClasses = disabled ? '' :
        `${color === 'indigo' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''} \
        ${color === 'green' ? 'bg-green-600 hover:bg-green-700 text-white' : ''} \
        ${color === 'purple' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''} \
        ${color === 'red' ? 'bg-red-600 hover:bg-red-700 text-white' : ''} \
        ${color === 'yellow' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : ''}`;

    return (
        <button title={title}
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${colorClasses}`}
        >
            {children}
        </button>
    );
}

function Resumo({ label, value, color, icon: Icon }) {
    return (
        <div className={`p-4 bg-gray-800 rounded shadow-lg text-white flex flex-col justify-between \
            ${color === 'green' ? 'border-l-4 border-green-500' : ''}\
            ${color === 'blue' ? 'border-l-4 border-blue-500' : ''}\
            ${color === 'indigo' ? 'border-l-4 border-indigo-500' : ''}\
            ${color === 'yellow' ? 'border-l-4 border-yellow-500' : ''}`}
        >
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400 font-medium uppercase">{label}</p>
                {Icon && <Icon className={`h-6 w-6 ${color === 'green' ? 'text-green-500' : color === 'blue' ? 'text-blue-500' : color === 'indigo' ? 'text-indigo-500' : 'text-gray-500'}`} />}
            </div>
            <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
    );
}

// --- Componente Principal ---

export default function Faturamentos() {
    const [entries, setEntries] = useState([]);
    // Filtro agora é 'pending' | 'paid' | 'all'
    const [filter, setFilter] = useState("all"); 
    const [search, setSearch] = useState("");
    const [hourlyRate, setHourlyRate] = useState(0);
    const [openProject, setOpenProject] = useState({});

    // ---------------- LOAD/SAVE -----------------
    const save = useCallback((updatedEntries) => {
        setEntries(updatedEntries);
        localStorage.setItem(TIME_ENTRIES_KEY, JSON.stringify(updatedEntries));
    }, []);
    
    const load = useCallback(() => {
        const savedEntries = JSON.parse(localStorage.getItem(TIME_ENTRIES_KEY) || '[]');
        
        // CORREÇÃO: Garante que todas as entradas tenham o novo campo 'status'
        const migratedEntries = savedEntries.map(entry => {
            // Se for entrada antiga com 'isBilled'
            if (entry.isBilled !== undefined) {
                return { 
                    ...entry, 
                    status: entry.isBilled ? PAYMENT_STATUS.PENDING : PAYMENT_STATUS.UNBILLED,
                    isBilled: undefined 
                };
            }
            // Se for entrada nova mas sem status definido (deve ser UNBILLED)
            if (!entry.status) {
                return { ...entry, status: PAYMENT_STATUS.UNBILLED };
            }
            return entry;
        });

        setEntries(migratedEntries);
        
        const savedRate = parseFloat(localStorage.getItem(HOURLY_RATE_KEY)) || 50.00;
        setHourlyRate(savedRate);
    }, []);
    
    useEffect(() => {
        load();
    }, [load]);


    // ---------------- LÓGICA DE AGRUPAMENTO (Por Projeto) -----------------
    const projectsSummary = useMemo(() => {
        const summary = entries.reduce((acc, entry) => {
            const projectId = entry.projectId;
            const projectData = MOCK_PROJECTS.find(p => p.id === projectId);
            
            if (!projectData) return acc;
            
            const client = MOCK_CLIENTES.find(c => c.id === projectData.clienteId);
            
            if (!acc[projectId]) {
                acc[projectId] = {
                    id: projectId,
                    title: projectData.titulo,
                    clientName: client?.nome || 'Cliente Desconhecido',
                    totalDurationSeconds: 0,
                    totalHours: 0,
                    totalValue: 0,
                    entries: [],
                    // Status inicial para o projeto (o mais "urgente")
                    projectStatus: PAYMENT_STATUS.PAID,
                };
            }

            // Soma os totais
            acc[projectId].totalDurationSeconds += entry.durationSeconds;
            acc[projectId].totalHours += entry.hoursWorked;
            acc[projectId].totalValue += entry.hoursWorked * hourlyRate; 
            acc[projectId].entries.push(entry);
            
            // Lógica de Status do Projeto: O projeto assume o status mais "baixo"
            // Se alguma entrada for UNBILLED ou PENDING, o projeto é PENDING.
            if (entry.status === PAYMENT_STATUS.UNBILLED || entry.status === PAYMENT_STATUS.PENDING) {
                acc[projectId].projectStatus = PAYMENT_STATUS.PENDING;
            }

            return acc;
        }, {});
        
        let filteredProjects = Object.values(summary);

        // Aplica filtro de status
        if (filter === 'pending') {
            // Pendente = UNBILLED ou PENDING
            filteredProjects = filteredProjects.filter(p => 
                p.projectStatus === PAYMENT_STATUS.PENDING
            );
        } else if (filter === 'paid') {
            // Pago = *Todas* as entradas estão Pagas
            filteredProjects = filteredProjects.filter(p => 
                p.entries.every(e => e.status === PAYMENT_STATUS.PAID)
            );
        }
        
        // Aplica filtro de busca
        if (search) {
            const lowerSearch = search.toLowerCase();
            filteredProjects = filteredProjects.filter(p => 
                p.title.toLowerCase().includes(lowerSearch) || 
                p.clientName.toLowerCase().includes(lowerSearch)
            );
        }

        return filteredProjects.sort((a, b) => b.id - a.id);
    }, [entries, hourlyRate, filter, search]);


    // ---------------- HANDLERS -----------------
    
    // Deleta entrada individual
    const handleDelete = useCallback((entryId) => {
        const updatedEntries = entries.filter(e => e.id !== entryId);
        save(updatedEntries);
    }, [entries, save]);

    
    // Marca TODAS as entradas (UNBILLED/PENDING) de um projeto como PAGAS
    const handleMarkAsPaid = useCallback((projectId) => {
        const updatedEntries = entries.map(entry => {
            if (entry.projectId === projectId && (entry.status === PAYMENT_STATUS.PENDING || entry.status === PAYMENT_STATUS.UNBILLED)) {
                return { ...entry, status: PAYMENT_STATUS.PAID };
            }
            return entry;
        });
        save(updatedEntries);

        // SINCRONIZAÇÃO: Adiciona o projeto à lista de projetos pagos
        const billedProjects = getBilledProjects();
        if (!billedProjects.includes(projectId)) {
            saveBilledProjects([...billedProjects, projectId]);
        }
        
        // NOVO: Despacha um evento customizado para notificar outros componentes na mesma janela
        window.dispatchEvent(new Event('freelancerhub:billed_update'));

    }, [entries, save]);
    
    // Desfaz o status (volta PAGO para PENDENTE)
    const handleUnpayProject = useCallback((projectId) => {
        const updatedEntries = entries.map(entry => {
            if (entry.projectId === projectId && entry.status === PAYMENT_STATUS.PAID) {
                return { ...entry, status: PAYMENT_STATUS.PENDING };
            }
            return entry;
        });
        save(updatedEntries);

        // SINCRONIZAÇÃO: Remove o projeto da lista de projetos pagos
        const billedProjects = getBilledProjects();
        const updatedBilledProjects = billedProjects.filter(id => id !== projectId);
        saveBilledProjects(updatedBilledProjects);

        // NOVO: Despacha um evento customizado para notificar outros componentes na mesma janela
        window.dispatchEvent(new Event('freelancerhub:billed_update'));
        
    }, [entries, save]);


    // Geração de PDF por Projeto (Lógica mantida)
    const handleGenerateInvoice = useCallback((project) => {
        const projectData = MOCK_PROJECTS.find(p => p.id === project.id);
        const client = MOCK_CLIENTES.find(c => c.id === projectData.clienteId);
        
        const projectInvoiceData = {
            projectName: project.title,
            client: {
                nome: client?.nome || project.clientName, 
                email: client?.email, 
            },
            items: project.entries.map(entry => ({
                taskTitle: entry.taskTitle,
                hours: entry.hoursWorked,
                value: (entry.hoursWorked * hourlyRate), // Valor calculado
                status: entry.status, 
            })),
        };
        
        // Assumindo que generateInvoicePDF é o módulo que exporta generateProjectPDF
        generateInvoicePDF(projectInvoiceData);
        
    }, [hourlyRate]);

    // ---------------- RESUMO DO DASHBOARD -----------------
    const { totalHours, totalValuePending, totalValuePaid, totalProjects } = useMemo(() => {
        const totalHours = entries.reduce((sum, e) => sum + e.hoursWorked, 0);
        
        const totalValuePending = entries
            .filter(e => e.status === PAYMENT_STATUS.PENDING || e.status === PAYMENT_STATUS.UNBILLED)
            .reduce((sum, e) => sum + (e.hoursWorked * hourlyRate), 0);
        
        const totalValuePaid = entries
            .filter(e => e.status === PAYMENT_STATUS.PAID)
            .reduce((sum, e) => sum + (e.hoursWorked * hourlyRate), 0);
            
        const projectIds = new Set(entries.map(e => e.projectId));
        const totalProjects = projectIds.size;
        
        return {
            totalHours,
            totalValuePending,
            totalValuePaid,
            totalProjects,
        };
    }, [entries, hourlyRate]);


    return (
        <div className="p-4 sm:p-8 bg-gray-900 min-h-full">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6">Faturamentos</h1>

            {/* 1. Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Resumo 
                    label="Projetos Registrados" 
                    value={totalProjects} 
                    color="indigo" 
                    icon={TagIcon}
                />
                <Resumo 
                    label="Horas Totais" 
                    value={`${totalHours.toFixed(2)}h`} 
                    color="blue" 
                    icon={ClockIcon}
                />
                <Resumo 
                    label="Valor Pendente de Pagamento" 
                    value={`R$ ${totalValuePending.toFixed(2)}`} 
                    color="yellow" 
                    icon={CurrencyDollarIcon}
                />
                 <Resumo 
                    label="Valor Total Pago" 
                    value={`R$ ${totalValuePaid.toFixed(2)}`} 
                    color="green" 
                    icon={BanknotesIcon} // Usando BanknotesIcon para Pago
                />
            </div>

            {/* 2. Filtros e Configurações */}
            <div className="bg-gray-800 p-5 rounded-xl shadow-xl border border-gray-700 mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">Configurações e Filtros</h2>
                
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    
                    {/* Taxa Horária */}
                    <div className="flex items-center gap-2">
                        <CurrencyDollarIcon className="h-6 w-6 text-indigo-500" />
                        <span className="text-gray-300 font-medium">Taxa Horária Atual:</span>
                        <span className="text-white font-bold">R$ {hourlyRate.toFixed(2)}</span>
                    </div>

                    {/* Filtro de Status */}
                    <div className="flex gap-2 text-sm">
                        <Button 
                            color={filter === 'all' ? 'indigo' : 'yellow'} 
                            onClick={() => setFilter('all')}
                            title="Ver Todos os Projetos"
                        >
                            Todos
                        </Button>
                        <Button 
                            color={filter === 'pending' ? 'indigo' : 'yellow'} 
                            onClick={() => setFilter('pending')}
                            title="Ver Projetos Pendentes"
                        >
                            Pendentes
                        </Button>
                         <Button 
                            color={filter === 'paid' ? 'indigo' : 'yellow'} 
                            onClick={() => setFilter('paid')}
                            title="Ver Projetos Pagos"
                        >
                            Pagos
                        </Button>
                    </div>

                    {/* Campo de Busca */}
                    <input
                        type="text"
                        placeholder="Buscar por projeto ou cliente..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full md:w-auto p-2 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400"
                    />
                </div>
            </div>

            {/* 3. VISUALIZAÇÃO AGRUPADA POR PROJETO */}
            <div className="mt-8">
                <h2 className="text-2xl font-semibold text-white mb-4">
                    Projetos Agrupados ({projectsSummary.length})
                </h2>
                
                {projectsSummary.length === 0 ? (
                    <p className="text-gray-400 p-4 bg-gray-800 rounded-xl">Nenhum projeto encontrado com os filtros aplicados.</p>
                ) : (
                    <div className="space-y-6">
                        {projectsSummary.map((project) => {
                            const isPaid = project.entries.every(e => e.status === PAYMENT_STATUS.PAID);
                            
                            // O status é Pago se todas as entradas forem Pago, caso contrário é Pendente.
                            const projectDisplayStatus = isPaid ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.PENDING;
                            
                            const statusColor = isPaid ? 'text-green-400' : 'text-yellow-400';
                            
                            return (
                            <div key={project.id} className="bg-gray-800 p-5 rounded-xl shadow-xl border border-gray-700">
                                
                                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-gray-700 pb-3 mb-3">
                                    
                                    <div className="flex-1 min-w-0 mb-3 lg:mb-0">
                                        <h3 className="text-xl font-bold text-indigo-400 truncate">
                                            {project.title}
                                        </h3>
                                        <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                                            <UserCircleIcon className="h-4 w-4" /> Cliente: {project.clientName}
                                        </p>
                                        <p className={`text-sm font-semibold mt-1 ${statusColor}`}>
                                            Status: {projectDisplayStatus}
                                        </p>
                                    </div>
                                    
                                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                                        
                                        <div className="text-left sm:text-right mr-4 min-w-[150px]">
                                            <p className="text-lg font-bold text-white">
                                                R$ {project.totalValue.toFixed(2)}
                                            </p>
                                            <p className="text-sm text-gray-400">
                                                {project.totalHours.toFixed(2)} horas
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-2 justify-end">
                                            
                                            {/* Ação de Pagamento */}
                                            {isPaid ? (
                                                // Botão para desfazer o pagamento
                                                <Button
                                                    color="yellow"
                                                    onClick={() => handleUnpayProject(project.id)}
                                                    title="Desfazer Pagamento (Voltar para Pendente)"
                                                >
                                                    <ArrowUturnLeftIcon className="h-4 w-4" /> Desfazer Pago
                                                </Button>
                                            ) : (
                                                // Botão para marcar como Pago
                                                <Button
                                                    color="green"
                                                    onClick={() => handleMarkAsPaid(project.id)}
                                                    title="Marcar como Pago"
                                                >
                                                    <BanknotesIcon className="h-4 w-4" /> Marcar Pago
                                                </Button>
                                            )}

                                            {/* Gerar PDF */}
                                            <Button
                                                color="indigo"
                                                onClick={() => handleGenerateInvoice(project)}
                                                title="Gerar PDF de Fatura"
                                            >
                                                <DocumentTextIcon className="h-4 w-4" /> PDF
                                            </Button>
                                            
                                            {/* Ver/Esconder Tarefas */}
                                            <Button 
                                                color="yellow"
                                                onClick={() => setOpenProject(prev => ({ ...prev, [project.id]: !prev[project.id] }))}
                                                title={openProject[project.id] ? "Esconder Tarefas" : "Ver Tarefas"}
                                            >
                                                <ClockIcon className="h-4 w-4" /> {openProject[project.id] ? "Esconder" : "Ver Tarefas"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Lista de Tarefas (Entradas de Tempo) */}
                                {openProject[project.id] && (
                                    <div className="mt-4 border-t border-gray-700 pt-4 space-y-2">
                                        <h4 className="text-lg font-semibold text-white mb-3">Detalhes das Entradas de Tempo:</h4>
                                        
                                        {project.entries.map((entry) => {
                                            const entryStatusColor = entry.status === PAYMENT_STATUS.PAID ? 'text-green-400' 
                                                : 'text-yellow-400'; // UNBILLED e PENDING são amarelos agora
                                                
                                            return (
                                                <div key={entry.id} className="flex justify-between items-center bg-gray-700 p-3 rounded-lg transition hover:bg-gray-600">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-white truncate">{entry.taskTitle}</p>
                                                        <p className={`text-xs ${entryStatusColor}`}>
                                                            Data: {formatDate(entry.date)} | Status: {entry.status}
                                                        </p>
                                                    </div>
                                                    <div className="text-right mx-4 min-w-[120px]">
                                                        <p className="text-sm text-gray-300">
                                                            {entry.hoursWorked.toFixed(2)}h
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            R$ {(entry.hoursWorked * hourlyRate).toFixed(2)}
                                                        </p>
                                                    </div>
                                                    
                                                    {/* Ação de Excluir Tarefa (Mantida) */}
                                                    <Button 
                                                        color="red"
                                                        onClick={() => handleDelete(entry.id)}
                                                        title="Excluir Entrada de Tempo"
                                                    >
                                                        <XMarkIcon className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}