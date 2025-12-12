// src/components/Column.jsx
import React from 'react'
import { Droppable } from '@hello-pangea/dnd'

export default function Column({ id, title, children }){
  const statusClass = `status-${id}`
  return (
    <div className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700 h-full flex flex-col">
      <h3 className="font-bold mb-4 text-xl border-b border-gray-600 pb-2 text-white">{title}</h3>
      <div className={`${statusClass} mb-4`}></div>
      <Droppable droppableId={id}>
        {(provided)=> (
          <div 
              ref={provided.innerRef} 
              {...provided.droppableProps} 
              className="flex-grow min-h-[250px] overflow-y-auto">
            {children}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
