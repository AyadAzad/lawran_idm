// src/components/common/DownloadList.jsx
import { motion, AnimatePresence } from 'framer-motion';
import DownloadItem from './DownloadItem';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function DownloadList({ downloads, getStatusStyles, showDownloadButton, emptyMessage }) {
  return (
    <motion.div variants={itemVariants} className="mt-10">
      <h2 className="text-xl font-semibold mb-4">Downloads</h2>
      <div className="space-y-4">
        <AnimatePresence>
          {downloads.map((download) => (
            <DownloadItem key={download.id} download={download} getStatusStyles={getStatusStyles} showDownloadButton={showDownloadButton} />
          ))}
        </AnimatePresence>
        {!downloads.length && <p className="text-center text-gray-500 py-4">{emptyMessage}</p>}
      </div>
    </motion.div>
  );
}