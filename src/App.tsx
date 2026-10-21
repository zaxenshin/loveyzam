import React, { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { RetroWindow } from './components/RetroWindow';
import { CalendarView } from './components/CalendarView';
import { ChecklistView } from './components/ChecklistView';
import { DynamicProfile } from './components/DynamicProfile';
import { OpenWhenLetters } from './components/OpenWhenLetters';
import { ScrapbookView } from './components/ScrapbookView';
import { LetterPopup } from './components/LetterPopup';
import LoFiRadio from './components/LoFiRadio';
import SystemStats from './components/SystemStats';
import { Edit3, Eye, Quote, RefreshCw, X, Sparkles, Terminal, Music } from 'lucide-react';
import { playChime, playHeartbeat, playSparkle, playPlink, playWhoosh } from './utils/sfx';
import { SpotifyPlayer } from './components/SpotifyPlayer';
import { UpdateFlowModal } from './components/UpdateFlowModal';

const PhotoBooth = lazy(() => import('./components/PhotoBooth'));

const LOGO_SRC = `${import.meta.env.BASE_URL}yzam-logo.svg`;

// ==========================================
// 🚨 PROPOSAL SWITCH (SAFE FOR GIT PUSH)
// Gawing `true` kapag gusto mo na lumabas sa mismong live website!
const IS_PROPOSAL_LIVE = false;
// ==========================================

const FloatingSparkles = () => {
  const sparkles = Array.from({ length: 15 });
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {sparkles.map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: '100vh', opacity: 0, scale: Math.random() * 0.5 + 0.5 }}
          animate={{ y: '-10vh', opacity: [0, 1, 0] }}
          transition={{ duration: Math.random() * 10 + 10, repeat: Infinity, ease: 'linear', delay: Math.random() * 10 }}
          className="absolute text-[#CAF0F8] opacity-60"
          style={{ left: `${Math.random() * 100}vw` }}
        >
          ✦
        </motion.div>
      ))}
    </div>
  );
};

const movieQuotes = [
  { text: 'The best things in life, the very best things happen unexpectedly.', source: 'Mamma Mia' },
  { text: 'I have a dream, a song to sing, to help me cope with anything.', source: 'Mamma Mia' },
  { text: 'To me, you are perfect.', source: 'Love Actually' },
  { text: 'Some people are worth melting for.', source: 'Frozen' },
  { text: "I look at you, and I'm home.", source: 'Finding Nemo' },
  { text: "You're the greatest adventure I'll ever have.", source: 'The Incredibles' },
];

export default function App() {
  
  // LOGIC PARA SA SYSTEM UPDATE / TEST MODE
  const [showUpdate, setShowUpdate] = useState(() => {
    // 1. Kung nilagyan mo ng "?test=1" sa URL, ipapakita nya ALWAYS (for localhost testing!)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('test') === '1') return true;

    // 2. Kung false ang switch, matik hindi lalabas sa live (safe i-push)
    if (!IS_PROPOSAL_LIVE) return false;

    // 3. Normal behavior: lalabas lang kung di pa siya nakakapag YES.
    return localStorage.getItem('yzam_v2_accepted') !== 'true';
  });

  // 🎵 BACKGROUND MUSIC AUTOPLAY & TOGGLE LOGIC
  const bgAudioRef = useRef<HTMLAudioElement>(null);
  const [isBgMusicOn, setIsBgMusicOn] = useState(true);

  useEffect(() => {
    const audio = bgAudioRef.current;
    if (!audio) return;

    audio.volume = 0.4; // Soft volume for background instrumental

    const attemptPlay = () => {
      audio.play()
        .then(() => {
          setIsBgMusicOn(true);
        })
        .catch(() => {
          // If blocked by browser policy, wait for first user click/tap anywhere
          const handleFirstInteraction = () => {
            audio.play().then(() => {
              setIsBgMusicOn(true);
            }).catch(() => {});
            
            window.removeEventListener('click', handleFirstInteraction);
            window.removeEventListener('touchstart', handleFirstInteraction);
          };

          window.addEventListener('click', handleFirstInteraction);
          window.addEventListener('touchstart', handleFirstInteraction);
        });
    };

    attemptPlay();
  }, []);

  const toggleBgMusic = () => {
    if (bgAudioRef.current) {
      if (isBgMusicOn) {
        bgAudioRef.current.pause();
        setIsBgMusicOn(false);
      } else {
        bgAudioRef.current.play()
          .then(() => {
            setIsBgMusicOn(true);
          })
          .catch((err) => console.log('Play error:', err));
      }
    }
  };

  const [isBooting, setIsBooting] = useState(true);
  const [loadingText, setLoadingText] = useState('Initializing YZAM OS...');

  const [isEditMode, setIsEditMode] = useState(false);
  const [openWindows, setOpenWindows] = useState({ her: true, your: true, shared: true });
  const [showQuotePopup, setShowQuotePopup] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);

  const [herTabs, setHerTabs] = useState<string[]>([]);
  const [yourTabs, setYourTabs] = useState<string[]>([]);
  const [activeTabHer, setActiveTabHer] = useState('Overview');
  const [activeTabYour, setActiveTabYour] = useState('Terminal');
  const [activeTabShared, setActiveTabShared] = useState('🗓️ Calendar');

  useEffect(() => {
    if (isBooting) {
      setTimeout(() => { playSparkle(); setLoadingText('Loading memories... 📸'); }, 700);
      setTimeout(() => { playChime(); setLoadingText('Syncing heartbeats... 👩‍❤️‍👩'); }, 1500);
      setTimeout(() => { playHeartbeat(); setIsBooting(false); }, 2600);
    }
  }, [isBooting]);

  const triggerConfetti = () => {
    playHeartbeat();
    setTimeout(() => playSparkle(), 150);
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#CAF0F8', '#F4C2D7', '#812D45', '#D6A16C'],
    });
  };

  const nextQuote = () => {
    playChime();
    setQuoteIndex((prev) => (prev + 1) % movieQuotes.length);
  };

  const toggleWindow = (key: keyof typeof openWindows) => {
    playSparkle();
    setOpenWindows((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (isBooting) {
    return (
      <div className="min-h-screen bg-[#272426] flex flex-col items-center justify-center font-mono text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(202,240,248,0.06),rgba(0,255,0,0.02),rgba(255,0,200,0.06))] bg-[length:100%_4px,3px_100%] z-10 pointer-events-none opacity-40" />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="z-20 flex flex-col items-center gap-6 w-full max-w-sm px-6"
        >
          <motion.img
            src={LOGO_SRC}
            alt="YZAM"
            className="w-24 h-24 drop-shadow-[0_0_20px_rgba(244,194,215,0.55)] rounded-2xl border-2 border-[#272426] bg-[#FFF8F1]"
            initial={{ rotate: -6, scale: 0.85 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          />
          <h1 className="font-pixel text-xl tracking-[0.2em] text-[#CAF0F8] drop-shadow-md">YZAM OS</h1>
          <div className="w-full bg-black/40 border-2 border-[#812D45] p-1 rounded-md mt-2">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2.4, ease: 'easeInOut' }}
              className="h-3.5 bg-[#CAF0F8] rounded-sm"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
            <Terminal className="w-4 h-4 animate-pulse text-[#CAF0F8]" />
            {loadingText}
          </p>
        </motion.div>
      </div>
    );
  }

  const allHerTabs = [...(herTabs.length ? herTabs : ['Overview']), '✅ Tasks'];
  const allYourTabs = [...(yourTabs.length ? yourTabs : ['Terminal']), '✅ Tasks'];

  return (
    <div className="min-h-screen bg-grid-paper flex flex-col font-sans select-none overflow-x-hidden pb-14 text-sm relative">
      
      {/* 🎵 BACKGROUND AUDIO TAG */}
      <audio 
        ref={bgAudioRef} 
        src={`${import.meta.env.BASE_URL}bg-instrumental.mp3`.replace(/\/+/g, '/')} 
        loop 
      />

      {/* SYSTEM UPDATE TAKEOVER OVERLAY */}
      {showUpdate && (
        <UpdateFlowModal 
          onComplete={() => {
            setShowUpdate(false);
          }} 
        />
      )}

      <FloatingSparkles />

      <header className="bg-[#F0F9FF] border-b-2 border-[#272426] px-4 py-2.5 flex items-center justify-between shadow-retro-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <motion.button
            type="button"
            whileHover={{ rotate: 8, scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center cursor-pointer"
            onClick={triggerConfetti}
            title="YZAM OS"
          >
            <img
              src={LOGO_SRC}
              alt="YZAM"
              className="w-9 h-9 rounded-lg border-2 border-[#272426] shadow-retro-sm bg-[#FFF8F1] object-contain"
            />
          </motion.button>
          <span className="font-pixel text-sm tracking-wider text-[#812D45] font-bold hidden sm:inline drop-shadow-sm">
            YZAM OS
          </span>
        </div>

        <div className="flex items-center gap-2.5 font-mono font-bold">
          
          {/* BG MUSIC TOGGLE BUTTON */}
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              playPlink();
              toggleBgMusic();
            }}
            className={`px-3 py-1.5 border-2 border-[#272426] rounded-lg flex items-center gap-1.5 shadow-retro-sm text-xs transition-colors ${
              isBgMusicOn ? 'bg-[#CAF0F8] text-[#0F4C5C]' : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Music: {isBgMusicOn ? 'ON 🎵' : 'OFF 🔇'}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              playChime();
              setShowQuotePopup(true);
              nextQuote();
            }}
            className="px-3 py-1.5 bg-white border-2 border-[#272426] rounded-lg flex items-center gap-1.5 shadow-retro-sm text-xs text-[#812D45] hover:bg-[#F4FCFE] transition-colors"
          >
            <Quote className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quote</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              playPlink();
              setIsEditMode(!isEditMode);
            }}
            className={`px-3 py-1.5 border-2 border-[#272426] rounded-lg flex items-center gap-1.5 shadow-retro-sm text-xs transition-colors ${
              isEditMode ? 'bg-[#812D45] text-white' : 'bg-white text-[#272426] hover:bg-gray-50'
            }`}
          >
            {isEditMode ? (
              <>
                <Eye className="w-3.5 h-3.5" /> View Mode
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5" /> Edit Profile
              </>
            )}
          </motion.button>
        </div>
      </header>

      <AnimatePresence>
        {showQuotePopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              playWhoosh();
              setShowQuotePopup(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="bg-white border-2 border-[#272426] rounded-2xl shadow-retro max-w-md w-full p-6 relative cursor-grab active:cursor-grabbing"
              onClick={(e) => e.stopPropagation()}
              drag
              dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
            >
              <button
                onClick={() => {
                  playWhoosh();
                  setShowQuotePopup(false);
                }}
                className="absolute top-3 right-3 p-1.5 bg-red-100 text-red-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#CAF0F8] rounded-lg flex items-center justify-center border-2 border-[#272426]">
                  <Quote className="w-4 h-4 text-[#0F4C5C]" />
                </div>
                <span className="font-mono text-xs font-bold text-[#0F4C5C]">Favorite Lines</span>
              </div>
              <p className="text-lg italic font-serif text-[#0F4C5C] leading-relaxed mb-3">
                "{movieQuotes[quoteIndex].text}"
              </p>
              <p className="text-right text-xs font-mono font-bold text-[#812D45]">
                — {movieQuotes[quoteIndex].source}
              </p>
              <div className="mt-5 flex gap-2">
                <button
                  onClick={nextQuote}
                  className="flex-1 py-2 bg-[#CAF0F8] text-[#0F4C5C] border-2 border-[#272426] rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-retro-sm hover:bg-[#bde8f5]"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Next
                </button>
                <button
                  onClick={triggerConfetti}
                  className="px-4 py-2 bg-white border-2 border-[#272426] rounded-xl shadow-retro-sm"
                >
                  <Sparkles className="w-4 h-4 text-[#812D45]" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full relative z-10">
        <div className="mb-8 flex flex-wrap gap-4 justify-center sm:justify-start">
          <motion.button
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleWindow('her')}
            className={`px-4 py-2.5 rounded-xl border-2 border-[#272426] font-mono text-sm font-bold flex items-center gap-2 shadow-retro transition-colors ${
              openWindows.her ? 'bg-[#CAF0F8] text-[#0F4C5C]' : 'bg-white'
            }`}
          >
            🍵 Yza's Space
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleWindow('shared')}
            className={`px-4 py-2.5 rounded-xl border-2 border-[#272426] font-mono text-sm font-bold flex items-center gap-2 shadow-retro transition-colors ${
              openWindows.shared ? 'bg-[#F4C2D7] text-[#5C233B]' : 'bg-white'
            }`}
          >
            🌌 Our Space
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleWindow('your')}
            className={`px-4 py-2.5 rounded-xl border-2 border-[#812D45] font-mono text-sm font-bold flex items-center gap-2 shadow-retro transition-colors ${
              openWindows.your ? 'bg-[#812D45] text-white' : 'bg-white text-[#812D45]'
            }`}
          >
            ☕ Zam's Space
          </motion.button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {openWindows.her && (
            <RetroWindow
              id="her"
              title="Yza's Space"
              icon="🍵"
              variant="her"
              tabs={allHerTabs}
              activeTab={activeTabHer}
              onTabChange={setActiveTabHer}
              onClose={() => toggleWindow('her')}
            >
              <div className={activeTabHer === '✅ Tasks' ? 'h-full bg-white rounded-xl border-2 border-black/10 p-3' : 'hidden'}>
                <ChecklistView scope="Yza" compact title="🍵 Yza's Personal To-Do" />
              </div>
              <div className={activeTabHer !== '✅ Tasks' ? 'h-full' : 'hidden'}>
                <DynamicProfile
                  owner="Yza"
                  isEditMode={isEditMode}
                  activeTabTitle={activeTabHer}
                  onTabsChange={setHerTabs}
                  onTabSelect={setActiveTabHer}
                />
              </div>
            </RetroWindow>
          )}

          {openWindows.shared && (
            <RetroWindow
              id="shared"
              title="Our Universe"
              icon={LOGO_SRC}
              variant="shared"
              tabs={['🗓️ Calendar', '✅ Checklist', '💌 Letters', '📸 Scrapbook', '🤳 SnapCam', '🎧 Music', '📊 Stats']}
              activeTab={activeTabShared}
              onTabChange={setActiveTabShared}
              onClose={() => toggleWindow('shared')}
            >
              <div className={activeTabShared === '🗓️ Calendar' ? 'h-full' : 'hidden'}>
                <CalendarView />
              </div>
              <div
                className={
                  activeTabShared === '✅ Checklist'
                    ? 'h-full bg-[#FFF5F8] p-3 rounded-xl border-2 border-[#272426] shadow-inner'
                    : 'hidden'
                }
              >
                <ChecklistView scope="shared" title="🌌 Our Shared Checklist" />
              </div>
              <div className={activeTabShared === '💌 Letters' ? 'h-full' : 'hidden'}>
                <OpenWhenLetters isEditMode={isEditMode} />
              </div>
              <div className={activeTabShared === '📸 Scrapbook' ? 'h-full' : 'hidden'}>
                <ScrapbookView isEditMode={isEditMode} />
              </div>
              <div className={activeTabShared === '🤳 SnapCam' ? 'h-full' : 'hidden'}>
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center py-16 text-[#812D45] font-mono text-sm">
                      Loading SnapCam…
                    </div>
                  }
                >
                  <PhotoBooth />
                </Suspense>
              </div>
              <div className={activeTabShared === '🎧 Music' ? 'h-full' : 'hidden'}>
                <SpotifyPlayer />
              </div>
              <div className={activeTabShared === '📊 Stats' ? 'h-full' : 'hidden'}>
                <SystemStats />
              </div>
            </RetroWindow>
          )}

          {openWindows.your && (
            <RetroWindow
              id="your"
              title="Zam's Space"
              icon="☕"
              variant="your"
              tabs={allYourTabs}
              activeTab={activeTabYour}
              onTabChange={setActiveTabYour}
              onClose={() => toggleWindow('your')}
            >
              <div className={activeTabYour === '✅ Tasks' ? 'h-full bg-white rounded-xl border-2 border-black/10 p-3' : 'hidden'}>
                <ChecklistView scope="Zam" compact title="☕ Zam's Personal To-Do" />
              </div>
              <div className={activeTabYour !== '✅ Tasks' ? 'h-full' : 'hidden'}>
                <DynamicProfile
                  owner="Zam"
                  isEditMode={isEditMode}
                  activeTabTitle={activeTabYour}
                  onTabsChange={setYourTabs}
                  onTabSelect={setActiveTabYour}
                />
              </div>
            </RetroWindow>
          )}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-[#F0F9FF] border-t-2 border-[#272426] px-4 py-2 flex items-center justify-between text-xs font-mono z-40">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse border border-cyan-600" />
          <span className="font-bold text-[#272426]">Lovey</span>
        </div>
        <span className="font-bold text-[#812D45] tracking-wide">Yza &amp; Zam 👩‍❤️‍👩</span>
      </footer>

      <LetterPopup />
      <LoFiRadio />
    </div>
  );
}