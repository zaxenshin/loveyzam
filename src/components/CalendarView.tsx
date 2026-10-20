import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Clock,
  X,
  CheckSquare,
  Square,
  Pencil,
} from 'lucide-react';
import { playClick, playPlink, playChime, playPop } from '../utils/sfx';
import { syncWithCloud, saveToCloud } from '../utils/firebase';

type ScheduleColor =
  | 'pink' | 'rose' | 'blue' | 'cyan' | 'teal' | 'green' | 'lime'
  | 'yellow' | 'amber' | 'orange' | 'purple' | 'violet' | 'red'
  | 'cream' | 'gray' | 'dark';

export interface ScheduleItem {
  id: string;
  title: string;
  date: string;
  time: string;
  category: 'class' | 'quiz' | 'exam' | 'date' | 'gaming' | 'personal' | 'task';
  createdBy: 'Yza' | 'Zam';
  color: ScheduleColor;
  isDone: boolean;
}

const colorStyles: Record<ScheduleColor, { bg: string; text: string; border: string }> = {
  pink:   { bg: '#F9A8D4', text: '#5C233B', border: '#BE185D' },
  rose:   { bg: '#FECDD3', text: '#881337', border: '#E11D48' },
  blue:   { bg: '#BFDBFE', text: '#1E3A8A', border: '#2563EB' },
  cyan:   { bg: '#A5F3FC', text: '#083344', border: '#0891B2' },
  teal:   { bg: '#99F6E4', text: '#115E59', border: '#0D9488' },
  green:  { bg: '#BBF7D0', text: '#14532D', border: '#16A34A' },
  lime:   { bg: '#D9F99D', text: '#3F6212', border: '#65A30D' },
  yellow: { bg: '#FEF08A', text: '#713F12', border: '#CA8A04' },
  amber:  { bg: '#FDE68A', text: '#78350F', border: '#D97706' },
  orange: { bg: '#FDBA74', text: '#7C2D12', border: '#EA580C' },
  purple: { bg: '#D8B4FE', text: '#581C87', border: '#9333EA' },
  violet: { bg: '#C4B5FD', text: '#4C1D95', border: '#7C3AED' },
  red:    { bg: '#FCA5A5', text: '#7F1D1D', border: '#DC2626' },
  cream:  { bg: '#FFF7ED', text: '#7C2D12', border: '#D6A16C' },
  gray:   { bg: '#E5E7EB', text: '#111827', border: '#4B5563' },
  dark:   { bg: '#374151', text: '#F9FAFB', border: '#111827' },
};

const defaultItems: ScheduleItem[] = [
  {
    id: '1',
    title: 'DENT MAT LAB: SURVIVE',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    category: 'class',
    createdBy: 'Yza',
    color: 'purple',
    isDone: false,
  },
  {
    id: '2',
    title: 'Pastry & Coffee Date 🥐☕',
    date: new Date().toISOString().split('T')[0],
    time: '15:00',
    category: 'date',
    createdBy: 'Zam',
    color: 'pink',
    isDone: false,
  },
];

export const CalendarView: React.FC = () => {
  const storageKey = 'yzam_schedule_calendar_v5';
  const containerRef = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setCompact(entry.contentRect.width < 640);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [items, setItems] = useState<ScheduleItem[]>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try { return JSON.parse(saved); } catch { return defaultItems; }
    }
    return defaultItems;
  });

  // REALTIME CLOUD SYNC WITH FIREBASE
  useEffect(() => {
    const unsubscribe = syncWithCloud('schedules', items, (cloudItems) => {
      setItems(cloudItems);
      localStorage.setItem(storageKey, JSON.stringify(cloudItems));
    });
    return () => unsubscribe();
  }, []);

  const updateItems = (newItems: ScheduleItem[]) => {
    setItems(newItems);
    localStorage.setItem(storageKey, JSON.stringify(newItems));
    saveToCloud('schedules', newItems);
  };

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState(selectedDateStr);
  const [formTime, setFormTime] = useState('08:00');
  const [formCategory, setFormCategory] = useState<ScheduleItem['category']>('class');
  const [formCreator, setFormCreator] = useState<'Yza' | 'Zam'>('Yza');
  const [formColor, setFormColor] = useState<ScheduleColor>('pink');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const selectedItems = items
    .filter((item) => item.date === selectedDateStr)
    .sort((a, b) => a.time.localeCompare(b.time));

  const resetForm = () => {
    setFormTitle('');
    setFormDate(selectedDateStr);
    setFormTime('08:00');
    setFormCategory('class');
    setFormCreator('Yza');
    setFormColor('pink');
    setEditingId(null);
  };

  const openAddForm = () => {
    resetForm();
    setFormDate(selectedDateStr);
    setShowForm(true);
    playClick();
  };

  const openEditForm = (item: ScheduleItem) => {
    setEditingId(item.id);
    setFormTitle(item.title);
    setFormDate(item.date);
    setFormTime(item.time);
    setFormCategory(item.category);
    setFormCreator(item.createdBy);
    setFormColor(item.color);
    setShowForm(true);
    playPlink();
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
    playClick();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (editingId) {
      const updated = items.map((item) =>
        item.id === editingId
          ? {
              ...item,
              title: formTitle.trim(),
              date: formDate,
              time: formTime,
              category: formCategory,
              createdBy: formCreator,
              color: formColor,
            }
          : item
      );
      updateItems(updated);
      setSelectedDateStr(formDate);
      playChime();
    } else {
      const newItem: ScheduleItem = {
        id: Date.now().toString(),
        title: formTitle.trim(),
        date: formDate,
        time: formTime,
        category: formCategory,
        createdBy: formCreator,
        color: formColor,
        isDone: false,
      };
      const updated = [...items, newItem];
      updateItems(updated);
      setSelectedDateStr(formDate);
      playPop();
    }

    setShowForm(false);
    resetForm();
  };

  const toggleDone = (id: string) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, isDone: !item.isDone } : item
    );
    updateItems(updated);
    playClick();
  };

  const deleteItem = (id: string) => {
    const updated = items.filter((item) => item.id !== id);
    updateItems(updated);
    if (editingId === id) {
      setShowForm(false);
      resetForm();
    }
    playPlink();
  };

  const getEmoji = (category: ScheduleItem['category']) => {
    switch (category) {
      case 'class': return '📘';
      case 'quiz': return '❗';
      case 'exam': return '📌';
      case 'date': return '💕';
      case 'gaming': return '🎮';
      case 'personal': return '🔒';
      case 'task': return '✅';
      default: return '•';
    }
  };

  const maxEventsInCell = compact ? 2 : 4;

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-3 font-sans text-sm h-full min-h-0 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar-track]:bg-[#FFF8F1] [&::-webkit-scrollbar-thumb]:bg-[#F4C2D7] [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-[#272426] [&::-webkit-scrollbar-thumb]:rounded-full"
    >
      <div
        className={`flex items-center justify-between bg-[#812D45] text-white rounded-2xl border-2 border-[#272426] shadow-retro-sm shrink-0 ${
          compact ? 'px-3 py-2.5' : 'px-5 py-4'
        }`}
      >
        <button
          type="button"
          onClick={() => {
            setCurrentDate(new Date(year, month - 1, 1));
            playClick();
          }}
          className={`hover:bg-white/20 rounded-xl transition-colors cursor-pointer ${
            compact ? 'p-1.5' : 'p-2'
          }`}
        >
          <ChevronLeft className={compact ? 'w-5 h-5' : 'w-8 h-8'} />
        </button>

        <h2
          className={`font-mono font-black uppercase tracking-wider text-center drop-shadow-sm ${
            compact ? 'text-lg tracking-[0.08em]' : 'text-3xl sm:text-5xl tracking-[0.15em]'
          }`}
        >
          {currentDate.toLocaleString('default', { month: 'long' })} {year}
        </h2>

        <button
          type="button"
          onClick={() => {
            setCurrentDate(new Date(year, month + 1, 1));
            playClick();
          }}
          className={`hover:bg-white/20 rounded-xl transition-colors cursor-pointer ${
            compact ? 'p-1.5' : 'p-2'
          }`}
        >
          <ChevronRight className={compact ? 'w-5 h-5' : 'w-8 h-8'} />
        </button>
      </div>

      <div
        className="border-2 border-[#272426] rounded-2xl shadow-retro-sm bg-white shrink-0 overflow-hidden flex flex-col"
      >
        <div
          className={`shrink-0 grid grid-cols-7 bg-[#FFF8F1] border-b-2 border-[#272426] text-center font-mono font-black ${
            compact ? 'text-[10px] py-1.5' : 'text-base sm:text-xl py-3'
          }`}
        >
          {(compact
            ? ['S', 'M', 'T', 'W', 'T', 'F', 'S']
            : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
          ).map((day, i) => (
            <div key={i} className="text-[#812D45]">
              {day}
            </div>
          ))}
        </div>

        <div
          className={`flex-1 overflow-y-auto min-h-0 bg-gray-200 [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar-track]:bg-[#FFF8F1] [&::-webkit-scrollbar-thumb]:bg-[#F4C2D7] [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-[#272426] [&::-webkit-scrollbar-thumb]:rounded-full ${
            compact ? 'max-h-[220px]' : 'max-h-[340px]'
          }`}
        >
          <div className="grid grid-cols-7 gap-px">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className={`bg-white ${compact ? 'min-h-[52px]' : 'min-h-[90px] sm:min-h-[110px]'}`}
              />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayItems = items
                .filter((item) => item.date === dateStr)
                .sort((a, b) => a.time.localeCompare(b.time));
              const isSelected = selectedDateStr === dateStr;
              const isToday = new Date().toISOString().split('T')[0] === dateStr;

              return (
                <div
                  key={day}
                  onClick={() => {
                    setSelectedDateStr(dateStr);
                    if (!editingId) setShowForm(false);
                    playClick();
                  }}
                  className={`bg-white cursor-pointer border-2 transition-all hover:bg-[#FFF5F8] flex flex-col overflow-hidden ${
                    compact ? 'min-h-[52px] p-1' : 'min-h-[90px] sm:min-h-[110px] p-2'
                  } ${
                    isSelected
                      ? 'border-[#812D45] bg-[#FFF5F8] z-10'
                      : 'border-transparent'
                  }`}
                >
                  <div
                    className={`flex items-center justify-between ${
                      compact ? 'mb-0.5' : 'mb-1.5'
                    }`}
                  >
                    <span
                      className={`font-mono font-black flex items-center justify-center rounded-full ${
                        compact
                          ? 'text-sm w-6 h-6'
                          : 'text-xl sm:text-3xl w-9 h-9 sm:w-11 sm:h-11'
                      } ${
                        isToday
                          ? 'bg-[#812D45] text-white shadow-sm'
                          : isSelected
                          ? 'text-[#812D45]'
                          : 'text-gray-900'
                      }`}
                    >
                      {day}
                    </span>
                    {dayItems.length > 0 && (
                      <span
                        className={`font-mono font-black text-gray-700 bg-gray-200 rounded-md border border-black/20 ${
                          compact ? 'text-[9px] px-1' : 'text-xs px-2 py-0.5'
                        }`}
                      >
                        {dayItems.length}
                      </span>
                    )}
                  </div>

                  <div
                    className={`flex flex-col overflow-hidden ${
                      compact ? 'gap-0.5' : 'gap-1.5'
                    }`}
                  >
                    {dayItems.slice(0, maxEventsInCell).map((item) => {
                      const style = colorStyles[item.color] || colorStyles.pink;
                      return (
                        <div
                          key={item.id}
                          title={item.title}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDone(item.id);
                          }}
                          className={`flex items-center rounded-md border font-extrabold cursor-pointer hover:opacity-80 transition-opacity ${
                            compact
                              ? 'gap-0.5 px-1 py-0.5 text-[8px] leading-tight'
                              : 'gap-1.5 px-2 py-1 border-2 text-xs sm:text-sm rounded-lg'
                          }`}
                          style={{
                            backgroundColor: style.bg,
                            color: style.text,
                            borderColor: style.border,
                          }}
                        >
                          {!compact && (
                            <div className="shrink-0">
                              {item.isDone ? (
                                <CheckSquare className="w-4 h-4" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </div>
                          )}
                          <span
                            className={`truncate ${
                              item.isDone ? 'line-through opacity-60' : ''
                            }`}
                          >
                            {compact ? item.title.slice(0, 12) : item.title}
                          </span>
                        </div>
                      );
                    })}
                    {dayItems.length > maxEventsInCell && (
                      <span
                        className={`font-black text-gray-600 pl-0.5 ${
                          compact ? 'text-[8px]' : 'text-xs'
                        }`}
                      >
                        +{dayItems.length - maxEventsInCell}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-[#FFF8F1] border-2 border-[#272426] rounded-2xl shadow-retro-sm overflow-hidden shrink-0">
        <div
          className={`flex items-center justify-between border-b-2 border-black/10 bg-white/80 ${
            compact ? 'px-3 py-2' : 'px-5 py-3.5'
          }`}
        >
          <h3
            className={`font-extrabold text-[#812D45] font-mono ${
              compact ? 'text-sm' : 'text-xl sm:text-2xl'
            }`}
          >
            {new Date(selectedDateStr + 'T12:00:00').toLocaleDateString('default', {
              weekday: compact ? 'short' : 'long',
              month: compact ? 'short' : 'long',
              day: 'numeric',
            })}
          </h3>

          <button
            type="button"
            onClick={() => (showForm && !editingId ? closeForm() : openAddForm())}
            className={`bg-[#272426] text-white rounded-xl font-mono font-black flex items-center gap-1.5 hover:bg-black transition-colors cursor-pointer ${
              compact ? 'px-2.5 py-1.5 text-[10px]' : 'px-4 py-2 text-sm'
            }`}
          >
            {showForm && !editingId ? (
              <X className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
            ) : (
              <Plus className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
            )}
            {showForm && !editingId ? 'Cancel' : compact ? 'Add' : 'Add Schedule'}
          </button>
        </div>

        <div className={compact ? 'p-2.5' : 'p-4'}>
          <AnimatePresence>
            {showForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSubmit}
                className={`mb-3 bg-white border-2 border-dashed rounded-2xl space-y-2 overflow-hidden ${
                  editingId ? 'border-amber-500' : 'border-[#812D45]'
                } ${compact ? 'p-2.5' : 'p-4 space-y-3'}`}
              >
                {editingId && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                      ✏️ Editing schedule
                    </span>
                    <button
                      type="button"
                      onClick={closeForm}
                      className="text-xs font-bold text-gray-500 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <input
                  type="text"
                  placeholder="e.g. PHARMA LAB: QUIZ #1"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  className={`w-full border-2 border-black/15 rounded-xl outline-none focus:border-[#812D45] font-black ${
                    compact ? 'px-2.5 py-2 text-sm' : 'px-4 py-3 text-base'
                  }`}
                />

                <div
                  className={`grid gap-2 font-bold ${
                    compact ? 'grid-cols-2 text-xs' : 'grid-cols-2 sm:grid-cols-3 text-sm'
                  }`}
                >
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-wide text-gray-500 font-black">
                      Date
                    </span>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      required
                      className="border-2 border-black/15 rounded-xl px-2 py-1.5 bg-white"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-wide text-gray-500 font-black">
                      Time
                    </span>
                    <input
                      type="time"
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                      className="border-2 border-black/15 rounded-xl px-2 py-1.5 bg-white"
                    />
                  </label>

                  <label className={`flex flex-col gap-1 ${compact ? 'col-span-2' : ''}`}>
                    <span className="text-[10px] uppercase tracking-wide text-gray-500 font-black">
                      Category
                    </span>
                    <select
                      value={formCategory}
                      onChange={(e) =>
                        setFormCategory(e.target.value as ScheduleItem['category'])
                      }
                      className="border-2 border-black/15 rounded-xl px-2 py-1.5 bg-white font-bold"
                    >
                      <option value="class">📘 Class</option>
                      <option value="quiz">❗ Quiz</option>
                      <option value="exam">📌 Exam</option>
                      <option value="task">✅ Task</option>
                      <option value="date">💕 Date</option>
                      <option value="gaming">🎮 Gaming</option>
                      <option value="personal">🔒 Personal</option>
                    </select>
                  </label>
                </div>

                <div
                  className={`grid gap-2 font-bold ${
                    compact ? 'grid-cols-2 text-xs' : 'grid-cols-3 text-sm'
                  }`}
                >
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-wide text-gray-500 font-black">
                      By
                    </span>
                    <select
                      value={formCreator}
                      onChange={(e) => setFormCreator(e.target.value as 'Yza' | 'Zam')}
                      className="border-2 border-black/15 rounded-xl px-2 py-1.5 bg-white font-bold"
                    >
                      <option value="Yza">Yza</option>
                      <option value="Zam">Zam</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-wide text-gray-500 font-black">
                      Color
                    </span>
                    <select
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value as ScheduleColor)}
                      className="border-2 border-black/15 rounded-xl px-2 py-1.5 bg-white font-bold"
                    >
                      {Object.keys(colorStyles).map((c) => (
                        <option key={c} value={c}>
                          {c.charAt(0).toUpperCase() + c.slice(1)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button
                    type="submit"
                    className={`bg-[#812D45] text-white font-black rounded-xl border-2 border-[#272426] shadow-retro-sm hover:bg-[#6A2337] cursor-pointer ${
                      compact ? 'col-span-2 py-2' : 'py-1.5'
                    }`}
                  >
                    {editingId ? '💾 Update' : 'Save'}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {selectedItems.length === 0 && !showForm ? (
            <p
              className={`text-gray-500 font-mono italic text-center font-bold ${
                compact ? 'text-xs py-4' : 'text-base py-6'
              }`}
            >
              No schedule for this day. Chill mode 🍵
            </p>
          ) : (
            <div className={compact ? 'space-y-2' : 'space-y-3'}>
              {selectedItems.map((item) => {
                const style = colorStyles[item.color] || colorStyles.pink;
                const isEditing = editingId === item.id;
                return (
                  <motion.div
                    key={item.id}
                    layout
                    className={`flex items-center rounded-2xl border-2 shadow-sm ${
                      compact ? 'gap-2 p-2.5' : 'gap-4 p-4'
                    } ${isEditing ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}
                    style={{
                      backgroundColor: style.bg,
                      color: style.text,
                      borderColor: style.border,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleDone(item.id)}
                      className="shrink-0 hover:scale-110 transition-transform bg-white rounded-md p-1 shadow-sm border border-black/20 cursor-pointer"
                    >
                      {item.isDone ? (
                        <CheckSquare
                          className={
                            compact ? 'w-4 h-4 text-green-600' : 'w-6 h-6 text-green-600'
                          }
                        />
                      ) : (
                        <Square
                          className={
                            compact ? 'w-4 h-4 text-gray-500' : 'w-6 h-6 text-gray-500'
                          }
                        />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-black leading-tight ${
                          compact ? 'text-sm' : 'text-xl sm:text-2xl'
                        } ${item.isDone ? 'line-through opacity-60' : ''}`}
                      >
                        {getEmoji(item.category)} {item.title}
                      </p>
                      <p
                        className={`font-mono flex items-center gap-1.5 opacity-90 font-bold ${
                          compact ? 'text-[10px] mt-0.5' : 'text-sm mt-1.5'
                        }`}
                      >
                        <Clock
                          className={compact ? 'w-3 h-3 shrink-0' : 'w-4 h-4 shrink-0'}
                        />
                        {item.time} • {item.category.toUpperCase()} • by {item.createdBy}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditForm(item)}
                        title="Edit schedule"
                        className="p-1.5 bg-white/80 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/20 cursor-pointer"
                      >
                        <Pencil
                          className={
                            compact ? 'w-3.5 h-3.5 text-amber-700' : 'w-5 h-5 text-amber-700'
                          }
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteItem(item.id)}
                        title="Delete"
                        className="p-1.5 bg-white/80 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/20 cursor-pointer"
                      >
                        <Trash2
                          className={
                            compact ? 'w-3.5 h-3.5 text-red-600' : 'w-5 h-5 text-red-600'
                          }
                        />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};