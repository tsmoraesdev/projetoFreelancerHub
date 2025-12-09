// src/App.jsx (VERSÃO CORRIGIDA)

import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { setToken } from './api'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Projetos from './pages/Projetos'
import Kanban from './pages/Kanban'
import Clientes from './pages/Clientes'
import Cronometro from './pages/Cronometro'
import Faturamentos from './pages/Faturamentos'
import Inicio from './pages/Inicio'
import Perfil from './pages/Perfil'

const AUTH_STORAGE_KEY = 'freelancerhub_auth'

// Função wrapper para permitir usar useNavigate no App
function AppWrapper() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  )
}

export default AppWrapper;

function loadInitialUser() {
  try {
    const sessionData = localStorage.getItem(AUTH_STORAGE_KEY)
    if (sessionData) {
      const { user, token } = JSON.parse(sessionData)
      setToken(token)
      return user
    }
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }
  return null
}

function App() {

  const navigate = useNavigate(); // Agora funciona sem erro 🔥
  const [user, setUser] = useState(loadInitialUser)

  const handleLogin = (user, token) => {
    setUser(user)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, token }))
    navigate("/")                      // redireciona após login 🔥
  }

  const handleLogout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem(AUTH_STORAGE_KEY)
    navigate("/login")
  }

  const ProtectedRoute = ({ children }) => {
    return user ? children : <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Routes>

        <Route path="/login" element={<Login onLogin={handleLogin} />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to={user ? "inicio" : "/login"} replace />} />
          <Route path="inicio" element={<Inicio />} />
          <Route path="projetos" element={<Projetos />} />
          <Route path="kanban" element={<Kanban user={user} />} />
          <Route path="kanban/:projectId" element={<Kanban user={user} />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="cronometro" element={<Cronometro user={user} />} />
          <Route path="faturamentos" element={<Faturamentos />} />
          <Route path="perfil" element={<Perfil />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </div>
  )
}
