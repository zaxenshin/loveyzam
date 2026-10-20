import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, CheckSquare, Square } from 'lucide-react';

export interface TodoItem {
  id: string;
  text: string;
  isDone: boolean;
  scope: 'Yza' | 'Zam' | 'shared';
  addedBy: 'Yza' | 'Zam';
  createdAt: number;
}

interface ChecklistViewProps {
  scope: 'Yza' | 'Zam' | 'shared';
  compact?: boolean;
  title?: string;
}

const STORAGE_KEY = 'yzam_tasks_final_v3';

// Helper: basahin lahat ng tasks from localStorage
function loadAllTasks(): TodoItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultTasks();
    return JSON.parse(raw);
  } catch {
    return getDefaultTasks();
  }
}

function getDefaultTasks(): TodoItem[] {
  return [
    { id: '1', text: 'Pick a movie for Friday 🎬', isDone: false, scope: 'shared', addedBy: 'Zam', createdAt: Date.now() },
    { id: '2', text: 'Review Oral Anatomy notes 🦷', isDone: false, scope: 'Yza', addedBy: 'Yza', createdAt: Date.now() },
    { id: '3', text: 'Finish Data Structures Lab 💻', isDone: false, scope: 'Zam', addedBy: 'Zam', createdAt: Date.now() },
  ];
}

// Helper: i-save + sabihan lahat ng checklist na mag-refresh
function saveAllTasks(tasks: TodoItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  // Custom event para sa same-tab components
  window.dispatchEvent(new CustomEvent('yzam-tasks-changed'));
}

export const ChecklistView: React.FC<ChecklistViewProps> = ({
  scope,
  compact = false,
  title = 'Checklist',
}) => {
  const [todos, setTodos] = useState<TodoItem[]>(() => loadAllTasks());
  const [newTodo, setNewTodo] = useState('');
  const [adder, setAdder] = useState<'Yza' | 'Zam'>('Zam');

  // 🔄 FORCE REFRESH when anything changes (same tab or other tab)
  const refresh = useCallback(() => {
    setTodos(loadAllTasks());
  }, []);

  useEffect(() => {
    // Listen to our custom event (same browser tab)
    window.addEventListener('yzam-tasks-changed', refresh);
    // Listen to storage event (other browser tabs / windows)
    window.addEventListener('storage', refresh);

    return () => {
      window.removeEventListener('yzam-tasks-changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  // Filter only the tasks that belong to this scope
  const filteredTodos = todos.filter((t) => t.scope === scope);
  const pendingCount = filteredTodos.filter((t) => !t.isDone).length;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    const newItem: TodoItem = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      text: newTodo.trim(),
      isDone: false,
      scope: scope,
      addedBy: scope === 'shared' ? adder : (scope as 'Yza' | 'Zam'),
      createdAt: Date.now(),
    };

    const updated = [newItem, ...loadAllTasks()];
    saveAllTasks(updated);
    setNewTodo('');
  };

  const toggleTodo = (id: string) => {
    const all = loadAllTasks();
    const updated = all.map((t) =>
      t.id === id ? { ...t, isDone: !t.isDone } : t
    );
    saveAllTasks(updated);
  };

  const deleteTodo = (id: string) => {
    const all = loadAllTasks();
    const updated = all.filter((t) => t.id !== id);
    saveAllTasks(updated);
  };

  return (
    <div className={`flex flex-col h-full ${compact ? 'text-xs' : 'text-sm'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 border-b-2 border-black/10 pb-2">
        <h3 className={`font-bold font-mono text-[#812D45] ${compact ? 'text-xs' : 'text-sm'}`}>
          {title}
        </h3>
        <span className="text-[10px] font-mono bg-[#F4C2D7]/50 px-2.5 py-0.5 rounded-full font-bold text-[#812D45]">
          {pendingCount} left
        </span>
      </div>

      {/* Add Form */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder={
            scope === 'shared'
              ? 'Add a shared task...'
              : 'Add your personal task...'
          }
          className="flex-1 px-3 py-2 border-2 border-black/15 rounded-lg focus:border-[#812D45] outline-none bg-white text-sm"
        />

        {scope === 'shared' && (
          <select
            value={adder}
            onChange={(e) => setAdder(e.target.value as 'Yza' | 'Zam')}
            className="px-2 border-2 border-black/15 rounded-lg bg-white font-bold text-[#812D45] outline-none text-xs"
          >
            <option value="Zam">Zam</option>
            <option value="Yza">Yza</option>
          </select>
        )}

        <button
          type="submit"
          className="bg-[#812D45] text-white px-3 py-2 rounded-lg border-2 border-[#272426] shadow-retro-sm hover:bg-[#6A2337] transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        <AnimatePresence mode="popLayout">
          {filteredTodos.length === 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-gray-400 font-mono py-10 italic"
            >
              No tasks yet. You're all caught up! ✨
            </motion.p>
          )}

          {filteredTodos.map((todo) => (
            <motion.div
              key={todo.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all ${
                todo.isDone
                  ? 'bg-gray-50 border-gray-200 opacity-55'
                  : 'bg-white border-[#272426] shadow-sm'
              }`}
            >
              <button
                onClick={() => toggleTodo(todo.id)}
                className="mt-0.5 shrink-0 hover:scale-110 transition-transform"
              >
                {todo.isDone ? (
                  <CheckSquare className="w-5 h-5 text-green-600" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400 hover:text-[#812D45]" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p
                  className={`font-medium leading-snug ${
                    todo.isDone ? 'line-through text-gray-500' : 'text-gray-800'
                  }`}
                >
                  {todo.text}
                </p>
                {scope === 'shared' && (
                  <p className="text-[10px] font-mono text-gray-400 mt-1">
                    Added by {todo.addedBy}
                  </p>
                )}
              </div>

              <button
                onClick={() => deleteTodo(todo.id)}
                className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};