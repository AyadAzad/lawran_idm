import { motion } from 'framer-motion';
import { Search, Loader } from 'lucide-react';

/**
 * Reusable animation variants for staggering item appearance.
 * @type {object}
 */
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

/**
 * Renders the initial form for fetching playlist information.
 * @param {object} props - The component props.
 * @param {string} props.url - The current URL value from state.
 * @param {Function} props.setUrl - The state setter for the URL.
 * @param {Function} props.handleFetchInfo - The function to call when the fetch button is clicked.
 * @param {boolean} props.isLoading - A boolean indicating if the fetching process is active.
 * @returns {JSX.Element}
 */
export default function PlaylistFetchForm({ url, setUrl, handleFetchInfo, isLoading }) {
  return (
    <motion.div variants={itemVariants} className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 mb-6 shadow-2xl shadow-black/20">
      <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter YouTube Playlist URL"
          className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-rose-500 transition-all"
        />
        <motion.button
          onClick={handleFetchInfo}
          disabled={isLoading || !url}
          className="w-full sm:w-auto px-6 py-3 rounded-lg text-white font-bold bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          whileHover={{scale: 1.05}}
          whileTap={{scale: 0.95}}
        >
          <span className="flex items-center justify-center gap-2">
            {isLoading ? <Loader className="animate-spin" size={20}/> : <Search size={20} />}
            {isLoading ? 'Fetching...' : 'Fetch Info'}
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
}