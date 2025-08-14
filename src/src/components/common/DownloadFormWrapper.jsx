// src/components/common/DownloadFormWrapper.jsx
import { motion } from 'framer-motion';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function DownloadFormWrapper({ children }) {
  return (
    <motion.div
      variants={itemVariants}
      className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 shadow-2xl shadow-black/20"
    >
      <div className="space-y-4">{children}</div>
    </motion.div>
  );
}