import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X, Heart, Sparkles } from 'lucide-react';
import { playChime, playHeartbeat, playSparkle, playPlink } from '../utils/sfx';

interface Letter {
  id: string;
  title: string;
  content: string;
  createdBy: 'Yza' | 'Zam';
  unlockDate?: string;
  isOpened: boolean;
  createdAt: number;
}

export const LetterPopup: React.FC = () => {
  const [showNotif, setShowNotif] = useState(false);
  const [showLetter, setShowLetter] = useState(false);
  const [currentLetter, setCurrentLetter] = useState<Letter | null>(null);

  const loadLetters = (): Letter[] => {
    try {
      const saved = localStorage.getItem('yzam_open_when_letters_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  };

  const getAvailable = useCallback(() => {
    const all = loadLetters();
    const today = new Date().toISOString().split('T')[0];
    return all.filter(l => {
      if (l.isOpened) return false;
      if (l.unlockDate && today < l.unlockDate) return false;
      return true;
    });
  }, []);

  const triggerSurprise = useCallback((force = false) => {
    const available = getAvailable();

    if (available.length === 0) {
      if (force) {
        playPlink();
        const temp: Letter = {
          id: 'temp-' + Date.now(),
          title: 'Open when you need a smile 💕',
          content: 'Hey lovey...\n\nEven if there are no sealed letters yet, I just wanted to remind you that you are loved.\n\nGo to Our Universe → 💌 Letters and write real ones later!',
          createdBy: 'Zam',
          isOpened: false,
          createdAt: Date.now(),
        };
        setCurrentLetter(temp);
        setShowNotif(true);
        playChime();
        setTimeout(() => playHeartbeat(), 250);
      }
      return;
    }

    const chosen = available[Math.floor(Math.random() * available.length)];
    setCurrentLetter(chosen);
    setShowNotif(true);
    playChime();
    setTimeout(() => playHeartbeat(), 250);
  }, [getAvailable]);

  useEffect(() => {
    const first = setTimeout(() => triggerSurprise(false), 15000); 
    const interval = setInterval(() => triggerSurprise(false), 35000); 
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [triggerSurprise]);

  const openLetter = () => {
    if (!currentLetter) return;
    playSparkle();
    setShowNotif(false);
    setShowLetter(true);

    if (!currentLetter.id.startsWith('temp-')) {
      const all = loadLetters();
      const updated = all.map(l =>
        l.id === currentLetter.id ? { ...l, isOpened: true } : l
      );
      localStorage.setItem('yzam_open_when_letters_v1', JSON.stringify(updated));
    }
  };

  const closeAll = () => {
    playPlink();
    setShowNotif(false);
    setShowLetter(false);
    setCurrentLetter(null);
  };

  return (
    <>
      {/* 🎯 BACK TO BOTTOM: Safe spot near the footer (bottom-16) */}
      <motion.button
        whileHover={{ scale: 1.12, rotate: 8 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => triggerSurprise(true)}
        title="Surprise Letter 💌"
        className="fixed bottom-16 right-6 z-[90] w-14 h-14 bg-[#F4C2D7] border-2 border-[#272426] rounded-full shadow-retro flex items-center justify-center hover:bg-[#f9cfe0] transition-colors cursor-pointer"
      >
        <div className="relative">
          <Mail className="w-6 h-6 text-[#812D45]" />
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#812D45] text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
            ✦
          </span>
        </div>
      </motion.button>

      {/* PORTALED NOTIFICATION TOAST & READING MODAL */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {/* Notification Toast */}
          {showNotif && currentLetter && (
            <motion.div
              initial={{ opacity: 0, y: 90, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 340, damping: 22 }}
              className="fixed bottom-6 right-6 z-[99999] w-[340px] max-w-[92vw]"
            >
              <div className="bg-white border-2 border-[#272426] rounded-2xl shadow-[6px_6px_0px_0px_rgba(39,36,38,0.9)] overflow-hidden">
                <div className="bg-[#F4C2D7] px-4 py-2.5 border-b-2 border-[#272426] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white rounded-lg border-2 border-[#272426] flex items-center justify-center">
                      <Mail className="w-4 h-4 text-[#812D45]" />
                    </div>
                    <span className="font-mono text-xs font-bold text-[#812D45] uppercase tracking-wider">
                      Surprise Letter
                    </span>
                  </div>
                  <button onClick={closeAll} className="p-1 hover:bg-white/50 rounded-lg cursor-pointer">
                    <X className="w-4 h-4 text-[#812D45]" />
                  </button>
                </div>

                <div className="p-4">
                  <p className="text-sm font-bold text-[#272426] mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#812D45]" />
                    You've got a letter...
                  </p>
                  <p className="text-xs text-gray-500 font-mono mb-4 line-clamp-2">
                    {currentLetter.title}
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={openLetter}
                      className="flex-1 py-2.5 bg-[#812D45] text-white text-xs font-bold rounded-xl border-2 border-[#272426] shadow-retro-sm hover:bg-[#6A2337] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Heart className="w-3.5 h-3.5 fill-current" />
                      Open Letter
                    </button>
                    <button
                      onClick={closeAll}
                      className="px-4 py-2.5 bg-white text-xs font-bold rounded-xl border-2 border-[#272426] hover:bg-gray-50 cursor-pointer"
                    >
                      Later
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Reading Modal (Lined Paper Style) */}
          {showLetter && currentLetter && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={closeAll}
            >
              <motion.div
                initial={{ scale: 0.8, y: 40, rotate: -2 }}
                animate={{ scale: 1, y: 0, rotate: 0 }}
                exit={{ scale: 0.8, y: 40, opacity: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-lg bg-[#fffdf9] rounded-sm shadow-[10px_10px_0px_rgba(0,0,0,0.8)] border-2 border-[#272426] flex flex-col max-h-[80vh] overflow-hidden"
              >
                {/* Sticky Tape Decor */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-pink-100/80 border border-pink-200 rotate-2 z-20 shadow-sm"></div>

                {/* Header Bar */}
                <div className="bg-[#812D45] text-white px-5 py-3 border-b-2 border-[#272426] flex justify-between items-center z-10">
                  <h3 className="font-bold flex items-center gap-2">
                    <Heart className="w-4 h-4 text-[#F4C2D7] fill-current" />
                    {currentLetter.title}
                  </h3>
                  <button onClick={closeAll} className="w-6 h-6 bg-red-400 text-white rounded-full flex items-center justify-center hover:bg-red-500 border border-black transition-colors cursor-pointer">
                    <X className="w-4 h-4 font-bold" />
                  </button>
                </div>

                {/* Lined Paper Content Area */}
                <div 
                  className="p-6 overflow-y-auto flex-1 relative"
                  style={{
                    backgroundImage: 'linear-gradient(#f4c2d7 1px, transparent 1px)',
                    backgroundSize: '100% 2rem',
                    lineHeight: '2rem'
                  }}
                >
                  <div className="font-bold text-[#5C233B] text-lg mb-2 pt-1">
                    Dear Love,
                  </div>
                  
                  <div className="text-[#3a1a27] text-[15px] whitespace-pre-wrap font-sans mt-2 tracking-wide pb-10">
                    {currentLetter.content}
                  </div>
                  
                  <div className="mt-8 text-right font-bold text-[#812D45] pb-4">
                    <p>Yours truly,</p>
                    <p className="text-xl font-['VT323']">{currentLetter.createdBy}</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};