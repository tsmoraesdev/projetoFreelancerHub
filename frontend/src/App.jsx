import React, { useState } from 'react'
import Login from './pages/Login'
import Kanban from './pages/Kanban'

export default function App(){
  const [user, setUser] = useState(null);
  return (
    <div className="min-h-screen">
      {user ? <Kanban user={user} onLogout={()=>setUser(null)} /> : <Login onLogin={setUser} />}
    </div>
  )
}

