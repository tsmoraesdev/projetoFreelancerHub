// src/pages/Faturamentos.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
// Assumindo que este utilitário de API é usado em Cronometro.jsx
import api from '../api'; 
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

import { generateInvoicePDF } from "../utils/generateInvoicePDF"; //falta
import { formatDate, formatTime } from "../utils"; 


const HOURLY_RATE_KEY = "freelancerhub_hourly_rate";
const USER_PROFILE_KEY = 'user_profile'; 
const BILLED_PROJECTS_KEY = "freelancerhub_billed_projects"; 



const PAYMENT_STATUS = {

    PENDING: "Pendente",
    PAID: "Pago",
    UNBILLED: "Não Faturado",
};


const TIME_ENTRIES_ENDPOINT = '/api/time-entries';

const INVOICES_ENDPOINT = '/api/invoices'; 


const getBilledProjects = () => {
    return JSON.parse(localStorage.getItem(BILLED_PROJECTS_KEY) || '[]');
};

const saveBilledProjects = (projectIds) => {
    localStorage.setItem(BILLED_PROJECTS_KEY, JSON.stringify(projectIds));
};


function Button({ children, onClick, color = 'indigo', title, disabled = false }) {

    const baseClasses = `p-2 rounded flex items-center justify-center transition \
        ${disabled ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'hover:scale-105'} \
        `;

    const colorClasses = disabled ? '' :
        `${color === 'indigo' ? 'bg-indigo-600 hover:bg-cyan-300 text-white' : ''} \
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
    const [isLoading, setIsLoading] = useState(true); 
    
 
    const mapEntryFromApi = (entry) => {
        const hoursWorked = entry.duration_seconds / 3600;

        return {
            id: entry.id,
            projectId: entry.project_id, 
            taskTitle: entry.task_title,
            projectTitle: entry.project_title,
            client_id: entry.client_id, 
            durationSeconds: entry.duration_seconds,
            hoursWorked: hoursWorked, 
            status: entry.is_billed ? PAYMENT_STATUS.PENDING : PAYMENT_STATUS.UNBILLED, 
            date: entry.start_time, 
        };
    };

    
    // Função para buscar os registros de tempo
    const fetchTimeEntries = useCallback(async () => {
        setIsLoading(true);
        try {
            // Usa o endpoint que chama timeEntriesController.list
            const response = await api.get(TIME_ENTRIES_ENDPOINT);
            
            // Mapeia os dados da API para o formato esperado pelo componente
            const mappedEntries = response.data.map(mapEntryFromApi);

            setEntries(mappedEntries);
            
        } catch (error) {
            console.error('Erro ao buscar registros de tempo:', error);
            // Poderia mostrar uma mensagem de erro na UI
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    // Função para carregar a taxa horária (mantida no localStorage)
    const loadHourlyRate = useCallback(() => {
        // 1. Pega a string de dígitos do LocalStorage (ex: '12345')
        const savedRateClean = localStorage.getItem(HOURLY_RATE_KEY); 
        
        let rate;
        
        if (savedRateClean) {
            // 2. Converte para inteiro e divide por 100 para obter o valor correto (ex: 123.45)
            // Isso é necessário porque o Cronômetro salva o valor como o número de centavos.
            rate = parseInt(savedRateClean) / 100;
        } else {
            // Valor padrão se não estiver no LocalStorage
            rate = 50.00; 
        }
        
        // Garante que o rate é um número (fallback para 0 se NaN)
        setHourlyRate(isNaN(rate) ? 0 : rate); 
    }, []);

    
    useEffect(() => {
        loadHourlyRate();
        fetchTimeEntries();
        // Listener para atualizar se o cronômetro salvar uma nova entrada
        window.addEventListener('freelancerhub:time_entry_update', fetchTimeEntries);
        
        return () => {
            window.removeEventListener('freelancerhub:time_entry_update', fetchTimeEntries);
        };
    }, [loadHourlyRate, fetchTimeEntries]);


    // ---------------- LÓGICA DE AGRUPAMENTO (Por Projeto) -----------------
    const projectsSummary = useMemo(() => {
        const summary = entries.reduce((acc, entry) => {
            const projectId = entry.projectId;
            
            // Simulação de busca de nome do cliente (em um app real, o cliente viria no join)
            // Como o list do controller retorna client_id, podemos simular o nome do cliente aqui
            const clientName = `Cliente ID ${entry.client_id}`; // Simulação
            
            if (!acc[projectId]) {
                acc[projectId] = {
                    id: projectId,
                    title: entry.projectTitle, 
                    clientName: clientName, 
                    totalDurationSeconds: 0,
                    totalHours: 0,
                    totalValue: 0,
                    entries: [],
                    projectStatus: PAYMENT_STATUS.PAID,
                };
            }

            // Soma os totais
            acc[projectId].totalDurationSeconds += entry.durationSeconds;
            acc[projectId].totalHours += entry.hoursWorked;
            acc[projectId].totalValue += entry.hoursWorked * hourlyRate; 
            acc[projectId].entries.push(entry);
            
            // Lógica de Status do Projeto: O projeto assume o status mais "baixo"
            // Se alguma entrada for UNBILLED (is_billed: false) ou PENDING (is_billed: true), o projeto é PENDING.
            if (entry.status !== PAYMENT_STATUS.PAID) {
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

        // Ordena por ID do projeto
        return filteredProjects.sort((a, b) => b.id - a.id);
    }, [entries, hourlyRate, filter, search]);


    // ---------------- HANDLERS DE AÇÃO DA API -----------------
    
    // Deleta entrada individual (usa timeEntriesController.remove)
    const handleDelete = useCallback(async (entryId) => {
        if (!window.confirm('Tem certeza que deseja excluir este registro de tempo?')) return;
        
        try {
            // Chama a API de exclusão
            await api.delete(`${TIME_ENTRIES_ENDPOINT}/${entryId}`);
            
            // Se a exclusão for bem-sucedida, atualiza a lista de entradas
            alert('Registro de tempo excluído com sucesso.');
            fetchTimeEntries(); 

        } catch (error) {
            console.error('Erro ao excluir registro de tempo:', error);
            alert('Erro ao excluir registro de tempo. Verifique a permissão.');
        }

    }, [fetchTimeEntries]);

    
    /*
     * NOVO HANDLER: Cria uma Fatura de verdade (em vez de só marcar como Pago)
     * Isso utiliza invoicesController.create e delega a lógica de "marcar como pago" 
     * para o backend.
    */
    const handleCreateInvoice = useCallback(async (project) => {
        // Coleta as IDs das entradas que NÃO foram pagas (PENDING/UNBILLED)
        const idsToBill = project.entries
                            .filter(e => e.status !== PAYMENT_STATUS.PAID)
                            .map(e => e.id);

        if (idsToBill.length === 0) {
            alert('Não há entradas de tempo não faturadas para este projeto.');
            return;
        }

        if (!window.confirm(`Gerar Fatura para o projeto "${project.title}" no valor de R$ ${project.totalValue.toFixed(2)}?`)) {
            return;
        }

        try {
            const data = {
                time_entry_ids: idsToBill
            };

            // Chama o create da API
            await api.post(INVOICES_ENDPOINT, data); 

            alert('Fatura criada com sucesso! Atualizando registros de tempo...');
            fetchTimeEntries();
            window.dispatchEvent(new Event('freelancerhub:billed_update'));

        } catch (error) {
            console.error('Erro ao criar fatura:', error);
            const errorMessage = error.response?.data?.error || 'Erro ao criar fatura. Verifique o console para detalhes.';
            alert(errorMessage);
        }

    }, [fetchTimeEntries]);
        

    // ---------------- RESUMO DO DASHBOARD (Lógica Inalterada) -----------------
    const { totalHours, totalValuePending, totalValuePaid, totalProjects } = useMemo(() => {
        const totalHours = entries.reduce((sum, e) => sum + e.hoursWorked, 0);
        
        // Agora o PENDING/UNBILLED é a soma do que não tem status PAID
        const totalValuePending = entries
            .filter(e => e.status !== PAYMENT_STATUS.PAID) 
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


    if (isLoading) {
        return <div className="p-4 sm:p-8 bg-gray-900 min-h-full text-white text-center text-xl">Carregando Faturamentos...</div>;
    }


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
                    icon={BanknotesIcon} 
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
                        {/* Exibe o valor já convertido */}
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
                            // isPaid agora verifica se *todas* as entradas do projeto são PAID
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
                                            
                                            {/* Ação de Pagamento/Faturamento */}
                                            {!isPaid && (
                                                // Botão para criar fatura para entradas não pagas
                                                <Button
                                                    color="green"
                                                    onClick={() => handleCreateInvoice(project)}
                                                    title="Gerar Fatura e Marcar Entradas como Faturadas"
                                                >
                                                    <BanknotesIcon className="h-4 w-4" /> Gerar Fatura
                                                </Button>
                                            )}
                                            
                                            {/* O botão de "Desfazer Pago" é removido, pois o status de pago deve ser gerenciado pela API de Faturas. */}
                                            
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
                                                : 'text-yellow-400';
                                                
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
                                                    
                                                    {/* Ação de Excluir Tarefa */}
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