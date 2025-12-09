// src/components/TaskCard.jsx
import React from 'react'
import { Draggable } from '@hello-pangea/dnd'

export default function TaskCard({ task, index, onEdit, onDelete, statusBorderClass }){
  
  function formatSimpleDate(dateString) {
    if (!dateString) return "";
    
    const date = new Date(dateString); 
    
    // Formato de exibição: DD/MM/AAAA
    return date.toLocaleDateString('pt-BR');
  }
  
  const formattedDueDate = formatSimpleDate(task.due_date);

  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided)=> (
        // Fundo do Card: bg-gray-700, Borda: border-gray-600, Texto principal: text-white
        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
             className={`p-3 mb-3 bg-gray-700 border border-gray-600 rounded cursor-pointer transition hover:bg-gray-600 text-white ${statusBorderClass}`}> 
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold">{task.title}</h4>
              {/* Descrição: Um tom de cinza mais claro */}
              <p className="text-sm text-gray-300">{task.description}</p>
              
              {formattedDueDate && (
                // Data: Um tom de cinza para sutilidade
                <p className="text-xs mt-1 text-gray-400">
                  Vence em: {formattedDueDate}
                </p>
              )}
              
            </div>
            <div className="flex flex-col gap-1 ml-3">
              {/* Botões: Fundo transparente, Borda cinza claro, Texto cinza claro */}
              <button onClick={onEdit} className="text-xs px-2 py-1 border border-gray-500 rounded text-gray-300 hover:bg-gray-600 transition">Editar</button>
              {/* Botão de Excluir: Mantém o vermelho para destaque */}
              <button onClick={onDelete} className="text-xs px-2 py-1 border border-gray-500 rounded text-red-500 hover:bg-gray-600 transition">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  )
}