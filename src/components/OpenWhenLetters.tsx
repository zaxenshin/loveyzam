import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Mail, Lock, Unlock, X, Heart } from 'lucide-react';

export interface Letter {
  id: string;
  title: string;          
  content: string;        
  createdBy: 'Yza' | 'Zam';
  unlockDate?: string;    
  isOpened: boolean;
  createdAt: number;
}

export const OpenWhenLetters: React.FC<{ isEditMode: boolean }> = ({ isEditMode }) => {
  const storageKey = 'yzam_open_when_letters_v1';

  const [letters, setLetters] = useState<Letter[]>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    return [
      {
        id: '1',
        title: 'Open when you miss me 🥺',
        content: 'Hey lovey...\n\nI just want you to know that even when we\'re apart, you\'re always in my thoughts. I love you so much.\n\n— Zam ☕',
        createdBy: 'Zam',
        isOpened: false,
        createdAt: Date.now()
      },
      {
        id: '2',
        title: 'Open after a long day 🦷',
        content: 'You did amazing today. I\'m so proud of you.\n\nRest well, my love. You deserve all the soft things.\n\n— Zam',
        createdBy: 'Zam',
        isOpened: false,
        createdAt: Date.now()
      }
    ];
  });

  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newUnlockDate, setNewUnlockDate] = useState('');
  const [createdBy, setCreatedBy] = useState<'Yza' | 'Zam'>('Zam');

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(letters));
  }, [letters]);

  const handleAddLetter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const letter: Letter = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      content: newContent.trim(),
      createdBy,
      unlockDate: newUnlockDate || undefined,
      isOpened: false,
      createdAt: Date.now()
    };

    setLetters(prev => [letter, ...prev]);
    setNewTitle('');
    setNewContent('');
    setNewUnlockDate('');
    setShowAddForm(false);
  };

  const openLetter = (letter: Letter) => {
    if (letter.unlockDate) {
      const today = new Date().toISOString().split('T')[0];
      if (today < letter.unlockDate) {
        alert(`This letter is locked until ${letter.unlockDate} 💌`);
        return;
      }
    }

    setLetters(prev =>
      prev.map(l => (l.id === letter.id ? { ...l, isOpened: true } : l))
    );
    setSelectedLetter(letter);
  };

  const deleteLetter = (id: string) => {
    if (confirm('Delete this letter forever?')) {
      setLetters(prev => prev.filter(l => l.id !== id));
      if (selectedLetter?.id === id) setSelectedLetter(null);
    }
  };

  return (
    <div className="h-full flex flex-col relative bg-[#FFF8F1] -m-4 p-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold font-mono text-[#812D45] flex items-center gap-2 bg-white px-4 py-2 rounded-xl border-2 border-[#272426] shadow-retro">
          <Mail className="w-5 h-5 text-[#F4C2D7] fill-current" /> Open When...
        </h3>

        {isEditMode && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#812D45] text-white text-xs font-bold rounded-lg border-2 border-[#272426] shadow-retro-sm hover:bg-[#6B2339] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {showAddForm ? 'Cancel' : 'Write Letter'}
          </motion.button>
        )}
      </div>

      {/* Add Letter Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddLetter}
            className="mb-6 p-4 bg-white border-2 border-[#812D45] rounded-xl space-y-4 shadow-retro-sm overflow-hidden"
          >
            <input
              type="text"
              placeholder='Title (e.g. "Open when you miss me")'
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="w-full px-3 py-2 border-2 border-black/15 rounded-lg text-sm outline-none focus:border-[#812D45] font-mono font-bold text-[#5C233B] transition-colors"
              required
            />
            <textarea
              placeholder="Write your letter here..."
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 border-2 border-black/15 rounded-lg text-sm outline-none focus:border-[#812D45] resize-none font-sans transition-colors"
              required
            />
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-[#812D45] mb-1 block">Unlock Date (optional)</label>
                <input
                  type="date"
                  value={newUnlockDate}
                  onChange={e => setNewUnlockDate(e.target.value)}
                  className="w-full px-2 py-2 border-2 border-black/15 rounded-lg text-sm outline-none focus:border-[#812D45] transition-colors"
                />
              </div>
              <div className="w-1/3">
                <label className="text-[10px] font-bold text-[#812D45] mb-1 block">From</label>
                <select
                  value={createdBy}
                  onChange={e => setCreatedBy(e.target.value as 'Yza' | 'Zam')}
                  className="w-full px-2 py-2 border-2 border-black/15 rounded-lg text-sm font-bold outline-none focus:border-[#812D45] transition-colors"
                >
                  <option value="Zam">Zam</option>
                  <option value="Yza">Yza</option>
                </select>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full py-2.5 bg-[#812D45] text-white font-bold text-sm rounded-lg border-2 border-[#272426] shadow-retro-sm hover:bg-[#6B2339] transition-colors flex justify-center items-center gap-2"
            >
              Seal Envelope 💌
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Letters Grid */}
      <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto pr-1 pb-4">
        {letters.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="col-span-2 flex flex-col items-center justify-center py-12 text-gray-400 opacity-60"
          >
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
              <Mail className="w-12 h-12 mb-2" />
            </motion.div>
            <p className="font-mono text-sm">No letters written yet.</p>
          </motion.div>
        )}

        <AnimatePresence>
          {letters.map(letter => {
            const isLocked = letter.unlockDate && new Date().toISOString().split('T')[0] < letter.unlockDate;

            return (
              <motion.div
                key={letter.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                whileHover={{ y: -6, scale: 1.02, rotate: isLocked ? 0 : (parseInt(letter.id) % 2 === 0 ? 1 : -1) }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                onClick={() => !isEditMode && openLetter(letter)}
                className={`
                  group relative cursor-pointer bg-white rounded-xl p-4 border-2 min-h-[110px] flex flex-col justify-between overflow-hidden shadow-retro
                  ${letter.isOpened ? 'border-[#F4C2D7] bg-[#FFF5F8]' : isLocked ? 'border-gray-400 bg-gray-50' : 'border-[#812D45]'}
                `}
              >
                {/* Flap/Top Decoration */}
                <div className={`absolute top-0 left-0 w-full h-2 opacity-80 ${isLocked ? 'bg-gray-400' : 'bg-[#F4C2D7]'}`}></div>

                {/* Stamp Icon */}
                <div className="absolute top-3 right-3 opacity-40 group-hover:opacity-100 transition-opacity">
                  {isLocked ? (
                    <Lock className="w-5 h-5 text-gray-500" />
                  ) : letter.isOpened ? (
                    <Unlock className="w-5 h-5 text-green-400" />
                  ) : (
                    <Heart className="w-5 h-5 text-red-400 fill-current" />
                  )}
                </div>

                <div className="relative z-10 mt-1 pr-6">
                  <p className="font-mono text-[10px] text-gray-400 mb-1 flex items-center gap-1">
                    {isLocked ? 'Locked 🔒' : letter.isOpened ? 'Opened 💌' : 'Unread 📮'}
                  </p>
                  <h4 className={`font-bold text-sm leading-tight line-clamp-2 ${isLocked ? 'text-gray-500' : 'text-[#5C233B]'}`}>
                    {letter.title}
                  </h4>
                </div>

                <div className="flex justify-between items-center mt-3 pt-2 border-t border-dashed border-gray-200 relative z-10">
                  <span className="text-[10px] font-black text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full flex flex-col">
                    <span>From {letter.createdBy}</span>
                    {letter.unlockDate && <span className="text-[8px] opacity-70">Unlock: {letter.unlockDate}</span>}
                  </span>
                  
                  {isEditMode && (
                    <motion.button
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteLetter(letter.id);
                      }}
                      className="p-1.5 bg-white border border-gray-200 shadow-sm rounded-lg text-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </motion.button>
                  )}
                </div>

                {/* Locked Overlay Pattern */}
                {isLocked && (
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-10 pointer-events-none"></div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Letter Reading Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedLetter && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedLetter(null)}
            >
              <motion.div
                initial={{ scale: 0.8, y: 40, rotate: -2 }}
                animate={{ scale: 1, y: 0, rotate: 0 }}
                exit={{ scale: 0.8, y: 40, opacity: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-lg bg-[#fffdf9] rounded-sm shadow-[10px_10px_0px_rgba(0,0,0,0.8)] border-2 border-[#272426] flex flex-col max-h-[80vh] overflow-hidden"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-pink-100/80 border border-pink-200 rotate-2 z-20 shadow-sm"></div>

                <div className="bg-[#812D45] text-white px-5 py-3 border-b-2 border-[#272426] flex justify-between items-center z-10">
                  <h3 className="font-bold flex items-center gap-2">
                    <Heart className="w-4 h-4 text-[#F4C2D7] fill-current" />
                    {selectedLetter.title}
                  </h3>
                  <motion.button 
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedLetter(null)}
                    className="w-6 h-6 bg-red-400 text-white rounded-full flex items-center justify-center hover:bg-red-500 border border-black transition-colors"
                  >
                    <X className="w-4 h-4 font-bold" />
                  </motion.button>
                </div>

                <div 
                  className="p-6 overflow-y-auto flex-1 relative"
                  style={{
                    backgroundImage: 'linear-gradient(#f4c2d7 1px, transparent 1px)',
                    backgroundSize: '100% 2rem',
                    lineHeight: '2rem'
                  }}
                >
                  <div className="font-bold text-[#5C233B] text-lg mb-2 pt-1">Dear Love,</div>
                  <div className="text-[#3a1a27] text-[15px] whitespace-pre-wrap font-sans mt-2 tracking-wide pb-10">
                    {selectedLetter.content}
                  </div>
                  <div className="mt-8 text-right font-bold text-[#812D45] pb-4">
                    <p>Yours truly,</p>
                    <p className="text-xl font-['VT323']">{selectedLetter.createdBy}</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};