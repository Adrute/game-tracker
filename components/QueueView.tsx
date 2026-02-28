"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Loader2, ListOrdered, EyeOff, Eye } from "lucide-react";

// --- COMPONENTE HIJO: CADA FILA ARRASTRABLE ---
function SortableGameItem({ game, onToggleHide }: { game: any, onToggleHide: (id: number, current: boolean) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: game.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`flex items-center gap-4 p-3 rounded-xl border transition-colors ${
        game.is_hidden_in_queue ? 'opacity-50 grayscale bg-slate-50 dark:bg-slate-800/50' : ''
      } ${
        isDragging 
          ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 shadow-lg scale-[1.02] grayscale-0 opacity-100' 
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-700'
      }`}
    >
      <button {...attributes} {...listeners} className="cursor-grab text-slate-400 hover:text-emerald-500 focus:outline-none p-2 touch-none">
        <GripVertical size={20} />
      </button>
      
      <img src={game.image_url} className="w-10 h-14 object-cover rounded bg-slate-200 dark:bg-slate-800" alt={game.title} />
      
      <div className="flex-1 min-w-0">
        <h4 className={`font-bold truncate ${game.is_hidden_in_queue ? 'text-slate-500 line-through' : 'text-slate-800 dark:text-slate-100'}`}>
            {game.title}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">{game.platform}</p>
      </div>

      {/* BOTÓN PARA OCULTAR/MOSTRAR */}
      <button 
        onClick={() => onToggleHide(game.id, game.is_hidden_in_queue)}
        className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
        title={game.is_hidden_in_queue ? "Mostrar en la cola" : "Ocultar de la cola"}
      >
        {game.is_hidden_in_queue ? <Eye size={18} /> : <EyeOff size={18} />}
      </button>
    </div>
  );
}

// --- COMPONENTE PADRE: LA LISTA COMPLETA ---
export default function QueueView({ games, onUpdate }: { games: any[], onUpdate: () => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showHidden, setShowHidden] = useState(false); // Estado para ver los ocultos

  // Filtramos los pendientes y aplicamos el filtro de visibilidad
  useEffect(() => {
    const pendingGames = games
      .filter(g => g.status === 'Pendiente')
      .filter(g => showHidden ? true : !g.is_hidden_in_queue) // Filtro mágico
      .sort((a, b) => (a.play_order || 0) - (b.play_order || 0));
    setItems(pendingGames);
  }, [games, showHidden]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), // Previene arrastres accidentales al hacer clic en el ojo
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Función para cambiar el estado de oculto
  const handleToggleHide = async (id: number, currentStatus: boolean) => {
    setIsSaving(true);
    await supabase.from("games").update({ is_hidden_in_queue: !currentStatus }).eq("id", id);
    setIsSaving(false);
    onUpdate(); // Refrescamos desde la base de datos
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      
      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      setIsSaving(true);
      const updates = newItems.map((game, index) => {
        return supabase.from("games").update({ play_order: index }).eq("id", game.id);
      });

      await Promise.all(updates);
      setIsSaving(false);
      onUpdate(); 
    }
  };

  if (items.length === 0 && !showHidden) {
    return (
      <div className="text-center py-20 text-slate-500 dark:text-slate-400">
        <ListOrdered size={48} className="mx-auto mb-4 opacity-20" />
        <p>No tienes juegos pendientes visibles en la cola.</p>
        <button 
            onClick={() => setShowHidden(true)}
            className="mt-4 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center justify-center gap-2 mx-auto"
        >
            <Eye size={16}/> Mostrar juegos ocultos
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <ListOrdered size={24} className="text-emerald-500"/> Mi Cola de Juego
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Arrastra los juegos para decidir cuál jugarás a continuación.</p>
        </div>
        
        <div className="flex items-center gap-4">
            {/* INTERRUPTOR PARA VER OCULTOS */}
            <button 
                onClick={() => setShowHidden(!showHidden)}
                className={`flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-full transition-colors ${showHidden ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
                {showHidden ? <EyeOff size={16}/> : <Eye size={16}/>}
                {showHidden ? "Ocultar ignorados" : "Ver ignorados"}
            </button>

            {isSaving && (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-bold animate-pulse">
                <Loader2 size={16} className="animate-spin" /> Guardando...
            </div>
            )}
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {items.map((game, index) => (
              <div key={game.id} className="flex items-center gap-3">
                <span className="font-bold text-slate-300 dark:text-slate-700 w-6 text-right select-none">{index + 1}</span>
                <div className="flex-1">
                  <SortableGameItem game={game} onToggleHide={handleToggleHide} />
                </div>
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}