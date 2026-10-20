import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Stats {
  uptime: string;
  photos: number;
  tasksTotal: number;
  tasksDone: number;
  letters: number;
  lettersOpened: number;
  events: number;
  profileTabsYza: number;
  profileTabsZam: number;
  moodYza: string;
  moodZam: string;
  moodSync: number;
  spotifySet: boolean;
}

// Hash a string to a number 0-100 for mood sync calculation
const hashMood = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % 101;
};

const INSTALL_DATE_KEY = 'yzam_install_date_v1';

export default function SystemStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [ramUsage, setRamUsage] = useState(42);
  const [cpuUsage, setCpuUsage] = useState(67);
  const [blinkDot, setBlinkDot] = useState(true);

  // Initialize install date if missing
  useEffect(() => {
    if (!localStorage.getItem(INSTALL_DATE_KEY)) {
      localStorage.setItem(INSTALL_DATE_KEY, Date.now().toString());
    }
  }, []);

  // Compute stats
  const computeStats = (): Stats => {
    // Uptime (days since install)
    const installTs = parseInt(localStorage.getItem(INSTALL_DATE_KEY) || Date.now().toString(), 10);
    const diffMs = Date.now() - installTs;
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);

    // Photos (scrapbook)
    let photos = 0;
    try {
      const sb = localStorage.getItem('yzam_scrapbook_v1');
      if (sb) photos = JSON.parse(sb).length || 0;
    } catch {}

    // Tasks
    let tasksTotal = 0;
    let tasksDone = 0;
    try {
      const tasks = localStorage.getItem('yzam_tasks_final_v3');
      if (tasks) {
        const arr = JSON.parse(tasks);
        tasksTotal = arr.length;
        tasksDone = arr.filter((t: any) => t.completed || t.done).length;
      }
    } catch {}

    // Letters
    let letters = 0;
    let lettersOpened = 0;
    try {
      const l = localStorage.getItem('yzam_open_when_letters_v1');
      if (l) {
        const arr = JSON.parse(l);
        letters = arr.length;
        lettersOpened = arr.filter((x: any) => x.isOpened).length;
      }
    } catch {}

    // Calendar events
    let events = 0;
    try {
      const cal = localStorage.getItem('yzam_schedule_calendar_v5');
      if (cal) {
        const data = JSON.parse(cal);
        if (Array.isArray(data)) {
          events = data.length;
        } else if (typeof data === 'object') {
          events = Object.values(data).reduce(
            (acc: number, arr: any) => acc + (Array.isArray(arr) ? arr.length : 0),
            0
          );
        }
      }
    } catch {}

    // Profile tabs
    let profileTabsYza = 0;
    let profileTabsZam = 0;
    let moodYza = 'unknown';
    let moodZam = 'unknown';
    try {
      const py = localStorage.getItem('yzam_profile_v7_Yza');
      if (py) {
        const d = JSON.parse(py);
        profileTabsYza = d.tabs?.length || 0;
        moodYza = d.mood || 'unknown';
      }
    } catch {}
    try {
      const pz = localStorage.getItem('yzam_profile_v7_Zam');
      if (pz) {
        const d = JSON.parse(pz);
        profileTabsZam = d.tabs?.length || 0;
        moodZam = d.mood || 'unknown';
      }
    } catch {}

    // Mood sync (fun calculation)
    const hy = hashMood(moodYza);
    const hz = hashMood(moodZam);
    const diff = Math.abs(hy - hz);
    const moodSync = Math.max(60, 100 - diff); // Always >= 60% para cute

    // Spotify
    const spotifySet = !!localStorage.getItem('yzam_spotify_url_v1');

    return {
      uptime: `${days}d ${hours}h`,
      photos,
      tasksTotal,
      tasksDone,
      letters,
      lettersOpened,
      events,
      profileTabsYza,
      profileTabsZam,
      moodYza,
      moodZam,
      moodSync,
      spotifySet,
    };
  };

  // Initial + refresh every 5s
  useEffect(() => {
    setStats(computeStats());
    const interval = setInterval(() => setStats(computeStats()), 5000);
    return () => clearInterval(interval);
  }, []);

  // Simulated RAM/CPU wobble
  useEffect(() => {
    const interval = setInterval(() => {
      setRamUsage((v) => Math.max(30, Math.min(85, v + (Math.random() - 0.5) * 10)));
      setCpuUsage((v) => Math.max(40, Math.min(95, v + (Math.random() - 0.5) * 15)));
      setBlinkDot((b) => !b);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return null;

  const taskProgress = stats.tasksTotal > 0 ? (stats.tasksDone / stats.tasksTotal) * 100 : 0;
  const letterProgress = stats.letters > 0 ? (stats.lettersOpened / stats.letters) * 100 : 0;

  const StatRow = ({
    label,
    value,
    color = 'text-[#CAF0F8]',
  }: {
    label: string;
    value: string | number;
    color?: string;
  }) => (
    <div className="flex items-center justify-between font-mono text-[11px] py-1 border-b border-gray-800">
      <span className="text-gray-400">{label}</span>
      <span className={`${color} font-bold`}>{value}</span>
    </div>
  );

  const ProgressBar = ({
    label,
    value,
    max,
    color = '#CAF0F8',
  }: {
    label: string;
    value: number;
    max: number;
    color?: string;
  }) => {
    const pct = max > 0 ? (value / max) * 100 : 0;
    const barLen = 20;
    const filled = Math.round((pct / 100) * barLen);
    const bar = '█'.repeat(filled) + '░'.repeat(barLen - filled);
    return (
      <div className="font-mono text-[10px] py-1">
        <div className="flex justify-between text-gray-400 mb-0.5">
          <span>{label}</span>
          <span>{Math.round(pct)}%</span>
        </div>
        <div className="text-[9px] tracking-tight" style={{ color }}>
          {bar}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3 h-full overflow-y-auto">
      {/* Header */}
      <div className="bg-[#1a1a1a] border-2 border-[#812D45] rounded-xl p-3 shadow-retro-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <span className="font-mono text-[10px] font-black text-[#CAF0F8] uppercase tracking-widest">
              YZAM TASK MANAGER
            </span>
          </div>
          <span className="font-mono text-[9px] text-gray-500">v2.5.1</span>
        </div>
        <div className="mt-1 font-mono text-[9px] text-gray-600">
          Processes • Performance • Love Metrics
        </div>
      </div>

      {/* Processes */}
      <div className="bg-[#0a0a0a] border-2 border-[#812D45]/60 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] font-bold text-[#F4C2D7] uppercase">
            Processes
          </span>
          <span className="font-mono text-[9px] text-gray-500 flex items-center gap-1">
            <span className={blinkDot ? 'opacity-100' : 'opacity-30'}>●</span> live
          </span>
        </div>

        <StatRow label="UPTIME.SYS" value={stats.uptime} />
        <StatRow label="PHOTOS.EXE" value={`${stats.photos} memories`} color="text-[#F4C2D7]" />
        <StatRow label="TASKS.DLL" value={`${stats.tasksDone}/${stats.tasksTotal} done`} color="text-[#D6A16C]" />
        <StatRow label="LETTERS.LOG" value={`${stats.letters} written`} color="text-[#F4C2D7]" />
        <StatRow label="EVENTS.SYS" value={`${stats.events} scheduled`} color="text-[#CAF0F8]" />
        <StatRow
          label="SPOTIFY.DRV"
          value={stats.spotifySet ? 'CONNECTED' : 'NOT SET'}
          color={stats.spotifySet ? 'text-green-400' : 'text-red-400'}
        />
        <StatRow label="YZA.PROFILE" value={`${stats.profileTabsYza} tabs`} />
        <StatRow label="ZAM.PROFILE" value={`${stats.profileTabsZam} tabs`} />
      </div>

      {/* Performance */}
      <div className="bg-[#0a0a0a] border-2 border-[#812D45]/60 rounded-xl p-3 space-y-2">
        <span className="font-mono text-[10px] font-bold text-[#F4C2D7] uppercase block mb-1">
          Performance
        </span>

        <ProgressBar label="TASK PROGRESS" value={stats.tasksDone} max={stats.tasksTotal || 1} color="#D6A16C" />
        <ProgressBar label="LETTERS OPENED" value={stats.lettersOpened} max={stats.letters || 1} color="#F4C2D7" />

        {/* Fun fake system meters */}
        <div className="font-mono text-[10px] py-1">
          <div className="flex justify-between text-gray-400 mb-0.5">
            <span>LOVE.RAM</span>
            <motion.span
              key={ramUsage}
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 1 }}
            >
              {Math.round(ramUsage)}% / 💕GB
            </motion.span>
          </div>
          <motion.div
            animate={{ width: `${ramUsage}%` }}
            transition={{ duration: 1 }}
            className="h-2 bg-gradient-to-r from-[#F4C2D7] to-[#812D45] rounded"
          />
        </div>

        <div className="font-mono text-[10px] py-1">
          <div className="flex justify-between text-gray-400 mb-0.5">
            <span>HEART.CPU</span>
            <motion.span key={cpuUsage}>
              {Math.round(cpuUsage)}% ❤️
            </motion.span>
          </div>
          <motion.div
            animate={{ width: `${cpuUsage}%` }}
            transition={{ duration: 1 }}
            className="h-2 bg-gradient-to-r from-[#CAF0F8] to-[#812D45] rounded"
          />
        </div>
      </div>

      {/* Mood Sync */}
      <div className="bg-gradient-to-br from-[#812D45] to-[#5C233B] border-2 border-[#F4C2D7] rounded-xl p-3 text-white">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] font-black uppercase tracking-widest text-[#F4C2D7]">
            💕 Mood Sync
          </span>
          <span className="font-mono text-xl font-black text-white">
            {stats.moodSync}%
          </span>
        </div>

        {/* Sync bar */}
        <div className="h-3 bg-black/40 rounded-full overflow-hidden border border-[#F4C2D7]/40">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stats.moodSync}%` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-[#F4C2D7] via-[#D6A16C] to-[#CAF0F8]"
          />
        </div>

        <div className="mt-2 font-mono text-[9px] text-[#F4C2D7]/80 space-y-0.5">
          <div className="truncate">
            <span className="text-[#CAF0F8]">YZA →</span> {stats.moodYza}
          </div>
          <div className="truncate">
            <span className="text-[#D6A16C]">ZAM →</span> {stats.moodZam}
          </div>
        </div>

        <div className="mt-2 text-center font-mono text-[9px] text-white/60 italic">
          {stats.moodSync >= 90
            ? '✨ perfectly in sync ✨'
            : stats.moodSync >= 75
              ? '💕 vibing together'
              : '🫂 always connected'}
        </div>
      </div>

      {/* Footer status */}
      <div className="bg-[#1a1a1a] border border-[#812D45]/40 rounded px-3 py-1.5 font-mono text-[9px] text-gray-500 flex items-center justify-between">
        <span>SYSTEM: HEALTHY ✓</span>
        <span>{new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
}