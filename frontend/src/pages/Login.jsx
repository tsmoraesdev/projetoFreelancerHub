import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import api, { setToken } from '../api'; 
import logo from '../assets/Freelancerhub.svg'

export default function Login({ onLogin }){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState('login'); 

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);



  async function handleSubmit(e){
    e.preventDefault();
    setLoading(true);
    setError(null); 
    setMessage(null); 

    // Determina o endpoint e o payload com base no modo
    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = mode === 'login' ? { email, password } : { name, email, password };

    try {
      const response = await api.post(endpoint, payload);
      
      if (mode === 'login') {
        const { token, user } = response.data;
        
        // 1. Configura o token JWT para futuras requisições autenticadas
        setToken(token);
        onLogin(user,token); 

      } else { // mode === 'register'
        setMessage('Cadastro efetuado com sucesso! Faça login para continuar.');
        setMode('login'); // Volta para a tela de Login
        setName(''); // Limpa o campo nome
      }
    } catch (err) {
      // Lida com erros da API (ex: Credenciais inválidas, Usuário já existe)
      const errorMessage = err.response?.data?.error || 'Erro de conexão ou do servidor. Verifique se o backend está rodando.';
      setError(errorMessage);
    } finally {
      setLoading(false); 
    }
  }

    return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full mx-auto mt-20 bg-gray-800 p-8 rounded-lg shadow-xl border border-gray-700"> 
        
        <div className="flex justify-center mb-12">
          <img src={logo} alt="Kanban Logo" className="h-48"/>
        </div>

        {/* TÍTULO: Texto branco */}
        <h2 className="text-3xl font-semibold mb-6 text-center text-white">
            {mode==='login' ? 'Login' : 'Criar Conta'}
        </h2>
        
        {/* FEEDBACK DO USUÁRIO */}
        {error && (
            <div className="bg-red-900 border border-red-700 text-white p-3 rounded-md mb-4 text-center">
                {error}
            </div>
        )}
        {message && (
            <div className="bg-green-800 border border-green-600 text-white p-3 rounded-md mb-4 text-center">
                {message}
            </div>
        )}


        {/* FORMULÁRIO */}
        <form onSubmit={handleSubmit}>
          {mode==='register' && (
            <input 
                className="w-full mb-3 p-3 border border-gray-600 rounded focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white placeholder-gray-400" 
                placeholder="Nome" 
                value={name} 
                onChange={e=>setName(e.target.value)} 
                required
            />
          )}

          <input 
              className="w-full mb-3 p-3 border border-gray-600 rounded focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white placeholder-gray-400" 
              placeholder="Email" 
              value={email} 
              onChange={e=>setEmail(e.target.value)} 
              type="email" 
              required
          />
          <input 
              type="password" 
              className="w-full mb-6 p-3 border border-gray-600 rounded focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white placeholder-gray-400" 
              placeholder="Senha" 
              value={password} 
              onChange={e=>setPassword(e.target.value)} 
              required
          />

          {/* BOTÃO: Mantém a cor de destaque (indigo/azul) */}
          <button 
              className={`bg-indigo-600 text-white px-4 py-3 rounded-lg w-full transition duration-150 
              ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'}`} 
              type="submit"
              disabled={loading}
          >
              {loading 
                  ? 'Aguarde...' 
                  : (mode==='login' ? 'Entrar' : 'Registrar')
              }
          </button>
        </form>
        <div className="mt-6 text-center">
          <button 
            type="button" 
            className="text-indigo-400 hover:text-indigo-300 transition duration-150 text-sm" 
            onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError(null); // Limpa erros ao trocar de modo
                setMessage(null); // Limpa mensagens ao trocar de modo
            }}
          >
            {mode==='login' ? 'Não tem uma conta? Crie uma!' : 'Já tem uma conta? Faça Login!'}
          </button>
        </div>
      </div>
    </div>
    );
}
