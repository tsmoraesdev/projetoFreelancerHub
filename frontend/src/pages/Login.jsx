import React, { useState } from 'react'
import api, { setToken } from '../api'
import logo from '../assets/Freelancerhub.svg' //TATY ADICIONOU LOGO

export default function Login({ onLogin }){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState('login');

  async function handleSubmit(e){
    e.preventDefault();
    try{
      if(mode==='login'){
        const { data } = await api.post('/auth/login',{ email, password });
        setToken(data.token);
        localStorage.setItem('kanban_token', data.token);
        onLogin(data.user);
      } else {
        const { data } = await api.post('/auth/register',{ name, email, password });
        const res = await api.post('/auth/login',{ email, password });
        setToken(res.data.token);
        localStorage.setItem('kanban_token', res.data.token);
        onLogin(res.data.user);
      }
    }catch(err){ alert(err?.response?.data?.error || 'Erro'); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full mx-auto mt-20 bg-gray-800 p-8 rounded-lg shadow-xl border border-gray-700"> 
        
        <div className="flex justify-center mb-12">
          <img src={logo} alt="Kanban Logo" className="h-48"/>
        </div>

        {/* TÍTULO: Texto branco */}
        <h2 className="text-3xl font-semibold mb-6 text-center text-white">{mode==='login' ? 'Login' : 'Cadastro'}</h2>
        <form onSubmit={handleSubmit}>
          {mode==='register' && (
            // INPUTS: Fundo bg-gray-700, borda border-gray-600, texto branco, placeholder cinza
            <input className="w-full mb-3 p-3 border border-gray-600 rounded focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white placeholder-gray-400" placeholder="Nome" value={name} onChange={e=>setName(e.target.value)} />
          )}
          {/* INPUTS: Fundo bg-gray-700, borda border-gray-600, texto branco, placeholder cinza */}
          <input className="w-full mb-3 p-3 border border-gray-600 rounded focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white placeholder-gray-400" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input type="password" className="w-full mb-6 p-3 border border-gray-600 rounded focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white placeholder-gray-400" placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)} />

          {/* BOTÃO: Mantém a cor de destaque (indigo/azul) */}
          <button className="bg-indigo-600 text-white px-4 py-3 rounded-lg w-full hover:bg-indigo-700 transition duration-150" type="submit">{mode==='login'?'Entrar':'Registrar'}</button>
        </form>
        <div className="mt-6 text-center">
          {/* TEXTO DE ALTERNÂNCIA: Cor clara de destaque */}
          <button type="button" className="text-sm text-indigo-400 hover:text-indigo-300" onClick={()=>setMode(mode==='login'?'register':'login')}>{mode==='login'?'Criar conta':'Já tenho conta'}</button>
        </div>
      </div>
    </div>
  )
}
