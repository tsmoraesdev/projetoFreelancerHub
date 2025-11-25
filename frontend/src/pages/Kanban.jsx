import React, { useEffect, useState } from 'react'
import api, { setToken } from '../api'
import Column from '../components/Column'
import TaskCard from '../components/TaskCard'
import { DragDropContext } from '@hello-pangea/dnd'
import logo from '../assets/Freelancerhub.svg'

export default function Kanban({ user }){
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', dueDate: '' });
  const [editTask, setEditTask] = useState(null);

  useEffect(()=>{
    async function load(){
      try{
        const token = localStorage.getItem('kanban_token');
        if(token) setToken(token);
        const { data } = await api.get('/tasks');
        setTasks(data);
      }catch(err){
        console.error('failed to load tasks', err);
      }finally{
        setLoading(false);
      }
    }
    load();
  },[])

  function byStatus(status){
    return tasks.filter(t=>t.status === status);
  }

  async function refresh(){
    const { data } = await api.get('/tasks');
    setTasks(data);
  }

  async function onCreate(e){
    e.preventDefault();
    try{
      const dueDatePayload = form.dueDate || null; 

      await api.post('/tasks', { title: form.title, description: form.description, dueDate: dueDatePayload });
      
      setForm({ title: '', description: '', dueDate: '' });
      setShowCreate(false);
      await refresh();
    }catch(err){
      console.error('create failed', err);
      alert('Erro ao criar tarefa');
    }
  }

  function openEdit(task){
    const formattedDate = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';
    setEditTask(task);
    setForm({ title: task.title, description: task.description, dueDate: formattedDate });
    setShowEdit(true);
  }

  async function onUpdate(e){
    e.preventDefault();
    try{
      const dueDatePayload = form.dueDate || null;
  
      await api.put(`/tasks/${editTask.id}`, { 
          title: form.title, 
          description: form.description, 
          status: editTask.status, 
          dueDate: dueDatePayload 
      });
      
      setShowEdit(false);
      setEditTask(null);
      await refresh();
    }catch(err){
      console.error('update failed', err);
      alert('Erro ao atualizar tarefa');
    }
  }

  async function onDelete(task){
    if(!confirm('Confirma excluir a tarefa?')) return;
    try{
      await api.delete(`/tasks/${task.id}`);
      await refresh();
    }catch(err){
      console.error('delete failed', err);
      alert('Erro ao excluir');
    }
  }

  async function onDragEnd(result){
    if(!result.destination) return;
    const { draggableId, destination } = result;
    const taskId = draggableId;
    const newStatus = destination.droppableId;

    try{
      
        const taskToUpdate = tasks.find(t => String(t.id) === taskId);
        if (!taskToUpdate) return;
        
        const payload = {
            title: taskToUpdate.title,
            description: taskToUpdate.description,
            status: newStatus, 
            dueDate: taskToUpdate.dueDate || null 
        };

        await api.put(`/tasks/${taskId}`, payload);
        
        await refresh();
    }catch(err){
      console.error('drag update failed', err);
      alert('Erro ao mover a tarefa.');
    }
  }
  
  // vai alterando a borda de acordo com o status - taty
  function getBorderClass(status){
    return `border-${status}`; 
  }

  if(loading) return <div className="p-6 text-white">Carregando...</div> // Texto branco para contraste

  return (
    // Fundo da área de conteúdo (usa um cinza mais escuro, pode ser o mesmo do App.jsx)
    <div className="p-8 bg-gray-900 min-h-screen"> 
      <div className="flex justify-between items-center mb-10 border-b border-gray-700 pb-4">
        
        <div className="w-40 h-0 flex-shrink-0"></div> 

        <div className="flex flex-col gap-1 items-center"> 
            <img src={logo} alt="Kanban Logo" className="h-48" /> 
            {/* Texto cinza claro para contraste */}
            <span className="text-2xl font-bold text-gray-300 mt-2">Olá, como é bom ter você aqui {user?.name || 'Usuário'}!</span>
        </div>
      
        <div className="flex items-center gap-3 self-end flex-shrink-0"> 
          <button onClick={()=>setShowCreate(true)} className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow transition">+ Nova Tarefa</button>
        </div>
      </div>


      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-3 gap-6">
          {/* ... (Colunas) */}
          <Column id="todo" title="A Fazer">
            {byStatus('todo').map((t,i)=> <TaskCard 
              key={t.id} 
              index={i} 
              task={t} 
              onEdit={()=>openEdit(t)} 
              onDelete={()=>onDelete(t)}
              statusBorderClass={getBorderClass('todo')} 
            />)}
          </Column>
          <Column id="doing" title="Em Andamento">
            {byStatus('doing').map((t,i)=> <TaskCard 
              key={t.id} 
              index={i} 
              task={t} 
              onEdit={()=>openEdit(t)} 
              onDelete={()=>onDelete(t)}
              statusBorderClass={getBorderClass('doing')} 
            />)}
          </Column>
          <Column id="done" title="Concluído">
            {byStatus('done').map((t,i)=> <TaskCard 
              key={t.id} 
              index={i} 
              task={t} 
              onEdit={()=>openEdit(t)} 
              onDelete={()=>onDelete(t)}
              statusBorderClass={getBorderClass('done')} 
            />)}
          </Column>
        </div>
      </DragDropContext>

      {/* parte em que cria o modal de tarefas - DARK MODE */}
      {showCreate && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70"> {/* Opacidade mais alta */}
          <form onSubmit={onCreate} className="bg-gray-800 p-6 rounded shadow w-96 border border-gray-700"> {/* Fundo e Borda */}
            <h3 className="text-lg mb-4 text-white">Nova Tarefa</h3>
            <input required value={form.title} onChange={e=>setForm({...form, title: e.target.value})}
                   placeholder="Título" className="w-full mb-3 p-2 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400" />
            <textarea value={form.description} onChange={e=>setForm({...form, description: e.target.value})}
                      placeholder="Descrição" className="w-full mb-3 p-2 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400" />
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-1">Data de Vencimento</label>
                <input type="date" className="w-full p-3 border border-gray-600 rounded bg-gray-700 text-white" value={form.dueDate} onChange={e=>setForm(prev=>({...prev, dueDate:e.target.value}))} />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={()=>setShowCreate(false)} className="px-3 py-1 border border-gray-600 text-gray-300 rounded hover:bg-gray-700">Cancelar</button>
              <button className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700">Criar</button>
            </div>
          </form>
        </div>
      )}

      {showEdit && editTask && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70">
          <form onSubmit={onUpdate} className="bg-gray-800 p-6 rounded shadow w-96 border border-gray-700">
            <h3 className="text-lg mb-4 text-white">Editar Tarefa</h3>
            <input required value={form.title} onChange={e=>setForm({...form, title: e.target.value})}
                   placeholder="Título" className="w-full mb-3 p-2 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400" />
            <textarea value={form.description} onChange={e=>setForm({...form, description: e.target.value})}
                      placeholder="Descrição" className="w-full mb-3 p-2 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400" />
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-1">Data de Vencimento</label>
                <input type="date" className="w-full p-3 border border-gray-600 rounded bg-gray-700 text-white" value={form.dueDate} onChange={e=>setForm(prev=>({...prev, dueDate:e.target.value}))} />
            </div>
            <div className="flex justify-between items-center mb-3">
              <div>
                <label className="mr-2 text-gray-400">Status:</label>
                {/* Select: Fundo mais escuro, texto claro */}
                <select value={editTask.status} onChange={async (e)=> {
                    const s = e.target.value;
                    try{ 
                        const dueDatePayload = form.dueDate || null;
                        
                        const payload = { 
                            title: form.title, 
                            description: form.description, 
                            status: s, 
                            dueDate: dueDatePayload 
                        };

                        await api.put(`/tasks/${editTask.id}`, payload); 
                        
                        setEditTask(prev=>({...prev, status: s})); 
                        await refresh(); 
                    }
                    catch(err){ 
                        console.error(err); 
                        alert('Erro ao mudar status'); 
                    }
                  }} className="p-1 border border-gray-600 rounded bg-gray-700 text-white">
                  <option value="todo">A Fazer</option>
                  <option value="doing">Em Andamento</option>
                  <option value="done">Concluído</option>
                </select>
              </div>
              <div className="text-sm text-gray-500">ID: {editTask.id}</div>
            </div>

            <div className="flex justify-between">
              <div>
                <button type="button" onClick={async ()=>{
                  if(!confirm('Excluir?')) return;
                  try{ await api.delete(`/tasks/${editTask.id}`); setShowEdit(false); await refresh(); }
                  catch(err){ console.error(err); alert('Erro ao excluir'); }
                }} className="px-3 py-1 border border-gray-600 rounded text-red-500 hover:bg-gray-700">Excluir</button>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={()=>setShowEdit(false)} className="px-3 py-1 border border-gray-600 text-gray-300 rounded hover:bg-gray-700">Fechar</button>
                <button className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700">Salvar</button>
              </div>
            </div>
          </form>
        </div>
      )}

    </div>
  )
}