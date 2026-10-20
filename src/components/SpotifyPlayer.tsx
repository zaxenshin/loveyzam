import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { playSparkle, playPlink } from '../utils/sfx';

const STORAGE_KEY = 'yzam_spotify_url_v1';
const FALLBACK_EMBED =
  'https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M?utm_source=generator&theme=0';

const toEmbed = (raw: string): string => {
  if (!raw.trim()) return FALLBACK_EMBED;

  let url = raw.trim();

  // spotify:playlist:xxx URI
  if (url.startsWith('spotify:')) {
    const p = url.split(':');
    if (p.length >= 3)
      return `https://open.spotify.com/embed/${p[1]}/${p[2]}?utm_source=generator&theme=0`;
  }

  if (!url.startsWith('http')) url = 'https://' + url;

  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length >= 2)
      return `https://open.spotify.com/embed/${parts[0]}/${parts[1]}?utm_source=generator&theme=0`;
  } catch {}

  return FALLBACK_EMBED;
};

export const SpotifyPlayer: React.FC = () => {
  // Single source of truth — read from localStorage ONCE on mount
  const [url, setUrl] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) || ''
  );
  const [draft, setDraft] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) || ''
  );
  const [saved, setSaved] = useState(false);

  // ── Hard save: state + localStorage, every time ──
  const save = (value: string) => {
    const v = value.trim();
    setUrl(v);
    setDraft(v);
    try {
      localStorage.setItem(STORAGE_KEY, v);
    } catch (e) {
      console.error('localStorage save failed:', e);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    playSparkle();
    save(draft);
  };

  // Safety net: if url changes for any reason, persist it
  useEffect(() => {
    if (url) localStorage.setItem(STORAGE_KEY, url);
  }, [url]);

  const embedSrc = toEmbed(url);

  return (
    <div className="flex flex-col gap-4 font-sans text-sm h-full max-w-2xl mx-auto">
      {/* ═══ HEADER ═══ */}
      <div className="bg-[#272426] text-white p-4 rounded-2xl border-2 border-[#272426] shadow-retro flex items-center gap-3.5 relative overflow-hidden shrink-0">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#F4C2D7] rounded-full blur-2xl opacity-20 pointer-events-none" />

        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 rounded-full bg-gradient-to-tr from-black via-gray-800 to-gray-900 border-2 border-[#F4C2D7] flex items-center justify-center shadow-md shrink-0 z-10"
        >
          <div className="w-4 h-4 rounded-full bg-[#812D45] border border-white flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
        </motion.div>

        <div className="z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#CAF0F8] bg-black/40 px-2 py-0.5 rounded border border-[#CAF0F8]/30">
              YZAM JUKEBOX 📻
            </span>
            <Sparkles className="w-3.5 h-3.5 text-[#F4C2D7] animate-pulse" />
          </div>
          <h2 className="font-mono font-black text-lg tracking-wide text-white mt-0.5">
            Spotify Player
          </h2>
        </div>
      </div>

      {/* ═══ INPUT — always visible ═══ */}
      <form
        onSubmit={handleSubmit}
        className="bg-[#FFF8F1] border-2 border-[#812D45] p-3.5 rounded-2xl shadow-retro-sm flex flex-col sm:flex-row gap-2 shrink-0"
      >
        <input
          type="text"
          placeholder="Paste Spotify link here (song / playlist / album)..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="flex-1 px-3 py-2 bg-white border-2 border-black/20 rounded-xl text-xs font-mono font-bold outline-none focus:border-[#812D45]"
        />
        <button
          type="submit"
          onClick={() => playPlink()}
          className="bg-[#812D45] text-white font-mono font-black text-xs px-4 py-2 rounded-xl border-2 border-[#272426] shadow-retro-sm hover:bg-[#6A2337] cursor-pointer active:scale-95 transition-transform"
        >
          {saved ? '✅ Saved!' : 'Load'}
        </button>
      </form>

      {/* ═══ EMBED ═══ */}
      <div className="bg-[#181818] p-2 sm:p-3 rounded-2xl border-2 border-[#272426] shadow-retro relative overflow-hidden flex-1 min-h-[352px]">
        <div className="flex items-center justify-between px-2 pb-2 text-[10px] font-mono font-black text-gray-400 border-b border-gray-800 mb-2">
          <div className="flex items-center gap-1.5 text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
            <span>SPOTIFY CONNECTED</span>
          </div>
          <span>TUGS TUGS</span>
        </div>

        {url ? (
          <iframe
            key={url}
            src={embedSrc}
            width="100%"
            height="352"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-xl shadow-inner bg-black w-full"
            title="YZAM Spotify Player"
          />
        ) : (
          <div className="h-[352px] flex items-center justify-center text-gray-500 font-mono text-sm">
            Paste a Spotify link above to start playing 🎶
          </div>
        )}
      </div>

      {/* ═══ SAVED INDICATOR ═══ */}
      {url && (
        <p className="text-center text-[10px] font-mono text-gray-500 shrink-0">
          💾 Saved link:{' '}
          <span className="text-[#812D45] font-bold">
            {url.length > 55 ? url.slice(0, 55) + '...' : url}
          </span>
        </p>
      )}
    </div>
  );
};

export default SpotifyPlayer;