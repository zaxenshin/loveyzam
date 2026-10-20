import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

const FACTS: { text: string; type: 'fact' | 'pun' }[] = [
  { text: "Octopuses have beaks instead of teeth. Imagine trying to floss that! 🐙", type: "fact" },
  { text: "Snails can have over 25,000 teeth on their tongue. Snail dentists must be exhausted. 🐌", type: "fact" },
  { text: "Tooth enamel is the hardest substance in the human body. Stronger than bone! 💎", type: "fact" },
  { text: "Sharks lose up to 30,000 teeth in their lifetime. They just grow new ones. Show-offs. 🦈", type: "fact" },
  { text: "You produce about 1 liter of saliva per day. That's a whole bottle of water! 💧", type: "fact" },
  { text: "Babies start developing teeth while still in the womb. Tiny tooth buds! 👶", type: "fact" },
  { text: "The average person spends ~38.5 DAYS of their life brushing their teeth. 🪥", type: "fact" },
  { text: "Elephants' tusks are actually their incisor teeth. Giant front teeth! 🐘", type: "fact" },
  { text: "A knocked-out tooth can be saved if you put it in milk. Dental first aid! 🥛", type: "fact" },
  { text: "Giraffes have no upper front teeth. They just vibe without them. 🦒", type: "fact" },
  { text: "Dolphins only get ONE set of teeth for life. No second chances, Flipper! 🐬", type: "fact" },
  { text: "The first toothbrush was invented in 1498 in China using pig hair. Cozy. 🐷", type: "fact" },
  { text: "Ancient Egyptians used crushed eggshells and ox hooves as toothpaste. 🥚", type: "fact" },
  { text: "Your teeth are as unique as your fingerprints. Dental identity! 🔍", type: "fact" },
  { text: "The average human bite force is about 70 pounds. Don't test it. 💪", type: "fact" },
  { text: "Horses' teeth never stop growing. That's why they need to chew hay all day. 🐴", type: "fact" },
  { text: "I'm floss-omely in love with you, Yza! 🦷💕", type: "pun" },
  { text: "You've got a great smile — don't take it for granite! (enamel, actually) 😄", type: "pun" },
  { text: "Brushing up on my love for you every single day~ 🪥✨", type: "pun" },
  { text: "You're the crown jewel of my life. (Dental crown, obviously.) 👑", type: "pun" },
  { text: "Our love has zero cavities. Absolutely perfect. 💕", type: "pun" },
  { text: "You fill me with happiness! ...Like a composite filling. 😂", type: "pun" },
  { text: "Let's stick together like braces on day one. 🔗", type: "pun" },
  { text: "You're the reason I smile — literally, I'm a dentist. It's my job. 😏", type: "pun" },
  { text: "Our love is like a root canal — deep, intense, and totally worth it. ❤️", type: "pun" },
];

function getDailyFact(): { text: string; type: 'fact' | 'pun'; index: number } {
  const today = new Date().toISOString().split('T')[0];
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = (hash << 5) - hash + today.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % FACTS.length;
  return { ...FACTS[index], index };
}

export default function ToothOfTheDay() {
  const [flipped, setFlipped] = useState(false);
  const daily = useMemo(() => getDailyFact(), []);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] font-black text-[#0F4C5C] uppercase tracking-wider">
          🦷 Tooth of the Day
        </span>
        <span className="font-mono text-[9px] text-[#0F4C5C]/50 italic">
          {daily.type === 'pun' ? '🎭 pun mode' : '🧠 fact mode'}
        </span>
      </div>

      <motion.div
        className="relative bg-[#F4FCFE] border-2 border-[#0F4C5C] rounded-xl
          shadow-retro-sm p-3 cursor-pointer select-none overflow-hidden"
        onClick={() => setFlipped(!flipped)}
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.985 }}
      >
        <div className="absolute top-2 right-2 flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#CAF0F8]" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#F4C2D7]" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#0F4C5C]/30" />
        </div>

        <div className="flex items-start gap-3">
          <motion.div
            animate={flipped ? { rotateY: 180, scale: 1.1 } : { rotateY: 0, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-3xl shrink-0 mt-0.5"
            style={{ filter: 'drop-shadow(2px 2px 0px #0F4C5C)' }}
          >
            🦷
          </motion.div>

          <div className="flex-1 min-w-0">
            <motion.p
              key={flipped ? 'b' : 'a'}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-sans text-[13px] text-[#272426] leading-relaxed"
            >
              {flipped
                ? "Yza, you have the prettiest smile in the whole universe. That's not a fact or a pun — it's just true. 💕"
                : daily.text}
            </motion.p>

            <p className="font-mono text-[9px] text-[#0F4C5C]/40 mt-1.5">
              {flipped ? "← tap to see today's fact" : 'tap for a surprise →'}
            </p>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-dashed border-[#0F4C5C]/20 flex items-center justify-between">
          <span className="font-mono text-[9px] text-[#0F4C5C]/40">
            📅 {new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
          </span>
          <span className="font-mono text-[9px] text-[#0F4C5C]/40">
            #{daily.index + 1}/{FACTS.length}
          </span>
        </div>
      </motion.div>
    </div>
  );
}