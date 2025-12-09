import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api'; 
import {
    ClockIcon,
    CurrencyDollarIcon,
    PlayIcon,
    PauseIcon,
    StopIcon,
    BookmarkIcon,
    XMarkIcon
} from "@heroicons/react/24/solid";

import { formatTime } from '../utils';

// LocalStorage keys
const HOURLY_RATE_KEY = 'freelancerhub_hourly_rate';

// Endpoints da API
const TASKS_ENDPOINT = '/api/tasks';
const TIME_ENTRIES_ENDPOINT = '/api/time-entries';

export default function Cronometro(){

    // ================== STATES ==================
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    
    // Estados para a API
    const [startTime, setStartTime] = useState(null); 
    const [notes, setNotes] = useState('');
    const [isLoadingTasks, setIsLoadingTasks] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Estado do Valor/Hora (rate)
    const [rate, setRate] = useState(parseFloat(localStorage.getItem(HOURLY_RATE_KEY) || '0.00'));

    // Agrupa tarefas por projeto para o dropdown
    const projectsMap = useMemo(() => {
        const map = {};
        tasks.forEach(task => {
            if (!map[task.project_id]) {
                const projectTitle = task.project_title || `Projeto ID: ${task.project_id}`; 
                map[task.project_id] = { 
                    id: task.project_id, 
                    title: projectTitle, 
                    tasks: [] 
                };
            }
            map[task.project_id].tasks.push(task);
        });
        return Object.values(map);
    }, [tasks]);

    // ================== CÁLCULOS ==================

    const hourlyRate = useMemo(() => {
        const hourlyRate = isNaN(rate) ? 0 : rate;
        return hourlyRate;
    }, [rate]);

    const estimatedCost = useMemo(() => {
        return (time / 3600) * hourlyRate;
    }, [time, hourlyRate]);

    // ================== HANDLERS ==================

    const handleRateChange = (e) => {
        const newValue = e.target.value;
        const newRate = parseFloat(newValue) || 0.00; 
        
        setRate(newRate);
        localStorage.setItem(HOURLY_RATE_KEY, newRate.toFixed(2));
    };


    const fetchTasks = useCallback(async () => {
        setIsLoadingTasks(true);
        try {
            const response = await api.get(TASKS_ENDPOINT);
            setTasks(response.data);
        } catch (error) {
            console.error('Erro ao buscar tarefas:', error);
        } finally {
            setIsLoadingTasks(false);
        }
    }, []);

    const handleSaveTime = async () => {
        if (!selectedTask || time === 0 || !startTime) return; 

        setIsSaving(true);
        const now = new Date(); 
        
        if (isRunning) {
            setIsRunning(false);
        }

        try {
            const data = {
                task_id: selectedTask.id,
                start_time: startTime, 
                end_time: now.toISOString(),
                duration_seconds: time,
                notes: notes,
            };

            await api.post(TIME_ENTRIES_ENDPOINT, data);

            alert('Tempo registrado com sucesso!');
            setTime(0);
            setStartTime(null);
            setSelectedTask(null);
            setNotes('');
            
        } catch (error) {
            console.error('Erro ao salvar registro de tempo:', error);
            alert('Erro ao salvar o registro de tempo.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleStart = () => {
        if (selectedTask && !isRunning) {
            setIsRunning(true);
            if (!startTime) {
                 setStartTime(new Date().toISOString()); 
            }
        }
    };

    const handlePause = () => {
        setIsRunning(false);
    };

    const handleReset = () => {
        setIsRunning(false);
        setTime(0);
        setStartTime(null); 
        setNotes('');
    };

    // ================== EFEITOS ==================

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    useEffect(() => {
        let interval = null;
        if (isRunning) {
            interval = setInterval(() => {
                setTime(prevTime => prevTime + 1);
            }, 1000);
        } else if (!isRunning && time !== 0) {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isRunning, time]);


    // ================== RENDERIZAÇÃO ==================
    const submitButtonText = isSaving ? 'SALVANDO...' : 'SALVAR TEMPO';

    return (
        <div className="p-6 bg-gray-900 min-h-screen text-white">
            <h1 className="text-3xl font-bold mb-6">Cronômetro de Tempo</h1>

            {/* 1. Seleção de Tarefa e Valor/Hora (Bloco Único Alinhado) */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl mb-6">
                <h2 className="text-xl font-semibold mb-6 border-b border-gray-700 pb-3">Detalhes do Registro</h2>
                
                {/* Contêiner Flex para alinhamento horizontal */}
                <div className="flex flex-col md:flex-row gap-6">
                    
                    {/* Seleção de Tarefa (Ocupa 2/3) */}
                    <div className="md:w-2/3 w-full">
                        <label htmlFor="taskSelect" className="block text-sm font-medium text-gray-400 mb-2">
                            1. Selecione a Tarefa:
                        </label>
                        {isLoadingTasks ? (
                            <p className="text-gray-400 p-3 bg-gray-700 rounded">Carregando tarefas...</p>
                        ) : (
                            <select
                                id="taskSelect"
                                value={selectedTask ? selectedTask.id : ''}
                                onChange={(e) => {
                                    const taskId = parseInt(e.target.value);
                                    const task = tasks.find(t => t.id === taskId);
                                    setSelectedTask(task);
                                }}
                                className="w-full p-3 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400"
                                disabled={isRunning || isSaving}
                            >
                                <option value="">Selecione um Projeto e Tarefa</option>
                                {projectsMap.map(project => (
                                    <optgroup key={project.id} label={project.title}>
                                        {project.tasks.map(task => (
                                            <option key={task.id} value={task.id}>
                                                {task.title}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        )}
                        
                        {selectedTask && (
                            <p className="mt-2 text-sm text-gray-400">
                                Projeto: <span className="font-semibold">{projectsMap.find(p => p.id === selectedTask.project_id)?.title || 'N/A'}</span>
                            </p>
                        )}
                    </div>

                    {/* Campo de Valor/Hora (Ocupa 1/3) */}
                    <div className="md:w-1/3 w-full">
                        <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-400 mb-2">
                            2. Valor/Hora para Cálculo (R$):
                        </label>
                        <input
                            type="number"
                            id="hourlyRate"
                            step="0.01"
                            value={rate.toFixed(2)} 
                            onChange={handleRateChange}
                            className="w-full p-3 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400"
                            disabled={isRunning || isSaving}
                        />
                    </div>

                </div>
            </div>
            {/* FIM DO BLOCO ÚNICO */}


            {/* 2. Exibição e Controles do Cronômetro */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl mb-6 text-center">
                <div className="text-7xl font-mono mb-4 text-indigo-400">
                    {formatTime(time)}
                </div>

                <div className="flex justify-center items-center gap-4 text-sm text-gray-400 mb-6">
                    <div className="flex items-center gap-1">
                        <ClockIcon className="w-5 h-5"/>
                        <p>Início: {startTime ? new Date(startTime).toLocaleTimeString() : '--:--:--'}</p>
                    </div>
                    <div className="flex items-center gap-1">
                        <CurrencyDollarIcon className="w-5 h-5"/>
                        <p>Custo Estimado: R$ {estimatedCost.toFixed(2)}</p> 
                    </div>
                </div>

                {/* Controles do Cronômetro */}
                <div className="flex justify-center gap-4">
                    {!isRunning && time === 0 && (
                        <button 
                            className={`bg-green-600 px-8 py-3 rounded font-bold ${!selectedTask ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'}`} 
                            onClick={handleStart}
                            disabled={!selectedTask}
                        >
                            <PlayIcon className="w-6 inline"/>&nbsp;INICIAR
                        </button>
                    )}

                    {isRunning && (
                        <button className="bg-yellow-600 px-8 py-3 rounded font-bold hover:bg-yellow-700" onClick={handlePause}>
                            <PauseIcon className="w-6 inline"/>&nbsp;PAUSAR
                        </button>
                    )}

                    {!isRunning && time > 0 && (
                        <button className="bg-green-600 px-8 py-3 rounded font-bold hover:bg-green-700" onClick={handleStart}>
                            CONTINUAR
                        </button>
                    )}

                    <button className={`px-8 py-3 rounded font-bold ${time > 0 ? "bg-red-600 hover:bg-red-700" : "bg-gray-600 cursor-not-allowed"}`}
                        disabled={time === 0} onClick={handleReset}>
                        <StopIcon className="w-6 inline"/>&nbsp;RESETAR
                    </button>
                </div>

                {/* Campo de Notas */}
                 <div className="mt-6">
                    <label htmlFor="notes" className="block text-left text-sm font-medium text-gray-400 mb-2">Notas do Tempo:</label>
                    <textarea
                        id="notes"
                        rows="3"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Adicione notas sobre o trabalho realizado..."
                        className="w-full p-3 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400"
                        disabled={isSaving}
                    />
                </div>

                {/* Botão de Salvar */}
                <button className={`mt-6 px-10 py-3 rounded-xl text-lg font-bold flex items-center gap-2 mx-auto\
                    ${time > 0 && selectedTask && !isSaving ? "bg-indigo-600 hover:bg-indigo-700" : "bg-gray-600 cursor-not-allowed"}`}
                    disabled={time === 0 || !selectedTask || isSaving} 
                    onClick={handleSaveTime}>
                    <BookmarkIcon className="w-6" />
                    {submitButtonText}
                </button>
            </div>
        </div>
    );
}