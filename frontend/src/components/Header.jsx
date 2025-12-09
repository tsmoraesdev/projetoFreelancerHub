// src/components/Header.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/solid';
import logo from '../assets/Freelancerhub.svg'; // Sua logo

// O Header precisa receber user E a função de logout (onLogout)
export default function Header({ user, onLogout }) {
    const navigate = useNavigate();
    
    const userName = user?.name || 'Freelancer'; // Ajuste 'name' ou 'nome' conforme seu backend

    return (
        // Remove 'shadow-md' para tentar manter a barra mais fina
        <header className="bg-gray-800 p-3 border-b border-gray-700 flex justify-between items-center sticky top-0 z-10">
            {/* Logo MAIOR e no lugar do texto */}
            <div 
                className="flex items-center cursor-pointer" 
                onClick={() => navigate('/')} // Adiciona funcionalidade para voltar à home ao clicar na logo
            >
                <img src={logo} alt="FreelancerHub Logo" className="h-28 w-auto" /> 
            </div>

            {/* Ícones de Ação (Perfil e Sair) */}
            <div className="flex items-center gap-4">

                <div 
                    className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-700 transition"
                    onClick={() => navigate('/perfil')} 
                >
                    <span className="text-white font-semibold text-base hidden sm:inline">{userName}</span>
                    {/* Aumentamos o tamanho do ícone de perfil para 9x9 */}
                    <UserCircleIcon className="h-9 w-9 text-indigo-400" />
                </div>

                {/* 2. Botão Sair */}
                <button
                    onClick={onLogout}
                    title="Sair do Sistema"
                    className="p-2 rounded-lg text-red-400 hover:bg-gray-700 hover:text-red-500 transition"
                >
                    <ArrowRightOnRectangleIcon className="h-6 w-6" />
                </button>
            </div>
        </header>
    );
}