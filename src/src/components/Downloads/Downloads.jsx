import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader, ServerCrash, Inbox, Video, Music, Play } from 'lucide-react';

// Import the player modals directly, as DownloadCard is no longer used
import CustomVideoPlayer from './CustomVideoPlayer';
import AudioPlayerModal from './AudioPlayerModal';

// --- Reusable Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export default function Downloads() {
  // ==================================================================
  // --- YOUR EXISTING LOGIC - UNCHANGED ---
  // ==================================================================
  const [downloads, setDownloads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playingFile, setPlayingFile] = useState(null);

  useEffect(() => {
    const fetchDownloads = async () => {
      try {
        const response = await fetch('/api/downloads/list');
        if (!response.ok) throw new Error("Server connection failed.");
        const data = await response.json();
        setDownloads(data);
      } catch (err) { setError(err.message); }
      finally { setIsLoading(false); }
    };
    fetchDownloads();
  }, []);
  // ==================================================================
  // --- END OF YOUR LOGIC ---
  // ==================================================================

  return (
    <>
      <div className="min-h-screen bg-gray-900 text-white font-sans p-4 sm:p-8">
        <motion.div initial="hidden" animate="visible" className="w-full max-w-4xl mx-auto">
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-gray-200 via-gray-400 to-gray-600 text-transparent bg-clip-text">The Vault</h1>
            <p className="text-gray-400 mt-2">Your collection of downloaded media. Click any item to play.</p>
          </motion.div>

          {/* Loading, Error, and Empty State Handlers (Unchanged) */}
          {isLoading && (<motion.div variants={itemVariants} className="flex flex-col items-center gap-4 py-20 text-gray-500"><Loader className="animate-spin" size={40} /><p>Loading your collection...</p></motion.div>)}
          {error && (<motion.div variants={itemVariants} className="flex flex-col items-center gap-4 py-20 text-red-400"><ServerCrash size={40} /><p>Error: {error}</p></motion.div>)}
          {!isLoading && !error && downloads.length === 0 && (<motion.div variants={itemVariants} className="flex flex-col items-center gap-4 py-20 text-gray-500"><Inbox size={40} /><p>Your vault is empty. Download some files to see them here!</p></motion.div>)}

          {/* --- THE NEW, ELEGANT PLAYABLE LIST --- */}
          {!isLoading && !error && downloads.length > 0 && (
            <motion.div variants={containerVariants} className="space-y-3">
              <AnimatePresence>
                {downloads.map((download) => {
                  const theme = download.type === 'video'
                    ? { icon: <Video />, color: 'text-cyan-400', hoverBorder: 'hover:border-cyan-500/50' }
                    : { icon: <Music />, color: 'text-emerald-400', hoverBorder: 'hover:border-emerald-500/50' };

                  return (
                    <motion.div
                      key={download.id}
                      variants={itemVariants}
                      layout
                      onClick={() => setPlayingFile(download)}
                      className={`group flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-xl cursor-pointer transition-all duration-300 ${theme.hoverBorder} hover:bg-gray-800`}
                    >
                      <div className="flex items-center gap-4 overflow-hidden">
                        <span className={theme.color}>{theme.icon}</span>
                        <p className="font-medium text-gray-200 truncate">{download.filename}</p>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500 transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:text-white">
                        <span className="text-sm">Play</span>
                        <Play size={20} />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* The Player Modal (Unchanged Logic) */}
      <AnimatePresence>
        {playingFile && (
          playingFile.type === 'video'
            ? <CustomVideoPlayer file={playingFile} onClose={() => setPlayingFile(null)} />
            : <AudioPlayerModal file={playingFile} onClose={() => setPlayingFile(null)} />
        )}
      </AnimatePresence>
    </>
  );
}