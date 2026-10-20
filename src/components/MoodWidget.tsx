import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit3, Check, X } from 'lucide-react';
import { syncWithCloud, saveToCloud } from '../utils/firebase';

interface MoodData {
  text: string;
  emoji: string;
  timestamp: string;
}

interface MoodWidgetProps {
  name: 'Yza' | 'Zam';
}

const MOOD_EMOJIS = [
  '🥰', '😊', '😂', '🥺', '😭', '😠', '😴', '🤒',
  '💻', '📖', '🍵', '☕', '🎮', '🎧', '🥐', '✨'
];

export const MoodWidget: React.FC<MoodWidgetProps> = ({ name }) => {
  const currentKey = `yzam_current_mood_${name}`;
  const historyKey = `yzam_mood_history_${name}`;
  const CLOUD_KEY = `moods/${name}`;
  const CLOUD_HISTORY_KEY = `mood_history/${name}`;

  const defaultMood: MoodData = name === 'Yza'
    ? { text: 'Soft days, warm drinks, & quiet pages', emoji: '📖', timestamp: new Date().toISOString() }
    : { text: 'Building YZAM', emoji: '💻', timestamp: new Date().toISOString() };

  const [mood, setMood] = useState<MoodData>(() => {
    const saved = localStorage.getItem(currentKey);
    return saved ? JSON.parse(saved) : defaultMood;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState(mood.text);
  const [draftEmoji, setDraftEmoji] = useState(mood.emoji);

  const skipNextSave = useRef(false);
  const hydrated = useRef(false);

  // Local + cloud persist
  useEffect(() => {
    localStorage.setItem(currentKey, JSON.stringify(mood));
    if (!hydrated.current) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    saveToCloud(CLOUD_KEY, mood);
  }, [mood, currentKey, CLOUD_KEY]);

  // Boot: upload local if cloud empty + live listen
  useEffect(() => {
    let unsub: (() => void) | void;

    const boot = async () => {
      const local = (() => {
        try {
          const raw = localStorage.getItem(currentKey);
          return raw ? (JSON.parse(raw) as MoodData) : mood;
        } catch {
          return mood;
        }
      })();

      unsub = await syncWithCloud<MoodData>(CLOUD_KEY, local, (cloudData) => {
        if (cloudData && typeof cloudData === 'object' && 'text' in cloudData) {
          skipNextSave.current = true;
          setMood(cloudData);
          setDraftText(cloudData.text);
          setDraftEmoji(cloudData.emoji);
        }
      });

      hydrated.current = true;
    };

    boot();

    return () => {
      if (typeof unsub === 'function') unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  const handleSave = () => {
    if (!draftText.trim()) return;

    const newMood: MoodData = {
      text: draftText.trim(),
      emoji: draftEmoji,
      timestamp: new Date().toISOString()
    };

    setMood(newMood);

    // History: local + cloud
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]') as MoodData[];
    const nextHistory = [...history, newMood];
    localStorage.setItem(historyKey, JSON.stringify(nextHistory));
    saveToCloud(CLOUD_HISTORY_KEY, nextHistory);

    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraftText(mood.text);
    setDraftEmoji(mood.emoji);
    setIsEditing(false);
  };

  return (
    <div className={`border-2 border-[#272426] rounded-2xl p-4 shadow-retro-sm relative group overflow-hidden ${
      name === 'Yza' ? 'bg-[#FFF5F8]' : 'bg-[#FFF8F1]'
    }`}>
      <AnimatePresence mode="wait">
        {!isEditing ? (
          <motion.div
            key="display"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex flex-col"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-[10px] text-[#812D45] font-black uppercase tracking-widest font-mono opacity-80">
                Today's Mood / Status
              </h3>
              <button
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white hover:bg-[#F4C2D7] hover:text-[#812D45] rounded-md border border-black/20 cursor-pointer"
                title="Update Status"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <p className="font-bold text-[#272426] text-base leading-snug">
              {mood.text} <span className="text-lg">{mood.emoji}</span>
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="edit"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex flex-col gap-3"
          >
            <h3 className="text-[10px] text-[#812D45] font-black uppercase tracking-widest font-mono">
              Update Status
            </h3>
            
            {/* Emoji Selector */}
            <div className="flex flex-wrap gap-1.5 bg-white p-2 rounded-xl border border-black/10">
              {MOOD_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setDraftEmoji(emoji)}
                  className={`text-lg p-1 rounded-md hover:scale-110 transition-transform cursor-pointer ${
                    draftEmoji === emoji ? 'bg-[#F4C2D7] shadow-sm border border-[#812D45]/30' : 'hover:bg-gray-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Input */}
            <input
              type="text"
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full text-sm font-bold border-2 border-black/20 rounded-xl px-3 py-2 outline-none focus:border-[#812D45] bg-white text-[#272426]"
              autoFocus
            />

            {/* Buttons */}
            <div className="flex items-center gap-2 justify-end mt-1">
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black font-mono bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" /> Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black font-mono bg-[#812D45] hover:bg-[#6A2337] text-white border-2 border-[#272426] shadow-retro-sm transition-transform active:scale-95 cursor-pointer"
              >
                <Check className="w-3 h-3" /> Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};