import { motion, AnimatePresence } from 'framer-motion';
import { DownloadCloud, Loader, ChevronDown } from 'lucide-react';

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
 * Renders the configuration form after playlist info has been fetched.
 * Allows the user to select the number of items, format, and quality.
 * @param {object} props - The component props.
 * @returns {JSX.Element}
 */
export default function PlaylistConfigForm(props) {
  const {
    playlistInfo,
    numToDownload, setNumToDownload,
    format, setFormat,
    quality, setQuality,
    isAudioFormat,
    handleDownloadPlaylist, isDownloading
  } = props;

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="visible" exit="exit" className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 mb-6 shadow-2xl shadow-black/20">
      <h2 className="text-xl font-bold mb-2">{playlistInfo.title}</h2>
      <p className="text-gray-400 mb-4">{playlistInfo.video_count} items found in this playlist.</p>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Items to Download</label>
          <input type="number" value={numToDownload} onChange={(e) => setNumToDownload(e.target.value)} min="1" max={playlistInfo.video_count} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white"/>
        </div>
        <div className="relative">
          <label className="block text-sm font-medium text-gray-400 mb-1">Download As</label>
          <ChevronDown className="absolute right-3 bottom-3 text-gray-500 pointer-events-none" size={20} />
          <select value={format} onChange={(e) => setFormat(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 appearance-none text-white">
            <option value="mp4">Video (MP4)</option>
            <option value="mp3">Audio (MP3)</option>
          </select>
        </div>
      </div>

      <AnimatePresence>
      {!isAudioFormat && (
        <motion.div initial={{height: 0, opacity: 0}} animate={{height: 'auto', opacity: 1}} exit={{height: 0, opacity: 0}} className="mb-4 overflow-hidden">
          <label className="block text-sm font-medium text-gray-400 mb-1">Video Quality</label>
           <div className="relative">
            <ChevronDown className="absolute right-3 bottom-3 text-gray-500 pointer-events-none" size={20} />
            <select value={quality} onChange={(e) => setQuality(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 appearance-none text-white">
              <option value="1080p">1080p (Full HD)</option>
              <option value="720p">720p (HD)</option>
              <option value="480p">480p (Standard)</option>
              <option value="360p">360p</option>
            </select>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      <motion.button onClick={handleDownloadPlaylist} disabled={isDownloading} className="relative w-full p-3 rounded-lg text-white font-bold overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-700" whileHover={{scale: 1.02}} whileTap={{scale: 0.98}}>
         <span className="relative z-10 flex items-center justify-center gap-2">
            {isDownloading ? <Loader className="animate-spin" size={20}/> : <DownloadCloud size={20} />}
            {isDownloading ? 'Downloading...' : `Download ${numToDownload} Items`}
         </span>
         {!isDownloading && (
             <motion.div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-fuchsia-600" initial={{x: "-100%"}} animate={{x: "0%"}} transition={{duration: 0.5, ease: "easeInOut"}}/>
         )}
      </motion.button>
    </motion.div>
  );
}