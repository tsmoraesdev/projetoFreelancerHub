// src/pages/Perfil.jsx
import React, { useState, useEffect } from 'react';
import { 
    UserIcon, 
    BanknotesIcon, 
    BuildingOffice2Icon,
    DevicePhoneMobileIcon,
    KeyIcon // Novo ícone para credenciais
} from '@heroicons/react/24/solid';

import api from '../api';

// Chave do LocalStorage para persistir os dados do perfil
//const PROFILE_DATA_KEY = 'FREELANCERHUB_PROFILE_DATA';

const initialProfileState = {
    // 1. Dados Pessoais/Empresa
    nomeRazao: '', // Nome completo ou Razão Social
    cpfCnpj: '',   // CPF ou CNPJ
    endereco: '',
    cep: '',
    cidade: '',
    estado: '',
    
    // 2. Dados de Contato
    telefone: '',
    email: '',

    // 3. Dados Bancários
    nomeBanco: '',
    agencia: '',
    conta: '',
    tipoConta: 'Corrente', // Padrão
};

export default function Perfil() {
    const [profile, setProfile] = useState(initialProfileState);
    const [status, setStatus] = useState(null); // 'success_save', 'error', null para Dados de Faturamento
    const [loading, setLoading] = useState(true); // Estado de carregamento

    // Novos estados para alteração de credenciais
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState(''); // Para verificação
    const [credentialStatus, setCredentialStatus] = useState(null); // 'success', 'error', null para Credenciais

    // Efeito para CARREGAR dados do Backend ao montar o componente
    useEffect(() => {
        async function fetchProfile() {
            try {
                // GET /api/profile
                const response = await api.get('/api/profile');
                // Se houver dados no banco, usa eles. Se não houver, mantém o estado inicial.
                if (response.data) {
                    setProfile(prev => ({ ...prev, ...response.data }));
                }
            } catch (error) {
                console.error("Erro ao carregar dados do perfil:", error);
            } finally {
                setLoading(false); // Finaliza o carregamento inicial
            }
        }
        fetchProfile();
    }, []);

    // Função de tratamento de mudança para os campos do Perfil/Faturamento
    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prevProfile => ({
            ...prevProfile,
            [name]: value
        }));
    };

    // Função para SALVAR/ATUALIZAR dados de Faturamento no Backend
    const handleSave = async (e) => {
        e.preventDefault();
        setStatus(null);
        setLoading(true);

        try {
            // POST /api/profile (UPSERT)
            await api.post('/api/profile', profile); 
            setStatus('success_save');
            setTimeout(() => setStatus(null), 3000);
        } catch (error) {
            console.error("Erro ao salvar dados do perfil:", error);
            setStatus('error');
            setTimeout(() => setStatus(null), 5000);
        } finally {
             setLoading(false);
        }
    };
    
    // Função para SALVAR/ATUALIZAR CREDENCIAIS
    const handleCredentialUpdate = async (e) => {
        e.preventDefault();
        setCredentialStatus(null);
        
        if (!currentPassword) {
            setCredentialStatus('error');
            alert("A senha atual é obrigatória para atualizar as credenciais.");
            return;
        }

        const payload = {
            currentPassword,
            newEmail: newEmail || undefined,
            newPassword: newPassword || undefined,
        };
        
        // Verifica se há algo para atualizar além da senha atual
        if (!payload.newEmail && !payload.newPassword) {
            setCredentialStatus('error');
            alert("Preencha o novo e-mail ou a nova senha.");
            return;
        }
        
        let emailChanged = !!newEmail; // Flag para verificar se o email foi alterado
        setLoading(true);

        try {
            await api.post('/api/auth/update-credentials', payload);
            
            setCredentialStatus('success');

            // Limpa os campos após o sucesso
            setNewEmail('');
            setNewPassword('');
            setCurrentPassword('');

            if (emailChanged) {
                // Se o email foi alterado, o usuário deve ser forçado a logar novamente.
                alert("E-mail alterado com sucesso! Você será desconectado para realizar um novo login com o novo e-mail.");
                // Força o refresh, invalidando o login atual e forçando a rota de login
                window.location.reload(); 
            } else {
                 setTimeout(() => setCredentialStatus(null), 3000);
            }

        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Erro ao atualizar credenciais.';
            setCredentialStatus('error');
            alert(errorMessage);
            console.error("Erro ao atualizar credenciais:", err);
        } finally {
            setLoading(false);
        }
    };

    // Exibição de carregamento inicial
    if (loading && status !== 'error' && credentialStatus !== 'error') {
        return (
            <div className="p-8 min-h-screen bg-gray-900 text-white flex justify-center items-center">
                <p className="text-xl text-indigo-400">Carregando perfil...</p>
            </div>
        );
    }


    return (
        <div className="p-8 min-h-screen bg-gray-900 text-white">
            <h1 className="text-4xl font-bold mb-6 flex items-center gap-3">
                <UserIcon className="h-8 w-8 text-indigo-400" /> Meu Perfil e Dados de Faturamento
            </h1>
            <p className="text-gray-400 mb-8">
                Preencha seus dados para que sejam incluídos nos PDFs de faturamento (como Emissor da fatura) e para referência pessoal.
            </p>

            {/* O formulário agora é dividido em duas partes (faturamento e credenciais), 
                mas mantemos a tag form para os dados de faturamento. */}
            <form onSubmit={handleSave} className="space-y-8 max-w-4xl mx-auto">
                
                {/* -------------------------  DADOS DA EMPRESA / PESSOAL ------------------------- */}
                <Card title="Dados do Emissor" icon={BuildingOffice2Icon}>
                    <div className="grid md:grid-cols-2 gap-4">
                        <Input 
                            label="Nome Completo / Razão Social" 
                            name="nomeRazao" 
                            value={profile.nomeRazao} 
                            onChange={handleChange} 
                            required 
                        />
                        <Input 
                            label="CPF ou CNPJ" 
                            name="cpfCnpj" 
                            value={profile.cpfCnpj} 
                            onChange={handleChange} 
                        />
                    </div>
                    
                    <div className="grid md:grid-cols-4 gap-4">
                        <Input 
                            label="CEP" 
                            name="cep" 
                            value={profile.cep} 
                            onChange={handleChange} 
                        />
                        <Input 
                            label="Cidade" 
                            name="cidade" 
                            value={profile.cidade} 
                            onChange={handleChange} 
                        />
                        <Input 
                            label="Estado (Ex: SP)" 
                            name="estado" 
                            value={profile.estado} 
                            onChange={handleChange} 
                        />
                        <div className="md:col-span-4">
                             <Input 
                                label="Endereço Completo (Rua, Número, Bairro)" 
                                name="endereco" 
                                value={profile.endereco} 
                                onChange={handleChange} 
                                className="md:col-span-4"
                            />
                        </div>
                    </div>
                </Card>

                {/* ---------  DADOS DE CONTATO (Perfil/Faturamento) ------------------------- */}
                <Card title="Dados de Contato" icon={DevicePhoneMobileIcon}>
                    <div className="grid md:grid-cols-2 gap-4">
                        <Input 
                            label="Telefone (WhatsApp)" 
                            name="telefone" 
                            value={profile.telefone} 
                            onChange={handleChange} 
                        />
                        <Input 
                            label="E-mail" 
                            name="email" 
                            type="email"
                            value={profile.email} 
                            onChange={handleChange} 
                            required
                            placeholder="Este e-mail será usado nas faturas"
                        />
                    </div>
                </Card>

                {/* ------------------ DADOS BANCÁRIOS ------------------------- */}
                <Card title="Dados Bancários para Pagamento" icon={BanknotesIcon}>
                    <p className="text-sm text-gray-400 mb-4">
                        Esses dados serão exibidos na fatura para que seus clientes saibam para onde transferir.
                    </p>
                    <div className="grid md:grid-cols-4 gap-4">
                         <div className="md:col-span-2">
                            <Input 
                                label="Nome do Banco" 
                                name="nomeBanco" 
                                value={profile.nomeBanco} 
                                onChange={handleChange} 
                            />
                         </div>
                         <Input 
                            label="Agência" 
                            name="agencia" 
                            value={profile.agencia} 
                            onChange={handleChange} 
                         />
                         <Input 
                            label="Conta (com dígito)" 
                            name="conta" 
                            value={profile.conta} 
                            onChange={handleChange} 
                         />
                         <div className="md:col-span-4">
                             <Label>Tipo de Conta</Label>
                             <select
                                name="tipoConta"
                                value={profile.tipoConta}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-600 rounded bg-gray-700 text-white focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="Corrente">Conta Corrente</option>
                                <option value="Poupança">Conta Poupança</option>
                                <option value="Pagamento">Conta de Pagamento</option>
                            </select>
                         </div>
                    </div>
                </Card>

                {/* ------------------------- BOTÃO DE SALVAR DADOS DE FATURAMENTO ------------------------- */}
                <div className="flex justify-end pt-4">
                    {status === 'success_save' && (
                        <p className="text-green-500 font-semibold mr-4 self-center">
                            Dados salvos com sucesso no servidor!
                        </p>
                    )}
                    {status === 'error' && (
                        <p className="text-red-500 font-semibold mr-4 self-center">
                            Erro ao salvar! Verifique o console.
                        </p>
                    )}
                    <button 
                        type="submit" 
                        disabled={loading} // Desabilita enquanto carrega/salva
                        className={`px-8 py-3 bg-indigo-600 text-white rounded-xl text-lg font-bold transition 
                            ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'}`}
                    >
                        {loading && status !== 'success_save' ? 'Salvando...' : 'Salvar Perfil'}
                    </button>
                </div>

            </form>

            {/* -------------------- ALTERAÇÃO DE CREDENCIAIS ------------------------- */}
            <div className="max-w-4xl mx-auto mt-8">
                <Card title="Alterar E-mail de Login e Senha" icon={KeyIcon}>
                    <p className="text-sm text-gray-400 mb-4">
                        **ATENÇÃO:** Se você alterar o e-mail, será desconectado e precisará fazer login novamente com o novo e-mail.
                    </p>
                    <form onSubmit={handleCredentialUpdate} className="space-y-4">
                        <Input 
                            label="Novo E-mail de Login" 
                            name="newEmail" 
                            type="email"
                            value={newEmail} 
                            onChange={e => setNewEmail(e.target.value)} 
                            placeholder="Deixe vazio para manter o atual"
                        />
                        <Input 
                            label="Nova Senha" 
                            name="newPassword" 
                            type="password"
                            value={newPassword} 
                            onChange={e => setNewPassword(e.target.value)} 
                            placeholder="Deixe vazio para manter a atual"
                        />
                        <Input 
                            label="Senha Atual (Obrigatório para confirmar)" 
                            name="currentPassword" 
                            type="password"
                            value={currentPassword} 
                            onChange={e => setCurrentPassword(e.target.value)} 
                            required
                        />
                        
                        <div className="pt-2 flex justify-end items-center">
                            {credentialStatus === 'success' && (
                                <p className="text-green-500 font-semibold mr-4 self-center">
                                    {newEmail ? 'E-mail alterado! Recarregando...' : 'Senha alterada com sucesso!'}
                                </p>
                            )}
                            {credentialStatus === 'error' && (
                                <p className="text-red-500 font-semibold mr-4 self-center">
                                    Erro ao atualizar credenciais!
                                </p>
                            )}
                            <button 
                                type="submit" 
                                disabled={loading}
                                className={`px-6 py-2 bg-yellow-600 text-white rounded-xl font-bold transition 
                                ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-yellow-700'}`}
                            >
                                {loading && credentialStatus !== 'success' ? 'Aguarde...' : 'Atualizar Credenciais'}
                            </button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}

// --- Componentes Auxiliares (Reutilizáveis) ---

function Card({ title, icon: Icon, children }) {
    return (
        <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 space-y-4">
            <h2 className="text-2xl font-semibold text-indigo-400 mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
                <Icon className="h-6 w-6" /> {title}
            </h2>
            {children}
        </div>
    );
}

function Label({ children, htmlFor }) {
    return (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-300 mb-1">
            {children}
        </label>
    );
}

function Input({ label, name, value, onChange, type = 'text', required = false, placeholder = '' }) {
    return (
        <div>
            <Label htmlFor={name}>{label} {required && <span className="text-red-500">*</span>}</Label>
            <input
                type={type}
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                placeholder={placeholder}
                className="w-full p-3 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500"
            />
        </div>
    );
}