// src/pages/Dashboard.jsx
import React, { useState } from 'react'; 
import { Routes, Route, Navigate, useLocation, NavLink } from 'react-router-dom';
import Header from '../components/Header'; // <-- Importado

import Projetos from './Projetos'; 
import Kanban from './Kanban'; 
import Clientes from './Clientes'; 
import Inicio from './Inicio';
import Cronometro from './Cronometro';
import Faturamentos from './Faturamentos';
import Perfil from './Perfil'; 

// Ícones
import { 
    HomeIcon,
    FolderOpenIcon,
    ClipboardDocumentListIcon,
    ClockIcon,
    CurrencyDollarIcon,
    ChevronLeftIcon,
    // ArrowRightOnRectangleIcon não é mais necessário aqui
} from '@heroicons/react/24/solid';


// --- Componente Auxiliar para Link de Navegação (mantido) ---
function NavButton({ to, icon: Icon, label, isSidebarOpen }) {
    return (
        <NavLink 
            to={to} 
            className={({ isActive }) => 
                `flex items-center p-3 rounded-lg transition-colors duration-200 
                ${isSidebarOpen ? 'justify-start' : 'justify-center'}
                ${isActive 
                    ? 'bg-indigo-700 text-white shadow-lg' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                `
            }
            title={!isSidebarOpen ? label : ''} 
        >
            <Icon className="h-6 w-6 flex-shrink-0" />
            <span 
                className={`ml-3 whitespace-nowrap overflow-hidden transition-opacity duration-200 
                    ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 h-0'}`}
            >
                {label}
            </span>
        </NavLink>
    );
}

// --- Componente Principal Dashboard ---
export default function Dashboard({ user, onLogout }) { // <-- onLogout é passado aqui
    const location = useLocation();
    
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const navLinks = [
        { to: "/inicio", icon: HomeIcon, label: "Início" },
        { to: "/projetos", icon: FolderOpenIcon, label: "Projetos" },
        { to: "/clientes", icon: ClipboardDocumentListIcon, label: "Clientes" },
        { to: "/cronometro", icon: ClockIcon, label: "Cronômetro" },
        { to: "/faturamentos", icon: CurrencyDollarIcon, label: "Faturamentos" },
    ];

    return (
        <div className="flex min-h-screen bg-gray-900">
            
            {/* 1. BARRA DE NAVEGAÇÃO (Sidebar) */}
            <nav 
                className={`flex flex-col p-4 bg-gray-800 shadow-xl transition-all duration-300 
                    ${isSidebarOpen ? 'w-64' : 'w-20'}
                `}
            >
                {/* BOTÃO DE RETRAÇÃO (no topo) */}
                <div 
                    className={`flex items-center justify-between p-2 mb-6 ${isSidebarOpen ? 'justify-end' : 'justify-center'}`}
                >
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition 
                            ${isSidebarOpen ? 'transform rotate-180' : ''} 
                        `}
                        title={isSidebarOpen ? "Retrair" : "Expandir"}
                    >
                        <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                </div>
                

                {/* LINKS DE NAVEGAÇÃO: flex-grow agora ocupa TODO o espaço restante */}
                <div className="flex-grow space-y-2"> 
                    {navLinks.map((link) => (
                        <NavButton 
                            key={link.to} 
                            to={link.to} 
                            icon={link.icon} 
                            label={link.label} 
                            isSidebarOpen={isSidebarOpen} 
                        />
                    ))}
                </div>

                {/* O BOTÃO SAIR FOI REMOVIDO DAQUI */}
            </nav>

            {/* 2. CONTEÚDO PRINCIPAL (Header + Rotas) */}
            <main className="flex-1 flex flex-col overflow-y-auto">
                
                {/* onLogout é passado para o Header */}
                <Header user={user} onLogout={onLogout} /> 
                
                <div className="p-8 flex-1"> 
                    <Routes>
                        <Route path="/" element={<Navigate to="inicio" replace />} />
                        <Route path="inicio" element={<Inicio />} />
                        <Route path="projetos" element={<Projetos />} />
                        <Route path="kanban" element={<Kanban user={user} />} />
                        <Route path="kanban/:projectId" element={<Kanban user={user} />} />
                        <Route path="clientes" element={<Clientes />} />
                        <Route path="cronometro" element={<Cronometro user={user} />} />
                        <Route path="faturamentos" element={<Faturamentos />} />
                        <Route path="perfil" element={<Perfil />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
}