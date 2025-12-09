// src/pages/Clientes.jsx
import React, { useState, useEffect, useCallback } from 'react';
// Importação da API configurada com Axios
import api from '../api'; // Importa a instância 'api'

// URL base da API para clientes (Usaremos o Axios/API.js, mas o endpoint é /clients)
const CLIENTS_ENDPOINT = 'api/clients'; 
// Note: O Axios no arquivo 'api.js' já deve ter a baseURL '/api'
// Se a baseURL for '', use const CLIENTS_ENDPOINT = '/api/clients';

// ################ lista de clientes #######
function ClientesLista({ clientes, onEdit, onDelete }) {
    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl mt-6">
            <h3 className="text-white text-xl font-semibold mb-4 border-b border-gray-700 pb-2">
                Lista de Clientes ({clientes.length} totais)
            </h3>
            {clientes.length === 0 ? (
                <p className="text-gray-400">Nenhum cliente cadastrado.</p>
            ) : (
                <div className="space-y-4">
                    {clientes.map(cliente => (
                        <div key={cliente.id} className="bg-gray-700 p-4 rounded-md flex justify-between items-center transition hover:bg-gray-600">
                            <div>
                                <p className="text-lg font-bold text-white">{cliente.name}</p>
                                <p className="text-sm text-gray-400">
                                    ID: {cliente.id} | Email: {cliente.email} | Contato: {cliente.phone || 'N/A'} | Pessoa de Contato: {cliente.contact_person || 'N/A'}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => onEdit(cliente)} 
                                    className="text-sm px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                >
                                    Editar
                                </button>
                                <button
                                    onClick={() => onDelete(cliente)}
                                    className="text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                    Excluir
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ####### Componente Principal Clientes ###
export default function Clientes() {
    
    const [clientes, setClientes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    
    // Estados para o Modal de Criação/Edição
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); // Novo estado de submissão
    const [currentClient, setCurrentClient] = useState(null); // Cliente em edição (null para criação)
    
    // Estado do Formulário (Ajustado para os campos do Backend)
    const [form, setForm] = useState({ 
        name: '', 
        contact_person: '', 
        email: '', 
        phone: '' 
    });

    // ################# FUNÇÕES DE ACESSO À API COM AXIOS ###################

    // Função para buscar a lista de clientes (GET)
    const fetchClients = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Usa a instância 'api' do Axios
            const response = await api.get(CLIENTS_ENDPOINT);

            setClientes(response.data);
        } catch (err) {
            console.error('Erro ao buscar clientes:', err);
            // Captura o erro formatado do backend ou uma mensagem genérica
            const errorMessage = err.response?.data?.error || 'Falha ao carregar clientes. Verifique a conexão com a API.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Chama a função de busca ao carregar o componente
    useEffect(() => {
        fetchClients();
    }, [fetchClients]); 
    

    // Função para Exclusão (DELETE)
    async function handleDeleteConfirmed() {
        if (!currentClient) return;

        if (!window.confirm(`Tem certeza que deseja excluir o cliente ${currentClient.name}? Esta ação é irreversível.`)) {
            return;
        }
        
        setIsSubmitting(true);
        setError(null);

        try {
            // Usa a instância 'api' do Axios
            const response = await api.delete(`${CLIENTS_ENDPOINT}/${currentClient.id}`);
            
            // O backend retorna { message: 'Cliente excluído com sucesso.' }
            alert(response.data.message);
            
            // Atualiza a lista
            await fetchClients();
            closeModal();
            
        } catch (err) {
            console.error('Erro ao excluir cliente:', err);
            // Trata o erro de FK (conflito 409) ou outro erro
            const errorMessage = err.response?.data?.error || 'Falha na exclusão. Tente novamente.';
            alert(`Erro: ${errorMessage}`);
        } finally {
             setIsSubmitting(false);
        }
    }
    
    // Lógica de Submissão (Criação POST OU Edição PUT)
    async function handleSubmit(e) {
        e.preventDefault();
        
        setIsSubmitting(true);
        setError(null);
        
        const isEditing = !!currentClient;
        const url = isEditing ? `${CLIENTS_ENDPOINT}/${currentClient.id}` : CLIENTS_ENDPOINT;
        
        try {
            // Escolhe o método: PUT para edição, POST para criação
            const response = isEditing 
                ? await api.put(url, form)
                : await api.post(url, form);

            // Feedback de sucesso
            const action = isEditing ? 'atualizado' : 'adicionado';
            alert(`Cliente ${response.data.name} ${action} com sucesso!`);
            
            // Atualiza a lista completa
            await fetchClients();
            closeModal();

        } catch (err) {
            console.error(`Erro ao ${isEditing ? 'atualizar' : 'criar'} cliente:`, err);
            // Tenta pegar a mensagem de erro do backend (ex: nome obrigatório)
            const errorMessage = err.response?.data?.error || 'Falha na comunicação com o servidor.';
            setError(errorMessage);
            alert(`Erro: ${errorMessage}`);

        } finally {
            setIsSubmitting(false);
        }
    }
    
    // ################# FIM FUNÇÕES DE ACESSO À API COM AXIOS ###################


    function closeModal() {
        setShowModal(false);
        setCurrentClient(null);
        setForm({ name: '', contact_person: '', email: '', phone: '' });
    }

    function handleCreate() {
        setCurrentClient(null); 
        setForm({ name: '', contact_person: '', email: '', phone: '' });
        setShowModal(true);
    }
    
    function handleEdit(cliente) {
        setCurrentClient(cliente); 
        setForm({ 
            name: cliente.name, 
            contact_person: cliente.contact_person || '', 
            email: cliente.email, 
            phone: cliente.phone || ''
        });
        setShowModal(true);
    }

    // Função para exclusão a partir do componente filho ClientesLista
    function handleListDelete(cliente) {
        setCurrentClient(cliente); 
        // Chama a função de exclusão no modal
        handleDeleteConfirmed(); 
    }

    function handleSearch(e) {
        setSearchTerm(e.target.value);
    }

    // Filtra a lista
    const clientesFiltrados = clientes.filter(cliente => 
        cliente.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Texto dinâmico para o modal
    const modalTitle = currentClient ? 'Editar Cliente' : 'Adicionar Novo Cliente';
    const submitButtonText = currentClient ? 'Salvar Alterações' : 'Salvar Cliente';

    return (
        <div className="p-8 bg-gray-900 min-h-screen">
            <h1 className="text-4xl font-bold text-white mb-6">
                Gerenciamento de Clientes
            </h1>

            {/* BARRA DE AÇÕES (Busca e Adicionar) */}
            <div className="flex justify-between items-center bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700">
                <input 
                    type="text" 
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="w-1/2 p-3 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button 
                    onClick={handleCreate} 
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition duration-150 flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Adicionar Cliente
                </button>
            </div>

            {/* Status de Carregamento e Erro */}
            {isLoading && (
                <p className="text-indigo-400 mt-4 text-center">Carregando clientes...</p>
            )}

            {error && (
                <div className="bg-red-900 p-4 rounded-lg mt-4 text-white">
                    <p className="font-bold">Erro de API:</p>
                    <p>{error}</p>
                </div>
            )}


            {/* LISTA DE CLIENTES */}
            {!isLoading && !error && (
                <ClientesLista 
                    clientes={clientesFiltrados} 
                    onEdit={handleEdit} 
                    onDelete={handleListDelete}
                /> 
            )}
            
            
            {/* MODAL DE CRIAÇÃO/EDIÇÃO (UNIFICADO) */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-lg border border-gray-700">
                        <h2 className="text-2xl font-bold text-white mb-4">{modalTitle}</h2>
                        
                        {/* ID do Cliente (Visível apenas na Edição) */}
                        {currentClient && (
                            <p className="text-sm text-gray-500 mb-4">ID do Cliente: **{currentClient.id}**</p>
                        )}
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            
                            {/* Nome do Cliente (API: name) */}
                            <input 
                                placeholder="Nome do Cliente (Obrigatório)" 
                                value={form.name} 
                                onChange={e => setForm({...form, name: e.target.value})} 
                                className="w-full p-3 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400"
                                required
                            />
                            
                            {/* Pessoa de Contato (API: contact_person) */}
                            <input 
                                placeholder="Pessoa de Contato" 
                                value={form.contact_person} 
                                onChange={e => setForm({...form, contact_person: e.target.value})} 
                                className="w-full p-3 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400"
                            />

                            {/* Email (API: email) */}
                            <input 
                                type="email"
                                placeholder="Email" 
                                value={form.email} 
                                onChange={e => setForm({...form, email: e.target.value})} 
                                className="w-full p-3 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400"
                                required
                            />
                            
                            {/* Telefone (API: phone) */}
                            <input 
                                placeholder="Telefone/Celular" 
                                value={form.phone} 
                                onChange={e => setForm({...form, phone: e.target.value})} 
                                className="w-full p-3 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400"
                            />


                            {/* BOTÕES DE AÇÃO */}
                            <div className="flex justify-between items-center pt-2">
                                
                                {/* BOTÃO DE EXCLUIR (Apenas visível na Edição) */}
                                <div>
                                    {currentClient && (
                                        <button 
                                            type="button" 
                                            onClick={handleDeleteConfirmed}
                                            disabled={isSubmitting}
                                            className={`px-4 py-2 bg-red-600 text-white rounded transition 
                                            ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'}`}
                                        >
                                            {isSubmitting ? 'Excluindo...' : 'Excluir Cliente'}
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