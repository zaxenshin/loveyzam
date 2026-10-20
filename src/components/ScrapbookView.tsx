import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit3, Check, X, Image as ImageIcon, Upload, Link, ZoomIn, Loader2 } from 'lucide-react';
import { playChime, playSparkle, playPlink, playWhoosh } from '../utils/sfx';
import { syncWithCloud, saveToCloud } from '../utils/firebase';

interface Photo {
  id: string;
  url: string;
  caption: string;
  rotation: string;
  date?: string;
  reaction?: string;
}

interface ScrapbookViewProps {
  isEditMode: boolean;
}

const rotations = ['-rotate-3', 'rotate-2', '-rotate-2', 'rotate-3', '-rotate-1', 'rotate-1'];
const storageKey = 'yzam_scrapbook_v1';
const CLOUD_KEY = 'scrapbook';

// 🗜️ AUTOMATIC CANVAS COMPRESSOR (Resizes oversized images to ~200KB to prevent localStorage crash)
const compressImage = (base64Str: string, maxWidth = 1000, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
  });
};

export const ScrapbookView: React.FC<ScrapbookViewProps> = ({ isEditMode }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const skipNextSave = useRef(false);
  const hydrated = useRef(false);

  // SAFE INITIALIZER: Wraps in try-catch so corrupted localStorage won't white-screen the app
  const [photos, setPhotos] = useState<Photo[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error reading localStorage:', e);
    }
    return [
      { id: '1', url: 'https://i.pinimg.com/736x/8e/71/2a/8e712a210515f4e1f7d9c8da4c803dfa.jpg', caption: 'Cute date 🥺', rotation: '-rotate-3', date: '2025.01.15' },
      { id: '2', url: 'https://i.pinimg.com/736x/f6/42/bb/f642bb33ea0614a9ec04523c14c45a7e.jpg', caption: 'Matching! 🌈', rotation: 'rotate-2', date: '2025.02.14' },
      { id: '3', url: 'https://i.pinimg.com/736x/85/3e/2e/853e2e0edc8fcce82315d11516e87f17.jpg', caption: 'Coffee run ☕', rotation: '-rotate-2', date: '2025.03.08' },
    ];
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [addMode, setAddMode] = useState<'url' | 'upload'>('upload');
  const [newUrl, setNewUrl] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newDate, setNewDate] = useState('');
  const [isConverting, setIsConverting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [editDate, setEditDate] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Safe save to localStorage + push to Firebase Cloud
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(photos));
    } catch (e) {
      console.error('Storage quota exceeded:', e);
    }

    if (!hydrated.current) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    saveToCloud(CLOUD_KEY, photos);
  }, [photos]);

  // Initial cloud sync + real-time cloud listener
  useEffect(() => {
    let unsub: (() => void) | void;

    const boot = async () => {
      const local = (() => {
        try {
          const raw = localStorage.getItem(storageKey);
          return raw ? (JSON.parse(raw) as Photo[]) : photos;
        } catch {
          return photos;
        }
      })();

      unsub = await syncWithCloud(CLOUD_KEY, local, (cloudData) => {
        skipNextSave.current = true;
        setPhotos(Array.isArray(cloudData) ? cloudData : []);
      });

      hydrated.current = true;
    };

    boot();

    return () => {
      if (typeof unsub === 'function') unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getToday = () => {
    const d = new Date();
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  const toDisplayDate = (htmlDate: string) => {
    if (!htmlDate) return getToday();
    return htmlDate.replace(/-/g, '.');
  };

  const toHtmlDate = (displayDate?: string) => {
    if (!displayDate) return new Date().toISOString().split('T')[0];
    return displayDate.replace(/\./g, '-');
  };

  // FILE TO BASE64 WITH COMPRESSION
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const compressed = await compressImage(reader.result as string);
        resolve(compressed);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // HEIC CONVERTER + COMPRESSOR
  const processImageFile = async (file: File): Promise<string> => {
    const isHeic = file.name.toLowerCase().endsWith('.heic') || 
                   file.name.toLowerCase().endsWith('.heif') || 
                   file.type.includes('heic') || 
                   file.type.includes('heif');

    if (isHeic) {
      setIsConverting(true);
      try {
        if (!(window as any).heic2any) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/heic2any/dist/heic2any.min.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error('HEIC library load error'));
            document.head.appendChild(script);
          });
        }

        const heic2any = (window as any).heic2any;
        const convertedBlob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.7
        });

        const singleBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async () => {
            const compressed = await compressImage(reader.result as string);
            resolve(compressed);
          };
          reader.onerror = reject;
          reader.readAsDataURL(singleBlob);
        });
      } catch (err) {
        console.warn('HEIC Conversion failed, falling back:', err);
        return fileToBase64(file);
      } finally {
        setIsConverting(false);
      }
    }

    return fileToBase64(file);
  };

  // ADD PHOTO (URL)
  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    const photo: Photo = {
      id: Date.now().toString(),
      url: newUrl.trim(),
      caption: newCaption.trim() || 'Our memory 💕',
      rotation: rotations[photos.length % rotations.length],
      date: newDate ? toDisplayDate(newDate) : getToday(),
    };

    setPhotos(prev => [photo, ...prev]);
    setNewUrl('');
    setNewCaption('');
    setNewDate('');
    setShowAddForm(false);
    playChime();
  };

  // ADD PHOTO (FILE UPLOAD)
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      try {
        const base64 = await processImageFile(file);
        const photo: Photo = {
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          url: base64,
          caption: newCaption.trim() || file.name.replace(/\.[^.]+$/, '') + ' 📸',
          rotation: rotations[photos.length % rotations.length],
          date: newDate ? toDisplayDate(newDate) : getToday(),
        };
        setPhotos(prev => [photo, ...prev]);
        playChime();
      } catch (err) {
        console.error('Upload error:', err);
      }
    }

    setNewCaption('');
    setNewDate('');
    setShowAddForm(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // DRAG & DROP
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (isEditMode) setIsDragging(true);
  }, [isEditMode]);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isEditMode) return;
    await handleFileUpload(e.dataTransfer.files);
  }, [isEditMode, newCaption, newDate]);

  // EDIT
  const startEdit = (photo: Photo) => {
    setEditingId(photo.id);
    setEditCaption(photo.caption);
    setEditDate(toHtmlDate(photo.date));
    playPlink();
  };

  const saveEdit = (id: string) => {
    setPhotos(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, caption: editCaption, date: toDisplayDate(editDate) }
          : p
      )
    );
    setEditingId(null);
    playChime();
  };

  // DELETE
  const confirmDelete = (id: string) => {
    setDeleteConfirmId(id);
    playPlink();
  };

  const executeDelete = () => {
    if (deleteConfirmId) {
      setPhotos(prev => prev.filter(p => p.id !== deleteConfirmId));
      setDeleteConfirmId(null);
      playWhoosh();
    }
  };

  return (
    <div
      className="bg-[#FFF8F1] -m-4 p-5 min-h-[500px] relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      
      {/* DRAG OVERLAY */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-[#F4C2D7]/80 backdrop-blur-sm flex items-center justify-center border-4 border-dashed border-[#812D45] rounded-xl"
          >
            <motion.div
              animate={{ scale: [1, 1.06, 1], y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
              className="text-center"
            >
              <Upload className="w-12 h-12 text-[#812D45] mx-auto mb-2" />
              <p className="font-black text-[#812D45] text-lg">Drop photos here!</p>
              <p className="text-sm text-[#5C233B]/60 font-['VT323']">Release to add to scrapbook 💕</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h3 className="font-bold text-[#812D45] font-mono flex items-center gap-2 bg-white px-4 py-2 rounded-xl border-2 border-[#272426] shadow-retro">
          <ImageIcon className="w-5 h-5 text-[#F4C2D7] fill-current" /> Our Memories
          <motion.span
            key={photos.length}
            initial={{ scale: 1.35 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            className="text-[10px] bg-[#F4C2D7] text-[#5C233B] px-1.5 py-0.5 rounded-full font-bold"
          >
            {photos.length}
          </motion.span>
        </h3>

        {isEditMode && (
          <motion.button
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 450, damping: 20 }}
            onClick={() => {
              setShowAddForm(!showAddForm);
              setNewDate(new Date().toISOString().split('T')[0]);
              playPlink();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#812D45] text-white text-xs font-bold rounded-lg border-2 border-[#272426] shadow-retro-sm hover:bg-[#6B2339] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {showAddForm ? 'Cancel' : 'Add Photo'}
          </motion.button>
        )}
      </div>

      {/* Add Photo Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className="mb-6 relative z-10 overflow-hidden"
          >
            <div className="p-4 bg-white border-2 border-[#812D45] rounded-xl shadow-retro-sm">
              <div className="flex gap-1 mb-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setAddMode('upload'); playPlink(); }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg border-2 transition-all flex items-center justify-center gap-1 ${addMode === 'upload' ? 'bg-[#F4C2D7] border-[#812D45] text-[#5C233B]' : 'bg-gray-50 border-gray-200 text-gray-400'}`}
                >
                  <Upload className="w-3 h-3" /> Upload File
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setAddMode('url'); playPlink(); }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg border-2 transition-all flex items-center justify-center gap-1 ${addMode === 'url' ? 'bg-[#CAF0F8] border-[#0F4C5C] text-[#0F4C5C]' : 'bg-gray-50 border-gray-200 text-gray-400'}`}
                >
                  <Link className="w-3 h-3" /> Paste URL
                </motion.button>
              </div>

              {addMode === 'upload' && (
                <div className="space-y-3">
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => !isConverting && fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#F4C2D7] rounded-xl p-6 text-center cursor-pointer hover:bg-[#FFF5F8] transition-colors group relative"
                  >
                    {isConverting ? (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-8 h-8 text-[#812D45] animate-spin" />
                        <p className="text-xs font-bold text-[#812D45]">Processing & Optimizing Photo... 📱</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-[#F4C2D7] mx-auto mb-2 group-hover:scale-110 transition-transform" />
                        <p className="text-sm font-bold text-[#5C233B]">Click to upload photos</p>
                        <p className="text-[10px] text-gray-400 font-['VT323'] mt-1">JPG, PNG, GIF, HEIC (iPhone) — auto-compressed!</p>
                      </>
                    )}
                  </motion.div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.heic,.heif,.HEIC,.HEIF"
                    multiple
                    className="hidden"
                    onChange={e => handleFileUpload(e.target.files)}
                  />

                  <input
                    type="text"
                    placeholder="Caption (optional) 💕"
                    value={newCaption}
                    onChange={e => setNewCaption(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-black/15 rounded-lg text-sm outline-none focus:border-[#812D45] transition-colors"
                  />

                  <div>
                    <label className="text-[10px] font-bold text-[#812D45] mb-1 block">📅 Memory Date</label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={e => setNewDate(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-black/15 rounded-lg text-sm outline-none focus:border-[#812D45] transition-colors"
                    />
                  </div>
                </div>
              )}

              {addMode === 'url' && (
                <form onSubmit={handleAddUrl} className="space-y-3">
                  <div>
                    <input
                      type="url"
                      placeholder="https://example.com/photo.jpg"
                      value={newUrl}
                      onChange={e => setNewUrl(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-black/15 rounded-lg text-sm outline-none focus:border-[#0F4C5C] transition-colors"
                      required
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Caption (optional) 💕"
                    value={newCaption}
                    onChange={e => setNewCaption(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-black/15 rounded-lg text-sm outline-none focus:border-[#0F4C5C] transition-colors"
                  />
                  <div>
                    <label className="text-[10px] font-bold text-[#0F4C5C] mb-1 block">📅 Memory Date</label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={e => setNewDate(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-black/15 rounded-lg text-sm outline-none focus:border-[#0F4C5C] transition-colors"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    className="w-full py-2 bg-[#812D45] text-white font-bold text-sm rounded-lg border-2 border-[#272426] shadow-retro-sm hover:bg-[#6B2339] transition-colors"
                  >
                    Add to Scrapbook 📸
                  </motion.button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Polaroid Grid */}
      <motion.div layout className="flex flex-wrap justify-center gap-5 relative z-10 pb-6">
        {photos.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 w-full"
          >
            <motion.p
              animate={{ y: [0, -10, 0], rotate: [0, -6, 6, 0] }}
              transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
              className="text-4xl mb-3"
            >
              📷
            </motion.p>
            <p className="text-gray-400 font-mono">No photos yet.</p>
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          {photos.map((photo, index) => (
            <motion.div
              key={photo.id}
              layout
              initial={{ opacity: 0, scale: 0.75, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, rotate: 12, y: -20 }}
              transition={{
                type: 'spring',
                stiffness: 320,
                damping: 22,
                delay: Math.min(index * 0.04, 0.24),
              }}
              whileHover={{ scale: 1.08, rotate: 0, zIndex: 50, y: -8 }}
              whileTap={{ scale: 0.96 }}
              className={`bg-white p-2.5 pb-5 border-2 border-[#272426] shadow-retro flex flex-col items-center ${photo.rotation} cursor-pointer w-[140px] sm:w-[155px] relative group`}
              onClick={() => { if (editingId !== photo.id) { setLightboxPhoto(photo); playSparkle(); } }}
            >
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-9 h-3 bg-yellow-100/90 border border-yellow-200 shadow-sm rotate-2 z-20"></div>

              {photo.reaction && (
                <div className="absolute -top-1 -right-1 z-30 bg-white rounded-full w-6 h-6 flex items-center justify-center border-2 border-[#F4C2D7] shadow-sm text-sm">
                  {photo.reaction}
                </div>
              )}

              <div className="w-full aspect-square bg-gray-200 border border-black/10 overflow-hidden mb-1.5 relative">
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Photo';
                  }}
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ZoomIn className="w-6 h-6 text-white drop-shadow" />
                </div>
              </div>

              {/* 🎯 LARGER & CLEARER DATE TEXT */}
              {photo.date && editingId !== photo.id && (
                <p className="font-['VT323'] text-xs text-gray-500 font-bold mb-0.5 tracking-wider">{photo.date}</p>
              )}

              {editingId === photo.id ? (
                <div className="w-full flex flex-col gap-1" onClick={e => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editCaption}
                    onChange={e => setEditCaption(e.target.value)}
                    className="w-full text-[10px] px-1 py-0.5 border border-[#812D45] rounded text-center outline-none"
                    autoFocus
                    placeholder="Caption"
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(photo.id); if (e.key === 'Escape') setEditingId(null); }}
                  />
                  <input
                    type="date"
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    className="w-full text-[10px] px-1 py-0.5 border border-[#812D45] rounded text-center outline-none"
                  />
                  <div className="flex justify-center gap-1">
                    <motion.button whileTap={{ scale: 0.85 }} onClick={() => saveEdit(photo.id)} className="p-0.5 bg-green-100 rounded hover:bg-green-200 transition-colors">
                      <Check className="w-3 h-3 text-green-700" />
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.85 }} onClick={() => setEditingId(null)} className="p-0.5 bg-red-100 rounded hover:bg-red-200 transition-colors">
                      <X className="w-3 h-3 text-red-600" />
                    </motion.button>
                  </div>
                </div>
              ) : (
                <p className="font-mono text-[10px] font-bold text-[#812D45] text-center leading-tight px-1 line-clamp-2">
                  {photo.caption}
                </p>
              )}

              {isEditMode && editingId !== photo.id && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-30" onClick={e => e.stopPropagation()}>
                  <motion.button
                    whileHover={{ scale: 1.15, y: -2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => startEdit(photo)}
                    className="p-1 bg-white border border-black/20 rounded shadow-sm hover:bg-blue-50 transition-colors"
                  >
                    <Edit3 className="w-3 h-3 text-[#812D45]" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.15, y: -2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => confirmDelete(photo.id)}
                    className="p-1 bg-white border border-black/20 rounded shadow-sm hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </motion.button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Decorative tapes */}
      <div className="absolute top-8 right-4 w-10 h-3.5 bg-pink-200/50 border border-pink-300 rotate-45 z-0 pointer-events-none"></div>
      <div className="absolute bottom-10 left-4 w-10 h-3.5 bg-blue-200/50 border border-blue-300 -rotate-12 z-0 pointer-events-none"></div>

      {/* DELETE CONFIRMATION MODAL - PORTALED */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {deleteConfirmId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setDeleteConfirmId(null)}
            >
              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
                transition={{ type: 'spring', stiffness: 360, damping: 24 }}
                className="bg-white border-4 border-[#812D45] rounded-2xl shadow-[6px_6px_0px_rgba(0,0,0,0.9)] p-6 max-w-xs w-full text-center"
                onClick={e => e.stopPropagation()}
              >
                <p className="text-3xl mb-2">🗑️</p>
                <p className="font-black text-[#5C233B] mb-1">Delete this photo?</p>
                <div className="flex gap-2 mt-4">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setDeleteConfirmId(null); playPlink(); }}
                    className="flex-1 py-2 bg-gray-100 text-gray-600 font-bold text-sm rounded-lg border-2 border-gray-300 hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={executeDelete}
                    className="flex-1 py-2 bg-red-400 text-white font-bold text-sm rounded-lg border-2 border-red-600 shadow-retro-sm hover:bg-red-500 transition-colors"
                  >
                    Delete 💔
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* LIGHTBOX PREVIEW - PORTALED */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {lightboxPhoto && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
              onClick={() => { setLightboxPhoto(null); playPlink(); }}
            >
              <motion.div
                initial={{ scale: 0.7, opacity: 0, rotate: -2 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                className="relative max-w-lg w-full"
                onClick={e => e.stopPropagation()}
              >
                <div className="bg-white p-3 pb-8 shadow-[6px_6px_0px_rgba(0,0,0,0.9)] border-2 border-[#272426]">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-14 h-4 bg-yellow-100/90 border border-yellow-200 shadow-sm rotate-1 z-20"></div>

                  <img
                    src={lightboxPhoto.url}
                    alt={lightboxPhoto.caption}
                    className="w-full rounded"
                  />

                  <div className="mt-3 text-center">
                    <p className="font-mono text-sm font-bold text-[#812D45]">{lightboxPhoto.caption}</p>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      {lightboxPhoto.date && (
                        <p className="font-['VT323'] text-sm text-gray-500 font-bold tracking-wider">📅 {lightboxPhoto.date}</p>
                      )}
                      {lightboxPhoto.reaction && (
                        <p className="text-sm">{lightboxPhoto.reaction}</p>
                      )}
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.15, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { setLightboxPhoto(null); playPlink(); }}
                  className="absolute -top-3 -right-3 w-10 h-10 bg-red-400 text-white rounded-full border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,0.9)] font-black text-lg flex items-center justify-center z-30 cursor-pointer"
                >
                  ✕
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};