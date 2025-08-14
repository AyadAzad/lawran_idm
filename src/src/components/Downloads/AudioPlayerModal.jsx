import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function AudioPlayerModal({ file, onClose }) {
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
        className="relative w-full max-w-md bg-gray-800/80 border border-gray-700 rounded-2xl p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-center font-bold text-xl text-white mb-6 truncate">{file.filename}</h3>
        <audio src={`/downloads/${file.filename}`} controls autoPlay className="w-full" />
      </motion.div>
    </motion.div>
  );
}