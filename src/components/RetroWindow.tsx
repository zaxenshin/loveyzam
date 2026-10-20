import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { playSparkle, playWhoosh } from '../utils/sfx';

interface RetroWindowProps {
  id?: string;
  title: string;
  icon?: string;
  children: React.ReactNode;
  variant?: 'her' | 'your' | 'shared';
  tabs?: string[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onClose?: () => void;
  className?: string;
}

export const RetroWindow: React.FC<RetroWindowProps> = ({
  id,
  title,
  icon = '📁',
  children,
  variant = 'her',
  tabs,
  activeTab,
  onTabChange,
  onClose,
  className = '',
}) => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!isMaximized) return;

    const scrollY = window.scrollY;
    const body = document.body;
    const prev = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      paddingRight: body.style.paddingRight,
    };
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      body.style.overflow = prev.overflow;
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      body.style.paddingRight = prev.paddingRight;
      window.scrollTo(0, scrollY);
    };
  }, [isMaximized]);

  const themeStyles = {
    her: {
      bg: 'bg-[#F4FCFE]',
      border: 'border-[#272426]',
      header: 'bg-[#CAF0F8]',
      text: 'text-[#0F4C5C]',
      tabActive: 'bg-[#F4FCFE] text-[#0F4C5C] border-[#272426]',
      tabInactive: 'bg-[#CAF0F8]/60 text-[#0F4C5C] hover:bg-[#CAF0F8]',
    },
    your: {
      bg: 'bg-white',
      border: 'border-[#812D45]',
      header: 'bg-[#812D45]',
      text: 'text-white',
      tabActive: 'bg-white text-[#812D45] border-[#812D45]',
      tabInactive: 'bg-[#6B463C]/80 text-white/80 hover:bg-[#6B463C]',
    },
    shared: {
      bg: 'bg-[#FFF5F8]',
      border: 'border-[#272426]',
      header: 'bg-[#F4C2D7]',
      text: 'text-[#5C233B]',
      tabActive: 'bg-[#FFF5F8] text-[#812D45] border-[#272426]',
      tabInactive: 'bg-[#F4C2D7]/50 text-[#5C233B] hover:bg-[#F4C2D7]',
    },
  };

  const currentTheme = themeStyles[variant];

  const toggleMaximize = (e: React.MouseEvent) => {
    e.stopPropagation();
    playWhoosh();
    setIsMaximized((v) => !v);
  };

  const windowInner = (
    <>
      <div
        className={`sticky top-0 z-10 flex items-center justify-between px-3 py-2.5 border-b-2 ${currentTheme.border} ${currentTheme.header} select-none shrink-0 shadow-sm`}
        onClick={() => playSparkle()}
      >
        <div className="flex items-center gap-2 overflow-hidden pr-2">
          <span className="text-lg sm:text-xl shrink-0">{icon}</span>
          <span
            className={`font-mono text-sm sm:text-base font-black uppercase tracking-wider truncate ${currentTheme.text}`}
          >
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <motion.button
            type="button"
            whileHover={{ scale: 1.12, y: -1 }}
            whileTap={{ scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            onClick={toggleMaximize}
            className="w-8 h-8 flex items-center justify-center bg-white border-2 border-[#272426] rounded-lg text-black font-black text-base hover:bg-gray-200 shadow-retro-sm cursor-pointer"
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? '❐' : '▢'}
          </motion.button>

          {onClose && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.12, y: -1 }}
              whileTap={{ scale: 0.88 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              onClick={(e) => {
                e.stopPropagation();
                playWhoosh();
                if (isMaximized) setIsMaximized(false);
                onClose();
              }}
              className="w-8 h-8 flex items-center justify-center bg-[#B83B4B] border-2 border-[#272426] rounded-lg text-white font-black text-base hover:bg-red-600 shadow-retro-sm cursor-pointer"
              title="Close"
            >
              ✕
            </motion.button>
          )}
        </div>
      </div>

      {tabs && tabs.length > 0 && (
        <div className="flex px-2 pt-2 gap-1 border-b-2 border-black/10 bg-black/5 overflow-x-auto shrink-0">
          {tabs.map((tab) => (
            <motion.button
              key={tab}
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              onClick={() => {
                playSparkle();
                onTabChange?.(tab);
              }}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-mono font-black rounded-t-md border-t-2 border-x-2 whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? `${currentTheme.tabActive} -mb-[2px] pb-[8px] z-10`
                  : currentTheme.tabInactive
              }`}
            >
              {tab}
            </motion.button>
          ))}
        </div>
      )}

      <div
        className={`p-4 flex-1 min-h-0 overflow-y-auto ${
          isMaximized ? 'h-full' : 'max-h-[75vh]'
        }`}
      >
        {children}
      </div>
    </>
  );

  // ═══ MAXIMIZED — portal sa body + smooth spring ═══
  if (isMaximized) {
    return (
      <>
        <div className={`relative w-full min-h-[140px] ${className}`} aria-hidden="true" />

        {createPortal(
          <AnimatePresence>
            <motion.div
              key="max-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[200] flex flex-col pointer-events-auto"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-[#272426]/60 backdrop-blur-[2px]"
                onClick={() => {
                  playWhoosh();
                  setIsMaximized(false);
                }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 16 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                className={`relative z-10 flex flex-col flex-1 mx-2 mt-14 mb-12 sm:mx-3 sm:mt-16 sm:mb-14 rounded-t-xl rounded-b-lg border-2 ${currentTheme.border} ${currentTheme.bg} shadow-2xl overflow-hidden`}
                style={{ maxHeight: 'calc(100vh - 7.5rem)' }}
              >
                {windowInner}
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
      </>
    );
  }

  // ═══ NORMAL — PLAIN DIV, NO motion/transform (para di ma-trap ang modals) ═══
  return (
    <div
      className={`flex flex-col rounded-t-xl rounded-b-lg border-2 ${currentTheme.border} ${currentTheme.bg} shadow-retro overflow-hidden relative w-full min-w-0 z-0 ${className}`}
    >
      {windowInner}
    </div>
  );
};