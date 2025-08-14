// src/components/common/ui/ActionButton.jsx
import { motion } from 'framer-motion';
import { Loader } from 'lucide-react';

export default function ActionButton({ onClick, disabled, icon, children, gradient }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className="relative w-full p-3 rounded-lg text-white font-bold overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-700"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {disabled ? <Loader className="animate-spin" size={20}/> : icon}
        {children}
      </span>
      {!disabled && (
        <motion.div
          className={`absolute inset-0 ${gradient}`}
          initial={{ x: "-100%" }}
          animate={{ x: "0%" }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      )}
    </motion.button>
  );
}