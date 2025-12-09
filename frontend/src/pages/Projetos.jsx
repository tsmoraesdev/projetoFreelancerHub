// src/pages/Projetos.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { 
    TagIcon, 
    ArrowRightIcon, 
    ClockIcon, 
    CalendarIcon,
    PencilSquareIcon
} from "@heroicons/react/24/solid";

// Importação da API configurada com Axios
import api from '../api'; 

import { PROJECT_STATUSES } from '../data/mocks'; 

// Endpoints
const PROJECTS_ENDPOINT = 'api/projects';
const CLIENTS_ENDPOINT = 'api/clients';


const BILLED_PROJECTS_KEY = "freelancerhub_billed_projects"; 

const getBilledProjects = () => {
    return new Set(JSON.parse(localStorage.getItem(BILLED_PROJECTS_KEY) || '[]'));
};


// --- Componente Principal Projetos ---
export default function Projetos() {
    
    const navigate = useNavigate();

    // Estados de Dados da API
    const [projetos, setProjetos] = useState([]); 
    const [clientes, setClientes] = useState([]); 
    
    // Estados de Controle
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [currentProject, setCurrentProject] = useState(null); // Projeto em edição (null para criação)
    
    // Estado do Faturamento Local
    const [billedProjects, setBilledProjects] = useState(getBilledProjects()); 


    const [form, setForm] = useState({ 
        title: '', 
        client_id: '', 
        description: '', 
        status: 'Proposta', 
        billing_type: 'hourly', // Novo campo: 'hourly' ou 'fixed'
        fixed_value: '', // Valor Fixo
        // Datas no formato yyyy-mm-dd
        start_date: new Date().toISOString().split('T')[0], 
        due_date: '' 
    });

  

    // 1. Função para buscar a lista de clientes (necessário para o dropdown do formulário)
    const fetchClients = useCallback(async () => {
        try {
            const response = await api.get(CLIENTS_ENDPOINT);
            setClientes(response.data);
        } catch (err) {
            console.error('Erro ao buscar clientes:', err);
            // Defina um erro mais amigável ou ignore, dependendo da criticidade
        }
    }, []);

    // 2. Função para buscar a lista de projetos (GET)
    const fetchProjects = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get(PROJECTS_ENDPOINT);
            // A API já retorna o nome do cliente no campo 'client_name'
            setProjetos(response.data);
        } catch (err) {
            console.error('Erro ao buscar projetos:', err);
            const errorMessage = err.response?.data?.error || 'Falha ao carregar projetos.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    // 3. Função de Submissão (POST/PUT)
    async function handleSubmit(e) {
        e.preventDefault();
        
        setIsSubmitting(true);
        setError(null);
        
        const isEditing = !!currentProject;
        const url = isEditing ? `${PROJECTS_ENDPOINT}/${currentProject.id}` : PROJECTS_ENDPOINT;
        
        // Mapear campos do formulário para o formato do backend
        const payload = {
            ...form,
            client_id: parseInt(form.client_id), 
            // Garante que fixed_value seja um número (0 se não for fixo)
            fixed_value: form.billing_type === 'fixed' ? parseFloat(form.fixed_value || 0) : 0,
        };

        try {
            // Escolhe o método: PUT para edição, POST para criação
            const response = isEditing 
                ? await api.put(url, payload)
                : await api.post(url, payload);

            const action = isEditing ? 'atualizado' : 'adicionado';
            alert(`Projeto "${response.data.title}" ${action} com sucesso!`);
            
            await fetchProjects();
            closeModal();

        } catch (err) {
            console.error(`Erro ao ${isEditing ? 'atualizar' : 'criar'} projeto:`, err);
            const errorMessage = err.response?.data?.error || 'Falha na comunicação com o servidor.';
            setError(errorMessage);
            alert(`Erro: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    }

    // 4. Lógica de Exclusão (DELETE)
    async function handleDeleteConfirmed() {
        if (!currentProject) return;

        if (!window.confirm(`Tem certeza que deseja excluir o projeto ${currentProject.title}? Todos os dados associados (tarefas, lançamentos de tempo) serão perdidos.`)) {
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Requisição DELETE
            const response = await api.delete(`${PROJECTS_ENDPOINT}/${currentProject.id}`);
            
            alert(response.data.message);
            
            await fetchProjects();
            closeModal();
            
        } catch (err) {
            console.error('Erro ao excluir projeto:', err);
            const errorMessage = err.response?.data?.error || 'Falha na exclusão. Tente novamente.';
            alert(`Erro: ${errorMessage}`);
        } finally {
             setIsSubmitting(false);
        }
    }

    // ################# FIM FUNÇÕES DE ACESSO À API COM AXIOS ###################

    // Chamadas iniciais
    useEffect(() => {
        fetchClients();
        fetchProjects();
    }, [fetchClients, fetchProjects]); 

    // Efeito para recarregar o status de pagamento (mantido)
    useEffect(() => {
        const handleStatusUpdate = () => {
            setBilledProjects(getBilledProjects());
        };

        window.addEventListener('storage', handleStatusUpdate);
        window.addEventListener('freelancerhub:billed_update', handleStatusUpdate); 

        return () => {
            window.removeEventListener('storage', handleStatusUpdate);
            window.removeEventListener('freelancerhub:billed_update', handleStatusUpdate);
        };
    }, []);

    // Funções de UI
    function closeModal() {
        setShowCreateModal(false);
        setCurrentProject(null);
        setForm({ 
            title: '', 
            client_id: '', 
            description: '', 
            status: 'Proposta',
            billing_type: 'hourly',
            fixed_value: '',
            start_date: new Date().toISOString().split('T')[0],
            due_date: ''
        });
    }

    function handleCreate() {
        setCurrentProject(null); 
        closeModal();
        setShowCreateModal(true);
    }

    function handleEdit(project) {
        setCurrentProject(project); 
        // Preenche o formulário com os dados do projeto da API
        setForm({ 
            title: project.title, 
            client_id: project.client_id, // Usamos client_id do backend
            description: project.description || '', 
            status: project.status,
            billing_type: project.billing_type || 'hourly',
            fixed_value: project.fixed_value > 0 ? project.fixed_value : '', 
   
            start_date: project.start_date || '',

            due_date: project.due_date || ''
        });
        setShowCreateModal(true);
    }
    
    function handleAccessProject(id) {
        navigate(`/kanban/${id}`);
    }

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };
    
    // Processamento de dados e faturamento (useMemo)
    const projetosComStatus = useMemo(() => {
        return projetos.map(project => {
            const isBilled = billedProjects.has(project.id);
            const status = isBilled ? "Faturado/Pago" : project.status; 
            
            return {
                ...project,
                isBilled: isBilled,
                status: status,
                // client_name já vem do JOIN do backend
                clienteNome: project.client_name || 'Cliente Desconhecido', 
            };
        });
    }, [projetos, billedProjects]);


    const projetosFiltrados = projetosComStatus.filter(projeto => 
        // Filtra por title e client_name
        projeto.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        projeto.clienteNome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    function getStatusColorClass(status, isBilled) {
        if (isBilled) {
            return 'bg-green-600 text-white'; 
        }
        switch (status) {
            case "Proposta": return 'bg-blue-600 text-white';
            case "Em Andamento": return 'bg-yellow-600 text-gray-900';
            case "Concluído": return 'bg-green-600 text-white';
            case "Planejamento": return 'bg-indigo-600 text-white'; // Novo status (do projectsController)
            default: return 'bg-gray-600 text-white';
        }
    }
    
    const modalTitle = currentProject ? 'Editar Projeto' : 'Adicionar Novo Projeto';
    const submitButtonText = currentProject ? 'Salvar Alterações' : 'Salvar Projeto';

    return (
        <div className="p-8 bg-gray-900 min-h-screen">
            <h1 className="text-4xl font-bold text-white mb-6">
                Gerenciamento de Projetos
            </h1>

            {/* BARRA DE AÇÕES (Busca e Adicionar) */}
            <div className="flex justify-between items-center bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700 mb-6">
                
                {/* Busca */}
                <input 
                    type="text" 
                    placeholder="Buscar por título ou cliente..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="w-1/2 p-3 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500"
                />

                {/* Adicionar Projeto */}
                <button 
                    onClick={handleCreate}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition duration-150 flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Adicionar Projeto
                </button>
            </div>
            
            {/* Status de Carregamento e Erro */}
            {isLoading && (
                <p className="text-indigo-400 mt-4 text-center">Carregando projetos...</p>
            )}

            {error && (
                <div className="bg-red-900 p-4 rounded-lg mt-4 text-white">
                    <p className="font-bold">Erro de API:</p>
                    <p>{error}</p>
                </div>
            )}


            {/* LISTA DE PROJETOS EM FORMATO CARD */}
            {!isLoading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projetosFiltrados.length === 0 ? (
                        <p className="text-gray-400 p-4 col-span-full bg-gray-800 rounded-lg">Nenhum projeto encontrado.</p>
                    ) : (
                        projetosFiltrados.map((project) => {
                            
                            const projectClass = project.isBilled
                                ? 'bg-green-900/40 border-green-700' 
                                : 'bg-gray-800 border-gray-700';      
                                
                            const statusTagClass = getStatusColorClass(project.status, project.isBilled);

                            return (
                                <div 
                                    key={project.id} 
                                    className={`p-5 rounded-xl shadow-xl border ${projectClass} transition duration-300 hover:shadow-2xl`}
                                >
                                    {/* Status Tag e Botão de Edição */}
                                    <div className="flex justify-between items-start mb-3">
                                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusTagClass}`}>
                                            {project.status}
                                        </span>
                                        <button 
                                            onClick={() => handleEdit(project)}
                                            className="text-indigo-400 hover:text-indigo-300"
                                            title="Editar Projeto"
                                        >
                                            <PencilSquareIcon className="h-6 w-6" />
                                        </button>
                                    </div>

                                    {/* Título (title) */}
                                    <h2 className="text-2xl font-bold text-white mb-2">
                                        {project.title}
                                    </h2>
                                    {/* Cliente (client_name) */}
                                    <p className="text-sm text-gray-400 mb-4">
                                        Cliente: {project.clienteNome || 'N/A'}
                                    </p>

                                    <div className="space-y-2 text-sm text-gray-300">
                                        {/* Tipo de Cobrança (billing_type) e Valor Fixo */}
                                        <p className="flex items-center gap-2">
                                            <TagIcon className="h-4 w-4 text-indigo-300" /> 
                                            Tipo: {project.billing_type === 'fixed' 
                                                ? `Fixo (R$ ${parseFloat(project.fixed_value).toFixed(2)})`
                                                : 'Por Hora'
                                            }
                                        </p>
                                        {/* Data de Início (start_date) */}
                                        <p className="flex items-center gap-2">
                                            <CalendarIcon className="h-4 w-4 text-indigo-300" /> 
                                            Início: {project.start_date ? new Date(project.start_date + 'T00:00:00').toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'N/A'}
                                        </p>
                                        {/* Data Limite (due_date) */}
                                        <p className="flex items-center gap-2">
                                            <ClockIcon className="h-4 w-4 text-indigo-300" /> 
                                            Prazo: {project.due_date ? new Date(project.due_date + 'T00:00:00').toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'Não Definido'}
                                        </p>
                                    </div>
                                    
                                    <div className="mt-4 pt-4 border-t border-gray-700">
                                        <button 
                                            onClick={() => handleAccessProject(project.id)}
                                            className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                                        >
                                            Acessar Kanban
                                            <ArrowRightIcon className="h-4 w-4 ml-1 transition transform hover:translate-x-1" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
            
            {/* MODAL DE CRIAÇÃO/EDIÇÃO (UNIFICADO) */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-lg border border-gray-700">
                        <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-700 pb-2">
                            {modalTitle}
                        </h2>
                        
                        {currentProject && (
                            <p className="text-sm text-gray-500 mb-4">ID do Projeto: **{currentProject.id}**</p>
                        )}
                        
                        {error && (
                            <div className="bg-red-900 border border-red-700 text-white p-3 rounded-md mb-4 text-center">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            
                            {/* Título do Projeto (title) */}
                            <input 
                                placeholder="Título do Projeto (Obrigatório)" 
                                value={form.title} 
                                onChange={e => setForm({...form, title: e.target.value})} 
                                className="w-full p-3 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400"
                                required
                            />
                            
                            {/* Cliente (client_id) */}
                            <select
                                value={form.client_id}
                                onChange={e => setForm({...form, client_id: e.target.value})}
                                className="w-full p-3 border border-gray-600 rounded bg-gray-700 text-white"
                                required
                            >
                                <option value="" disabled>Selecione um Cliente (Obrigatório)</option>
                                {clientes.map(cliente => (
                                    <option key={cliente.id} value={cliente.id}>
                                        {cliente.name}
                                    </option>
                                ))}
                                {clientes.length === 0 && (
                                     <option value="" disabled>Carregando Clientes...</option>
                                )}
                            </select>

                            {/* Status */}
                            <select
                                value={form.status}
                                onChange={e => setForm({...form, status: e.target.value})}
                                className="w-full p-3 border border-gray-600 rounded bg-gray-700 text-white"
                                required
                            >
                                {/* Inclui todos os status possíveis (incluindo "Planejamento" do autoStatus) */}
                                {PROJECT_STATUSES.concat("Planejamento").map(status => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                            
                            {/* Tipo de Cobrança (billing_type) */}
                            <div className="flex gap-4">
                                <select
                                    value={form.billing_type}
                                    onChange={e => setForm({...form, billing_type: e.target.value})}
                                    className="w-full p-3 border border-gray-600 rounded bg-gray-700 text-white"
                                    required
                                >
                                    <option value="hourly">Cobrança Por Hora</option>
                                    <option value="fixed">Valor Fixo</option>
                                </select>

                                {/* Valor Fixo do Projeto (Visível apenas se 'fixed' for selecionado) */}
                                {form.billing_type === 'fixed' && (
                                    <input
                                        type="number"
                                        placeholder="Valor Fixo (R$)"
                                        value={form.fixed_value}
                                        onChange={e => setForm({...form, fixed_value: e.target.value})}
                                        min="0"
                                        step="0.01"
                                        required={form.billing_type === 'fixed'}
                                        className="w-full p-3 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400"
                                    />
                                )}
                            </div>

                            {/* Datas */}
                            <div className="flex gap-4">
                                <input
                                    type="date"
                                    placeholder="Data de Início"
                                    value={form.start_date}
                                    onChange={e => setForm({...form, start_date: e.target.value})}
                                    className="w-full p-3 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400"
                                    required
                                />
                                <input
                                    type="date"
                                    placeholder="Data de Prazo (Opcional)"
                                    value={form.due_date}
                                    onChange={e => setForm({...form, due_date: e.target.value})}
                                    className="w-full p-3 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400"
                                />
                            </div>

                            {/* Descrição */}
                            <textarea 
                                placeholder="Descrição detalhada do projeto..." 
                                value={form.description} 
                                onChange={e => setForm({...form, description: e.target.value})} 
                                rows="3"
                                className="w-full p-3 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400"
                            />

                            {/* Botões de Ação */}
                            <div className="flex justify-between items-center pt-2">
                                
                                {/* BOTÃO DE EXCLUIR (Apenas visível na Edição) */}
                                <div>
                                    {currentProject && (
                                        <button 
                                            type="button" 
                                            onClick={handleDeleteConfirmed}
                                            disabled={isSubmitting}
                                            className={`px-4 py-2 bg-red-600 text-white rounded transition 
                                            ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'}`}
                                        >
                                            {isSubmitting ? 'Excluindo...' : 'Excluir Projeto'}
                                        </button>
                                    )}
                                </div>
                                
                                <div className="flex gap-3">
                                    <button 
                                        type="button" 
                                        onClick={closeModal}
                                        disabled={isSubmitting}
                                        className="px-4 py-2 border border-gray-600 text-gray-300 rounded hover:bg-gray-700 transition"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className={`px-4 py-2 bg-indigo-600 text-white rounded transition 
                                        ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'}`}
                                    >
                                        {isSubmitting ? 'Salvando...' : submitButtonText}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}