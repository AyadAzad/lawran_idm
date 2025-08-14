// src/components/common/DownloadItem.jsx
import { motion } from 'framer-motion';
import { Check, AlertTriangle, Download } from 'lucide-react';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

export default function DownloadItem({ download, getStatusStyles, showDownloadButton = true }) {
  const styles = getStatusStyles(download.status);

  return (
    <motion.div layout variants={itemVariants} initial="hidden" animate="visible" exit="exit" className={`rounded-xl border ${styles.border} ${styles.bg} p-4 space-y-3 overflow-hidden`}>
      <div className="flex justify-between items-start">
        <h3 className="font-medium text-gray-200 text-sm truncate pr-4" title={download.filename}>{download.filename}</h3>
        <span className={`px-2 py-1 text-xs font-bold rounded-full ${styles.bg} ${styles.text}`}>{download.status?.toUpperCase()}</span>
      </div>
      {download.active && download.status !== 'error' && (
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>{download.percentage || '0%'}</span>
            <span>{download.downloaded_size || '0 B'} / {download.total_size || '0 B'}</span>
          </div>
          <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden">
            <motion.div className={`h-full rounded-full ${styles.progressBg}`} initial={{ width: '0%' }} animate={{ width: `${download.progress || 0}%` }} transition={{ ease: "linear", duration: 0.2 }} />
          </div>
        </div>
      )}
      {download.status === 'error' && <div className="flex items-center gap-2 text-sm text-red-400"><AlertTriangle size={16} /><span>Error: {download.error}</span></div>}
      {download.status === 'complete' && (
        showDownloadButton ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-between items-center">
            <span className="text-sm text-green-400 flex items-center gap-2"><Check size={16} /> Completed</span>
            <motion.a href={`/downloads/${download.filename}`} download whileHover={{ scale: 1.05, backgroundColor: "#16a34a" }} whileTap={{ scale: 0.95 }} className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-lg text-sm font-semibold"><Download size={16} /> Download</motion.a>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center items-center gap-2 text-sm text-green-400 font-semibold py-1"><Check size={16} /><span>Download Complete</span></motion.div>
        )
      )}
    </motion.div>
  );
}