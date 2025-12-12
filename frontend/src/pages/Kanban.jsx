// src/pages/Kanban.jsx (Detalhe do Projeto com Kanban)
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api'; // api.js já deve ter setado o token via interceptor
import Column from '../components/Column'; 
import TaskCard from '../components/TaskCard'; 
import { DragDropContext } from '@hello-pangea/dnd';


import {PROJECT_STATUSES} from '../data/mocks'; 


const PROJECTS_ENDPOINT = '/api/projects'; 
const TASKS_ENDPOINT = '/api/tasks';


export default function Kanban(){
    const { projectId } = useParams(); 
    const navigate = useNavigate();
    
    
    const pid = parseInt(projectId);

    const [project, setProject] = useState(null); 
    const [tasks, setTasks] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    
   
    const [isEditingProject, setIsEditingProject] = useState(false);
    
    const [editProjectForm, setEditProjectForm] = useState({ title: '', description: '' }); 

   
    const [form, setForm] = useState({ title: '', description: '', due_date: '', status: 'todo' });
    const [editTask, setEditTask] = useState(null);

    // --- Lógica de Inicialização e API ---


    const fetchProject = useCallback(async () => {
        try {
            
            const response = await api.get(`${PROJECTS_ENDPOINT}/${pid}`);
            const foundProject = response.data;

            setProject(foundProject);
            
            setEditProjectForm({ 
                title: foundProject.title, 
                description: foundProject.description 
            });
            return foundProject; 

        } catch (err) {
            console.error('Erro ao buscar projeto:', err);
            
            alert('Projeto não encontrado ou falha ao carregar.');
            navigate('/projetos', { replace: true });
            return null;
        }
    }, [pid, navigate]);

    
    const refreshTasks = useCallback(async () => {
        try{
            
            const response = await api.get(`${TASKS_ENDPOINT}?projectId=${pid}`);
           
            setTasks(response.data);
            
        }catch(err){ 
            console.error('Falha ao atualizar tarefas da API', err); 
            alert('Erro ao carregar tarefas.');
            setTasks([]); 
        }
    }, [pid]);
    
    
    const updateProject = useCallback(async (updateData) => {
        const currentProject = project;
        try {
            const response = await api.put(`${PROJECTS_ENDPOINT}/${pid}`, updateData);
            const updatedProject = { 
            ...response.data, 
            client_name: currentProject.client_name 
        };
            setProject(updatedProject);
            
            setEditProjectForm({ title: updatedProject.title, description: updatedProject.description });
            return true;
        } catch (error) {
            console.error('Erro ao atualizar projeto:', error.response?.data?.error || error);
            alert('Falha ao atualizar projeto. Tente novamente.');
            
            setEditProjectForm({ title: project.title, description: project.description });
            return false;
        }
    }, [pid, project,setEditProjectForm]);


   
    useEffect(() => {
        setLoading(true);

        if (!projectId || isNaN(pid)) {
            navigate('/projetos', { replace: true });
            return;
        }

        async function load() {
            try{
                const foundProject = await fetchProject();
                
                if (foundProject) {
                    await refreshTasks();
                }
            }catch(err){
                console.error('Falha ao carregar dados iniciais', err);
            }finally{
                setLoading(false);
            }
        }
        load();
        
    }, [projectId, pid, navigate, fetchProject, refreshTasks]);
    
    // --- LÓGICA DE AÇÕES DO PROJETO ---

    
    async function handleProjectEditSave() {
        if (!editProjectForm.title) {
            alert('O título do projeto não pode ser vazio.');
            return;
        }
        
        
        const fullUpdateData = {
            ...project,
            ...editProjectForm, 
            status: project.status 
        };
        
        if (await updateProject(fullUpdateData)) {
            setIsEditingProject(false);
            alert(`Projeto "${fullUpdateData.title}" atualizado com sucesso!`);
        }
    }
    
   
    async function handleProjectStatusChange(e) {
        const newStatus = e.target.value;
        const fullUpdateData = {
            ...project, 
            status: newStatus
        };
        
        if (await updateProject(fullUpdateData)) {
             alert(`Status do Projeto ${project.title} alterado para ${newStatus}.`);
        }
    }

   
    async function handleProjectDelete() {
        if (!window.confirm(`Tem certeza que deseja excluir o projeto "${project.title}"? Esta ação é irreversível.`)) {
            return;
        }
        try {
            await api.delete(`${PROJECTS_ENDPOINT}/${pid}`);
            alert(`Projeto ${project.title} excluído com sucesso!`);
            navigate('/projetos', { replace: true });
        } catch (error) {
            console.error('Erro ao excluir projeto:', error.response?.data?.error || error);
            alert('Falha ao excluir projeto. Verifique se há dependências (como faturamentos).');
        }
    }


    // --- LÓGICA DE TAREFAS (COM API) ---

   
    function byStatus(status){
        return tasks.filter(t=>t.status === status);
    }
    
    
    async function onCreate(e){
        e.preventDefault();
        
        if (!form.title) {
            alert('O título da tarefa é obrigatório.');
            return;
        }
        
        const newTaskData = {
            project_id: pid, 
            title: form.title,
            description: form.description,
            due_date: form.due_date || null, 
            status: form.status,
        };
        
        try {
            
            const response = await api.post(`${TASKS_ENDPOINT}`, newTaskData);
            const newTaskFromAPI = response.data; 

            
            setTasks(prevTasks => [newTaskFromAPI, ...prevTasks]);
            
           
            setShowCreate(false);
            
            setForm({ title: '', description: '', due_date: '', status: 'todo' }); 
            
            alert(`Tarefa "${newTaskFromAPI.title}" criada com sucesso!`);

        } catch(error) {
            console.error('Erro ao criar tarefa:', error.response?.data?.error || error);
            alert('Falha ao criar tarefa.');
        }
    }

    
    function onDragEnd(result){
        const { source, destination, draggableId } = result;
        const taskId = parseInt(draggableId);
        
        if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
            return;
        }

        const newStatus = destination.droppableId;
        
       
        setTasks(prevTasks => {
            const updatedTasks = prevTasks.map(t => 
                t.id === taskId ? { ...t, status: newStatus } : t
            );
            return updatedTasks;
        });

       
        api.patch(`${TASKS_ENDPOINT}/${taskId}/status`, { status: newStatus })
            .then(async () => {
                console.log(`Status da Tarefa ${taskId} atualizado para ${newStatus} via API.`);
        
       
                await fetchProject(); 
            })
            .catch(error => {
                console.error(`Falha ao atualizar status da tarefa ${taskId} na API:`, error);
                alert('Erro ao atualizar status da tarefa na API. Recarregando tarefas...');
                refreshTasks(); 
            });
    }
    
    
    async function onEditTaskSubmit(e){
        e.preventDefault();

        try {
            
            const updateData = {
                project_id: editTask.project_id || pid, 
                title: editTask.title,
                description: editTask.description,
                status: editTask.status,
                due_date: editTask.due_date || null, 
            };

           
            const response = await api.put(`${TASKS_ENDPOINT}/${editTask.id}`, updateData);
            const updatedTaskFromAPI = response.data;

           
            setTasks(prevTasks => {
                return prevTasks.map(t => t.id === updatedTaskFromAPI.id ? updatedTaskFromAPI : t);
            });
            
            setShowEdit(false);
            alert(`Tarefa ${updatedTaskFromAPI.title} editada!`);

        } catch (error) {
            console.error('Erro ao editar tarefa:', error.response?.data?.error || error);
            alert('Falha ao editar tarefa.');
        }
    }
    
   
    async function onDeleteTask(taskId){
        if(!confirm('Tem certeza que deseja excluir esta Tarefa?')) return;
        
        try {
            
            await api.delete(`${TASKS_ENDPOINT}/${taskId}`);

            setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
            
            setShowEdit(false); 
            alert('Tarefa excluída com sucesso!');
            
        } catch (error) {
            console.error('Erro ao excluir tarefa:', error.response?.data?.error || error);
            alert('Falha ao excluir tarefa.');
        }
    }

    if (loading) {
        return <div className="p-8 text-white text-center">Carregando Kanban...</div>;
    }
    
    if (!project) return null; 


    return (
        <div className="p-8 bg-gray-900 min-h-screen">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl mb-8 border border-gray-700">
                
                {/* TÍTULO DO PROJETO (EDITÁVEL) */}
                {isEditingProject ? (
                    <input
                        type="text"
                        value={editProjectForm.title} 
                        onChange={(e) => setEditProjectForm(prev => ({ ...prev, title: e.target.value }))}
                        className="text-4xl font-bold text-white mb-2 w-full p-2 bg-gray-700 border border-indigo-500 rounded"
                        placeholder="Título do Projeto"
                        required
                    />
                ) : (
                    <h1 className="text-4xl font-bold text-white mb-2">
                        {project.title} 
                    </h1>
                )}
                
                <p className="text-gray-400 mb-4">
                    Cliente: {project.client_name || 'N/A'} | ID: {project.id}
                </p>
                
                {/* DESCRIÇÃO DO PROJETO (EDITÁVEL) */}
                {isEditingProject ? (
                    <textarea
                        value={editProjectForm.description} 
                        onChange={(e) => setEditProjectForm(prev => ({ ...prev, description: e.target.value }))}
                        rows="3"
                        className="text-gray-300 mb-6 border-b border-gray-700 pb-4 w-full p-2 bg-gray-700 border border-indigo-500 rounded"
                        placeholder="Descrição detalhada do projeto"
                    />
                ) : (
                    <p className="text-gray-300 mb-6 border-b border-gray-700 pb-4">
                        {project.description} 
                    </p>
                )}
                
                <div className="flex justify-between items-center">
                    {/* MUDANÇA DE STATUS DO PROJETO */}
                    <div className="flex items-center gap-3">
                        <label className="text-gray-400 font-semibold">Status do Projeto:</label>
                        <select 
                            value={project.status} 
                            onChange={handleProjectStatusChange} // Usa a função API
                            className="p-2 border border-gray-600 rounded bg-gray-700 text-white"
                        >
                            {PROJECT_STATUSES.map(status => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* BOTÕES DE AÇÃO DO PROJETO */}
                    <div className="flex gap-3">
                        {isEditingProject ? (
                            <>
                                <button 
                                    onClick={handleProjectEditSave} // Usa a função API
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                                >
                                    Salvar Edição
                                </button>
                                <button 
                                    onClick={() => {
                                        setIsEditingProject(false);
                                        // Garante que o form de edição volte ao estado do projeto
                                        setEditProjectForm({ 
                                            title: project.title, 
                                            description: project.description 
                                        });
                                    }}
                                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                                >
                                    Cancelar
                                </button>
                            </>
                        ) : (
                            <button 
                                onClick={() => setIsEditingProject(true)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                            >
                                Editar Projeto
                            </button>
                        )}

                        <button 
                            onClick={handleProjectDelete} // Usa a função API
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                        >
                            Excluir Projeto
                        </button>
                    </div>
                </div>
            </div>


            {/* BARRA DE AÇÕES (Adicionar Tarefa) */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-white">Tarefas do Projeto</h2>
                <button 
                    onClick={() => setShowCreate(true)} 
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition duration-150 flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Adicionar Tarefa
                </button>
            </div>


            {/* KANBAN BOARD */}
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                    
                    {/* Coluna A Fazer */}
                    <Column id="todo" title="A Fazer">
                        {byStatus('todo').map((task, index) => (
                            <TaskCard 
                                key={task.id} 
                                task={task} 
                                index={index} 
                                // CORREÇÃO 8: O TaskCard é responsável por definir o editTask, que já está ok
                                onEdit={()=>{setShowEdit(true); setEditTask(task)}}
                                statusBorderClass="border-todo" 
                            />
                        ))}
                    </Column>

                    {/* Coluna Em Andamento */}
                    <Column id="doing" title="Em Andamento">
                        {byStatus('doing').map((task, index) => (
                            <TaskCard 
                                key={task.id} 
                                task={task} 
                                index={index} 
                                onEdit={()=>{setShowEdit(true); setEditTask(task)}}
                                statusBorderClass="border-doing" 
                            />
                        ))}
                    </Column>

                    {/* Coluna Concluído */}
                    <Column id="done" title="Concluído">
                        {byStatus('done').map((task, index) => (
                            <TaskCard 
                                key={task.id} 
                                task={task} 
                                index={index} 
                                onEdit={()=>{setShowEdit(true); setEditTask(task)}}
                                statusBorderClass="border-done" 
                            />
                        ))}
                    </Column>
                    
                </div>
            </DragDropContext>
            
            {/* MODAL DE CRIAÇÃO DE TAREFA */}
            {showCreate && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-md border border-gray-700">
                        <h2 className="text-2xl font-bold text-white mb-4">Criar Nova Tarefa</h2>
                        <form onSubmit={onCreate} className="space-y-4">
                            
                            {/* SELEÇÃO DE STATUS INICIAL */}
                            <div className="flex items-center gap-3">
                                <label className="text-gray-400 font-semibold">Status Inicial:</label>
                                <select 
                                    value={form.status} 
                                    onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))} 
                                    className="p-3 border border-gray-600 rounded bg-gray-700 text-white"
                                >
                                    <option value="todo">A Fazer</option>
                                    <option value="doing">Em Andamento</option>
                                    <option value="done">Concluído</option>
                                </select>
                            </div>

                            <input 
                                placeholder="Título" 
                                value={form.title} 
                                onChange={e => setForm({...form, title: e.target.value})} 
                                className="w-full p-3 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400"
                                required
                            />
                            
                            <textarea 
                                placeholder="Descrição" 
                                value={form.description} 
                                onChange={e => setForm({...form, description: e.target.value})} 
                                rows="3"
                                className="w-full p-3 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400"
                            />
                            
                            <input 
                                type="date"
                                placeholder="Data de Vencimento" 
                                value={form.due_date} 
                                onChange={e => setForm({...form, due_date: e.target.value})} 
                                className="w-full p-3 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400"
                            />

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border border-gray-600 text-gray-300 rounded hover:bg-gray-700 transition">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">Salvar Tarefa</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* MODAL DE EDIÇÃO DE TAREFA */}
            {showEdit && editTask && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-md border border-gray-700">
                        <h2 className="text-2xl font-bold text-white mb-4">Editar Tarefa</h2>
                        <form onSubmit={onEditTaskSubmit} className="space-y-4">
                            
                            {/* Status da Tarefa no Modal */}
                            <div className="flex items-center gap-3">
                                <label className="text-gray-400 font-semibold">Status:</label>
                                <select 
                                    value={editTask.status} 
                                    onChange={e=>setEditTask(prev=>({...prev, status: e.target.value}))} 
                                    className="p-2 border border-gray-600 rounded bg-gray-700 text-white"
                                >
                                    <option value="todo">A Fazer</option>
                                    <option value="doing">Em Andamento</option>
                                    <option value="done">Concluído</option>
                                </select>
                                <div className="text-sm text-gray-500">ID: {editTask.id}</div>
                            </div>

                            <input 
                                placeholder="Título" 
                                value={editTask.title} 
                                onChange={e => setEditTask({...editTask, title: e.target.value})} 
                                className="w-full p-3 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400"
                                required
                            />
                            
                            <textarea 
                                placeholder="Descrição" 
                                value={editTask.description} 
                                onChange={e => setEditTask({...editTask, description: e.target.value})} 
                                rows="3"
                                className="w-full p-3 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400"
                            />
                            
                            <input 
                                type="date"
                                placeholder="Data de Vencimento" 
                                value={editTask.due_date || ''} 
                                onChange={e => setEditTask({...editTask, due_date: e.target.value})} 
                                className="w-full p-3 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400"
                            />

                            <div className="flex justify-between items-center pt-2">
                                <button 
                                    type="button" 
                                    onClick={() => onDeleteTask(editTask.id)} 
                                    className="px-3 py-1 border border-gray-600 rounded text-red-500 hover:bg-gray-700"
                                >
                                    Excluir Tarefa
                                </button>
                                <div className="flex gap-2">
                                    <button type="button" onClick={()=>setShowEdit(false)} className="px-3 py-1 border border-gray-600 text-gray-300 rounded hover:bg-gray-700">Fechar</button>
                                    <button type="submit" className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700">Salvar</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}