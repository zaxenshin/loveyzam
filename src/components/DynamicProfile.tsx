import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Quote } from 'lucide-react';
import { MoodWidget } from './MoodWidget';
import ToothOfTheDay from './ToothOfTheDay';
import ZamTerminal from './ZamTerminal';
import { syncWithCloud, saveToCloud } from '../utils/firebase';

interface TabData {
  id: string;
  title: string;
  content: string;
}

interface ProfileData {
  mood: string;
  tabs: TabData[];
}

interface DynamicProfileProps {
  owner: 'Yza' | 'Zam';
  isEditMode: boolean;
  activeTabTitle: string;
  onTabsChange: (tabs: string[]) => void;
  onTabSelect: (tab: string) => void;
}

export const DynamicProfile: React.FC<DynamicProfileProps> = ({ 
  owner, 
  isEditMode, 
  activeTabTitle, 
  onTabsChange,
  onTabSelect 
}) => {
  const storageKey = `yzam_profile_v7_${owner}`;
  const CLOUD_KEY = `profiles/${owner}`;
  
  const defaultData: ProfileData = {
    mood: owner === 'Yza' ? "Soft days, warm drinks, & quiet pages 📖✨" : "Building YZAM 💻☕",
    tabs: owner === 'Yza' 
      ? [
          { id: 'y1', title: 'Overview', content: "🎬 Favorite Films:\n- Mamma Mia\n- KPop Demon Hunters\n\n🍵 Comfort:\n- Matcha & Pastries\n- Iced Coffee\n\n✨ Current Vibe:\n- Chill & Cozy" },
          { id: 'y2', title: 'Dentistry', content: "🦷 Oral Anatomy Review:\n- Pending\n\n📋 Practical Assessment:\n- Coming Soon!\n\n🪥 Notes:\n- Don't forget to organize the study guides!" }
        ]
      : [
          { id: 'z1', title: 'Terminal', content: "$ yzam.status --check\n> Computer Engineering: ONLINE\n> Coffee Level: ████████░░ 82%\n> Current Mode: Building YZAM 💻\n\n🎧 Now Playing:\n- Lo-fi beats\n- Vinyl Record #08" },
          { id: 'z2', title: 'Coding', content: "💻 Data Structures Lab:\n- Due Friday • 11:59 PM\n\n⚡ Logic Circuits Project:\n- In Progress\n\n🌐 YZAM OS:\n- Building the best space for us!" }
        ]
  };

  const [data, setData] = useState<ProfileData>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : defaultData;
  });

  const skipNextSave = useRef(false);
  const hydrated = useRef(false);

  // Local + cloud
  useEffect(() => {
    onTabsChange(data.tabs.map(t => t.title));
    localStorage.setItem(storageKey, JSON.stringify(data));

    if (!hydrated.current) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    saveToCloud(CLOUD_KEY, data);
  }, [data, onTabsChange, storageKey, CLOUD_KEY]);

  // Boot sync + live listener
  useEffect(() => {
    let unsub: (() => void) | void;

    const boot = async () => {
      const local = (() => {
        try {
          const raw = localStorage.getItem(storageKey);
          return raw ? (JSON.parse(raw) as ProfileData) : data;
        } catch {
          return data;
        }
      })();

      unsub = await syncWithCloud<ProfileData>(CLOUD_KEY, local, (cloudData) => {
        if (cloudData && typeof cloudData === 'object' && 'tabs' in cloudData) {
          skipNextSave.current = true;
          setData(cloudData);
        }
      });

      hydrated.current = true;
    };

    boot();

    return () => {
      if (typeof unsub === 'function') unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner]);

  const activeTab = data.tabs.find(t => t.title === activeTabTitle);

  const handleUpdateTabTitle = (id: string, newTitle: string) => {
    setData(prev => ({ ...prev, tabs: prev.tabs.map(t => t.id === id ? { ...t, title: newTitle } : t) }));
    onTabSelect(newTitle); 
  };

  const handleUpdateTabContent = (id: string, newContent: string) => {
    setData(prev => ({ ...prev, tabs: prev.tabs.map(t => t.id === id ? { ...t, content: newContent } : t) }));
  };

  const renderBeautifulUI = (content: string) => {
    const sections = content.split('\n\n').filter(s => s.trim());
    return (
      <div className={`grid gap-4 ${sections.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
        {sections.map((section, idx) => {
          const lines = section.split('\n').filter(l => l.trim());
          if (lines[0].startsWith('$')) {
            return (
              <div key={idx} className="p-4 bg-[#1a1a1a] rounded-xl border-2 border-[#812D45] font-mono shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] sm:col-span-2">
                {lines.map((l, i) => <p key={i} className={l.startsWith('$') ? 'font-bold text-green-400' : 'text-gray-300 ml-3'}>{l}</p>)}
              </div>
            );
          }
          if (lines[0].endsWith(':')) {
            const header = lines[0].replace(':', '');
            const items = lines.slice(1);
            const bgColors = owner === 'Yza' ? ['bg-[#F4C2D7]/30 border-[#F4C2D7]', 'bg-[#DCE4C9]/40 border-[#DCE4C9]', 'bg-[#FFF0F5] border-[#F4C2D7]'] : ['bg-[#FFF8F1] border-[#812D45]/30'];
            const bgColor = bgColors[idx % bgColors.length];
            return (
              <motion.div key={idx} whileHover={{ y: -2 }} className={`p-4 ${bgColor} rounded-xl border-2 shadow-sm`}>
                <p className="font-bold text-sm text-[#812D45] mb-2.5 border-b-2 border-black/10 pb-1.5">{header}</p>
                <ul className="space-y-2">
                  {items.map((item, i) => {
                     const isList = item.startsWith('-');
                     const text = item.replace(/^-/, '').trim();
                     return (
                       <li key={i} className={`flex items-start gap-2 text-sm ${text.includes('(Together') ? 'font-bold text-[#812D45]' : 'text-[#272426]'}`}>
                         {isList && <span className="text-[#812D45] mt-0.5 opacity-60">•</span>}<span>{text}</span>
                       </li>
                     )
                  })}
                </ul>
              </motion.div>
            )
          }
          if (lines[0].startsWith('"')) {
            return (
              <div key={idx} className="p-5 bg-white rounded-xl border-2 border-[#272426] shadow-retro-sm sm:col-span-2 relative text-center">
                <Quote className="w-6 h-6 text-[#F4C2D7] absolute top-3 left-3 opacity-40" />
                {lines.map((l, i) => <p key={i} className={`italic font-serif text-[#5C233B] ${i === 0 ? 'text-lg leading-relaxed' : 'text-xs mt-2 font-mono text-gray-500'}`}>{l}</p>)}
              </div>
            )
          }
          return (
            <div key={idx} className="p-4 bg-white rounded-xl border border-black/10 shadow-sm sm:col-span-2">
              {lines.map((l, i) => <p key={i} className="text-sm text-gray-700 mb-1 leading-relaxed">{l}</p>)}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-5 font-sans text-sm h-full flex flex-col">
      {/* 🎯 MOOD WIDGET */}
      <div className="shrink-0">
        <MoodWidget name={owner} />
      </div>

      {/* 🦷 TOOTH OF THE DAY — Yza only */}
      {owner === 'Yza' && (
        <div className="shrink-0">
          <ToothOfTheDay />
        </div>
      )}

      {/* 💻 ZAM TERMINAL — Zam only */}
      {owner === 'Zam' && (
        <div className="shrink-0">
          <ZamTerminal />
        </div>
      )}

      {isEditMode && (
        <button onClick={() => {
            const newTabTitle = `Tab ${data.tabs.length + 1}`;
            const newTab = { id: Date.now().toString(), title: newTabTitle, content: '📝 My New List:\n- Item 1\n- Item 2' };
            setData({ ...data, tabs: [...data.tabs, newTab] });
            onTabSelect(newTabTitle);
          }}
          className="w-full py-2.5 bg-white border-2 border-dashed border-black/30 rounded-xl text-xs font-bold font-mono hover:bg-gray-50 flex items-center justify-center gap-1 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#812D45]" /> Add New Category Tab
        </button>
      )}

      {activeTab && (
        <div className="flex-1 flex flex-col min-h-[300px]">
          {isEditMode ? (
            <div className="flex flex-col gap-3 h-full flex-1 p-4 bg-white rounded-xl border-2 border-[#812D45] shadow-retro-sm">
              <div className="flex items-center gap-2 border-b-2 border-black/10 pb-3">
                <span className="text-xs font-bold font-mono text-[#812D45]">Tab Title:</span>
                <input 
                  type="text" 
                  value={activeTab.title} 
                  onChange={(e) => handleUpdateTabTitle(activeTab.id, e.target.value)}
                  className="flex-1 p-1.5 border-b-2 border-transparent focus:border-[#812D45] font-bold text-base outline-none bg-transparent"
                />
                <button onClick={() => {
                    const filtered = data.tabs.filter(t => t.id !== activeTab.id);
                    setData({ ...data, tabs: filtered });
                    if (filtered.length > 0) onTabSelect(filtered[0].title);
                  }} 
                  className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="text-[10px] font-mono text-gray-400 mb-1 flex justify-between">
                <span>Tip: End a line with ":" to make a Card Header.</span>
                <span>Start with "-" for bullets.</span>
              </div>
              <textarea 
                value={activeTab.content}
                onChange={(e) => handleUpdateTabContent(activeTab.id, e.target.value)}
                className="w-full flex-1 p-2 outline-none resize-none bg-transparent text-sm leading-[28px]"
                style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, rgba(244, 194, 215, 0.4) 28px)', backgroundAttachment: 'local' }}
                spellCheck="false"
              />
            </div>
          ) : (
            <div className="w-full">{renderBeautifulUI(activeTab.content)}</div>
          )}
        </div>
      )}
    </div>
  );
};