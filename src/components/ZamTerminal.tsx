import { useState, useRef, useEffect, type KeyboardEvent } from 'react';

interface Line {
  type: 'input' | 'output' | 'system' | 'error' | 'love';
  text: string;
}

const BOOT_LINES: Line[] = [
  { type: 'system', text: 'ZAM-OS Terminal v2.5.1' },
  { type: 'system', text: 'Copyright (c) YZAM Industries. All hearts reserved.' },
  { type: 'system', text: 'Type "help" for available commands.' },
  { type: 'system', text: '' },
];

const KISS_RESPONSES = [
  '💋 *mwah*',
  '🌸 right on the cheek',
  '✨ *soft kiss on forehead*',
  '💖 forever yours',
  '🌠 one for every star in the sky',
];

const HUG_RESPONSES = [
  '🫂 *tight warm hug*',
  '💕 holding you close',
  '🌸 never letting go',
  '✨ you are safe here',
  '🧸 *3-second extra squeeze*',
];

const LOVE_RESPONSES = [
  'I love you Yza 💖',
  'More than yesterday, less than tomorrow 💕',
  'To the moon and back 🌙✨',
  'In every lifetime, I\'d choose you ✨',
  '0b1 1 = you + me 💻❤️',
  'Running love.exe... status: ETERNAL 💞',
];

export default function ZamTerminal() {
  const [history, setHistory] = useState<Line[]>(BOOT_LINES);
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  // Focus input on click anywhere in terminal
  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  const processCommand = (cmd: string) => {
    const cleanCmd = cmd.toLowerCase().trim();
    const args = cleanCmd.split(' ');
    const mainCmd = args[0];

    // Add input to history
    setHistory(prev => [...prev, { type: 'input', text: `zam@yzam:~$ ${cmd}` }]);

    if (cmd.trim()) {
      setCommandHistory(prev => [cmd, ...prev]);
    }
    setHistoryIndex(-1);

    switch (mainCmd) {
      case 'help':
        setHistory(prev => [...prev, { type: 'output', text: 'Available commands: help, clear, love, kiss, hug, status, whoami, yza, date, uptime, echo, ls, sudo love, ping yza, coffee, heart' }]);
        break;
      
      case 'clear':
      case 'cls':
        setHistory([]);
        break;

      case 'love':
        setHistory(prev => [...prev, { type: 'love', text: LOVE_RESPONSES[Math.floor(Math.random() * LOVE_RESPONSES.length)] }]);
        break;

      case 'kiss':
        setHistory(prev => [...prev, { type: 'love', text: KISS_RESPONSES[Math.floor(Math.random() * KISS_RESPONSES.length)] }]);
        break;

      case 'hug':
        setHistory(prev => [...prev, { type: 'love', text: HUG_RESPONSES[Math.floor(Math.random() * HUG_RESPONSES.length)] }]);
        break;

      case 'yza':
        setHistory(prev => [
          ...prev, 
          { type: 'output', text: 'Scanning for Yza...' },
          { type: 'love', text: 'Result: Found 1 beautiful dentist. Probability of love: 1000%' }
        ]);
        break;

      case 'status':
        setHistory(prev => [...prev, { type: 'system', text: 'System: OPTIMAL | Connection: STRONG | Heartbeat: SYNCED' }]);
        break;

      case 'whoami':
        setHistory(prev => [...prev, { type: 'output', text: 'You are Zam, the coolest Computer Engineer in Yza\'s world.' }]);
        break;

      case 'date':
        setHistory(prev => [...prev, { type: 'output', text: new Date().toString() }]);
        break;

      case 'ls':
        setHistory(prev => [...prev, { type: 'output', text: 'Documents/  Photos/  LoveLetters/  SecretProject.sh  yza_smile.png' }]);
        break;

      case 'uptime':
        const start = localStorage.getItem('yzam_install_date_v1') || Date.now();
        const diff = Math.floor((Date.now() - Number(start)) / 1000 / 60 / 60 / 24);
        setHistory(prev => [...prev, { type: 'output', text: `System has been running for ${diff} days of pure happiness.` }]);
        break;

      case 'echo':
        setHistory(prev => [...prev, { type: 'output', text: args.slice(1).join(' ') || 'echo what?' }]);
        break;

      case 'sudo':
        if (args[1] === 'love') {
          setHistory(prev => [...prev, { type: 'love', text: 'Superuser access granted: Loving Yza unconditionally.' }]);
        } else {
          setHistory(prev => [...prev, { type: 'error', text: 'User is not in the sudoers file. This incident will be reported to Yza.' }]);
        }
        break;

      case 'ping':
        if (args[1] === 'yza') {
          setHistory(prev => [...prev, { type: 'output', text: '64 bytes from yza.heart: icmp_seq=1 ttl=64 time=0.001 ms (Always nearby)' }]);
        } else {
          setHistory(prev => [...prev, { type: 'error', text: 'Usage: ping yza' }]);
        }
        break;

      case 'coffee':
        setHistory(prev => [...prev, { type: 'output', text: '☕ Here is your coffee, sir. Don\'t forget to stay hydrated!' }]);
        break;

      case 'heart':
      case 'ascii-heart':
        setHistory(prev => [
          ...prev, 
          { type: 'love', text: '  ❤️   ❤️  ' },
          { type: 'love', text: '❤️      ❤️' },
          { type: 'love', text: ' ❤️    ❤️ ' },
          { type: 'love', text: '   ❤️    ' }
        ]);
        break;

      case 'reboot':
      case 'shutdown':
        setHistory(prev => [...prev, { type: 'system', text: 'Nice try! This system runs on love, it never shuts down.' }]);
        break;

      default:
        if (cleanCmd !== '') {
          setHistory(prev => [...prev, { type: 'error', text: `Command not found: ${mainCmd}. Type "help" for a list of commands.` }]);
        }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      processCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  return (
    <div 
      className="bg-[#1a1a1a] text-[#00ff41] p-4 rounded-lg font-mono text-sm h-64 flex flex-col shadow-retro-sm border-2 border-gray-800 cursor-text overflow-hidden relative"
      onClick={handleTerminalClick}
    >
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-1 scrollbar-hide mb-2"
      >
        {history.map((line, i) => (
          <div 
            key={i} 
            className={`
              ${line.type === 'input' ? 'text-white' : ''}
              ${line.type === 'system' ? 'text-blue-400' : ''}
              ${line.type === 'error' ? 'text-red-400 font-bold' : ''}
              ${line.type === 'love' ? 'text-pink-400' : ''}
              break-words
            `}
          >
            {line.text}
          </div>
        ))}
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-yellow-400 shrink-0">zam@yzam:~$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          className="bg-transparent border-none outline-none flex-1 text-white caret-pink-500 w-full"
          spellCheck={false}
        />
      </div>

      {/* Decorative Scanline */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_2px,3px_100%]" />
    </div>
  );
}