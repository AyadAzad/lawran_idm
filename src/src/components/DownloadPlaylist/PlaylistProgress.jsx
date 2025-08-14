import { motion, AnimatePresence } from 'framer-motion';
import { Download } from 'lucide-react';

/**
 * Reusable animation variants for staggering item appearance.
 * @type {object}
 */
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.3 } },
};

/**
 * A sub-component to display the progress of the currently downloading item.
 * @param {object} props - The component props.
 * @param {object} props.download - The progress data object for the current item.
 * @returns {JSX.Element}
 */
const CurrentDownloadItem = ({ download }) => (
  <motion.div
    variants={itemVariants} initial="hidden" animate="visible" exit="exit"
    className="bg-gray-800/50 backdrop-blur-xl border-2 border-rose-500/50 rounded-xl p-4 space-y-3"
  >
    <div className="flex justify-between items-start">
      <h3 className="font-medium text-gray-200 text-sm truncate pr-4" title={download.filename}>
        {download.filename}
      </h3>
      <span className="px-2 py-1 text-xs font-bold rounded-full bg-rose-500/10 text-rose-400">
        {download.status?.toUpperCase()}
      </span>
    </div>
    <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-rose-500"
        initial={{ width: '0%' }}
        animate={{ width: `${download.progress || 0}%` }}
        transition={{ ease: "linear", duration: 0.2 }}
      />
    </div>
    <div className="flex justify-between text-xs text-gray-400">
      <span>{download.percentage}</span>
      <span>{download.download_speed}</span>
    </div>
  </motion.div>
);

/**
 * A sub-component to display a completed item in the list.
 * @param {object} props - The component props.
 * @param {object} props.download - The data object for the completed item.
 * @returns {JSX.Element}
 */
const CompletedItem = ({ download }) => (
  <motion.div
    layout variants={itemVariants} initial="hidden" animate="visible" exit="exit"
    className="bg-green-500/10 p-3 rounded-lg flex justify-between items-center"
  >
    <span className="truncate text-sm text-green-300" title={download.filename}>
      {download.filename}
    </span>
    <motion.a
      href={`/downloads/${download.filename}`} download
      whileHover={{ scale: 1.05, backgroundColor: "#16a34a" }} whileTap={{ scale: 0.95 }}
      className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-semibold"
    >
      <Download size={14} />
    </motion.a>
  </motion.div>
);

/**
 * Renders the entire progress section for the playlist download.
 * @param {object} props - The component props.
 * @returns {JSX.Element}
 */
export default function PlaylistProgress({ playlistStatus, currentVideoProgress, completedVideos }) {
  return (
    <motion.div variants={itemVariants} className="space-y-4">
      <h2 className="text-xl font-semibold">Download Status</h2>
      {playlistStatus && (
        <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded-lg text-center font-semibold text-gray-300">
          <p>{playlistStatus}</p>
        </div>
      )}
      {currentVideoProgress && <CurrentDownloadItem download={currentVideoProgress} />}
      {completedVideos.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Completed ({completedVideos.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <AnimatePresence>
              {completedVideos.map(d => <CompletedItem key={d.filename} download={d} />)}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
  );
}