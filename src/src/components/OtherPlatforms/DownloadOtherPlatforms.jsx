import { useState, useEffect, useContext } from 'react';
import { SocketContext } from '../../context/socket';
import { motion, AnimatePresence } from 'framer-motion';

// Import reusable components
import Header from '../common/Header';
import DownloadFormWrapper from '../common/DownloadFormWrapper';
import ActionButton from '../common/ui/ActionButton';
import URLInput from '../common/ui/URLInput';
import TerminalDisplay from '../common/TerminalDisplay';

// Modern SVG Icons (custom optimized)
const SocialIcons = {
  Instagram: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  ),
  Twitter: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
    </svg>
  ),
  YouTube: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
  TikTok: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  ),
  Facebook: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z"/>
    </svg>
  ),
  Globe: () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Download: () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  Layers: () => (
    <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  )
};

export default function OtherPlatforms() {
  const socket = useContext(SocketContext);
  const [url, setUrl] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [lastCompletedFile, setLastCompletedFile] = useState(null);
  const [activePlatform, setActivePlatform] = useState(null);

  const platforms = [
    { name: 'Instagram', icon: <SocialIcons.Instagram />, color: 'from-pink-500 to-purple-600' },
    { name: 'Twitter', icon: <SocialIcons.Twitter />, color: 'from-blue-400 to-blue-600' },
    { name: 'YouTube', icon: <SocialIcons.YouTube />, color: 'from-red-500 to-red-700' },
    { name: 'TikTok', icon: <SocialIcons.TikTok />, color: 'from-black to-pink-500' },
    { name: 'Facebook', icon: <SocialIcons.Facebook />, color: 'from-blue-600 to-blue-800' }
  ];

  useEffect(() => {
    const terminalHandler = (data) => {
      setLogs(prevLogs => [...prevLogs, data.line]);

      // Detect platform from logs
      platforms.forEach(platform => {
        if (data.line.toLowerCase().includes(platform.name.toLowerCase())) {
          setActivePlatform(platform);
        }
      });
    };

    const completeHandler = (data) => {
      setIsDownloading(false);
      setLastCompletedFile(data.filename);
    };

    const errorHandler = () => {
      setIsDownloading(false);
      setActivePlatform(null);
    };

    socket.on('terminal_output', terminalHandler);
    socket.on('download_complete', completeHandler);
    socket.on('download_error', errorHandler);

    return () => {
      socket.off('terminal_output', terminalHandler);
      socket.off('download_complete', completeHandler);
      socket.off('download_error', errorHandler);
    };
  }, [socket]);

  const handleDownload = async () => {
    if (!url || isDownloading) return;
    setIsDownloading(true);
    setLogs([]);
    setLastCompletedFile(null);
    setActivePlatform(null);
    await fetch('/api/download/other', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 10
      }
    }
  };

  const platformIconVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 200,
        damping: 15
      }
    },
    hover: {
      scale: 1.1,
      transition: { duration: 0.2 }
    },
    active: {
      scale: 1.05,
      boxShadow: '0 0 0 3px rgba(255,255,255,0.5)'
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white font-sans p-4 sm:p-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-4xl mx-auto"
      >
        {/* Header with enhanced animation */}
        <motion.div variants={itemVariants}>
          <Header
            icon={<SocialIcons.Layers className="text-purple-400" />}
            title="Universal Media Grabber"
            subtitle="Download media from hundreds of websites in the best quality"
            gradient="from-indigo-500 via-purple-500 to-pink-500"
          />
        </motion.div>

        {/* Platform Icons Grid */}
        <motion.div
          variants={itemVariants}
          className="my-8"
        >
          <div className="flex justify-center gap-4 flex-wrap">
            {platforms.map((platform) => (
              <motion.button
                key={platform.name}
                variants={platformIconVariants}
                whileHover="hover"
                animate={activePlatform?.name === platform.name ? "active" : ""}
                className={`w-16 h-16 rounded-xl bg-gradient-to-r ${platform.color} flex items-center justify-center cursor-pointer shadow-lg transition-all duration-200 ${activePlatform?.name === platform.name ? 'ring-2 ring-white ring-offset-4 ring-offset-gray-800 scale-105' : ''}`}
                onClick={() => setActivePlatform(activePlatform?.name === platform.name ? null : platform)}
                aria-label={`Download from ${platform.name}`}
              >
                {platform.icon}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Download Form */}
        <motion.div variants={itemVariants}>
          <DownloadFormWrapper>
            <URLInput
              url={url}
              setUrl={setUrl}
              icon={<SocialIcons.Globe className="text-indigo-300" />}
              placeholder="Paste any media URL (TikTok, Instagram, Twitter, etc.)..."
              focusColor="focus:ring-indigo-500 focus:border-indigo-500"
            />
            <ActionButton
              onClick={handleDownload}
              disabled={!url || isDownloading}
              icon={<SocialIcons.Download />}
              gradient="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isDownloading ? (
                <motion.span
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  Downloading...
                </motion.span>
              ) : (
                'Grab Media'
              )}
            </ActionButton>
          </DownloadFormWrapper>
        </motion.div>

        {/* Terminal Display */}
        <motion.div
          variants={itemVariants}
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <TerminalDisplay logs={logs} />
        </motion.div>

        {/* Success message */}
        <AnimatePresence>
          {lastCompletedFile && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { type: 'spring', stiffness: 300 }
              }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mt-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center backdrop-blur-sm"
            >
              <div className="flex items-center mb-2 sm:mb-0">
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 0],
                    transition: { duration: 0.6 }
                  }}
                  className="mr-3"
                >
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </motion.div>
                <span className="text-green-300 font-semibold">Download successful!</span>
              </div>
              <motion.a
                href={`/downloads/${lastCompletedFile}`}
                download
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold text-sm flex items-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <SocialIcons.Download className="mr-2" />
                Download File
              </motion.a>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}