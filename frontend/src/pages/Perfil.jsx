// src/pages/Perfil.jsx
import React, { useState, useEffect } from 'react';
import { 
    UserIcon, 
    BanknotesIcon, 
    BuildingOffice2Icon,
    DevicePhoneMobileIcon 
} from '@heroicons/react/24/solid';

// Chave do LocalStorage para persistir os dados do perfil
const PROFILE_DATA_KEY = 'FREELANCERHUB_PROFILE_DATA';

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
    const [status, setStatus] = useState(null); // 'success', 'error', null

    // Efeito para carregar dados do LocalStorage ao montar o componente
    useEffect(() => {
        const storedData = localStorage.getItem(PROFILE_DATA_KEY);
        if (storedData) {
            // Garante que o estado inicial seja preenchido com os dados salvos
            setProfile(prev => ({ ...prev, ...JSON.parse(storedData) }));
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        try {
            localStorage.setItem(PROFILE_DATA_KEY, JSON.stringify(profile));
            setStatus('success');
            setTimeout(() => setStatus(null), 3000);
        } catch (error) {
            console.error("Erro ao salvar dados do perfil:", error);
            setStatus('error');
            setTimeout(() => setStatus(null), 5000);
        }
    };

    return (
        <div className="p-8 min-h-screen bg-gray-900 text-white">
            <h1 className="text-4xl font-bold mb-6 flex items-center gap-3">
                <UserIcon className="h-8 w-8 text-indigo-400" /> Meu Perfil e Dados de Faturamento
            </h1>
            <p className="text-gray-400 mb-8">
                Preencha seus dados para que sejam incluídos nos PDFs de faturamento (como Emissor da fatura) e para referência pessoal.
            </p>

            <form onSubmit={handleSave} className="space-y-8 max-w-4xl mx-auto">
                
                {/* ------------------------- 1. DADOS DA EMPRESA / PESSOAL ------------------------- */}
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

                {/* ------------------------- 2. DADOS DE CONTATO ------------------------- */}
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
                        />
                    </div>
                </Card>

                {/* ------------------------- 3. DADOS BANCÁRIOS ------------------------- */}
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

                {/* ------------------------- BOTÃO DE SALVAR E FEEDBACK ------------------------- */}
                <div className="flex justify-end pt-4">
                    {status === 'success' && (
                        <p className="text-green-500 font-semibold mr-4 self-center">
                            Dados salvos com sucesso!
                        </p>
                    )}
                    {status === 'error' && (
                        <p className="text-red-500 font-semibold mr-4 self-center">
                            Erro ao salvar! Verifique o console.
                        </p>
                    )}
                    <button 
                        type="submit" 
                        className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-lg font-bold hover:bg-indigo-700 transition"
                    >
                        Salvar Perfil
                    </button>
                </div>

            </form>
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

function Input({ label, name, value, onChange, type = 'text', required = false }) {
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
                className="w-full p-3 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500"
            />
        </div>
    );
}