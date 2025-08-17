// src/components/DownloadPlaylist/DownloadPlaylist.jsx

import { useState, useEffect, useContext } from 'react';
import { SocketContext } from '../../context/socket';
import { motion, AnimatePresence } from 'framer-motion';
import { ListVideo } from "lucide-react";
import Header from '../common/Header.jsx';
import PlaylistFetchForm from './PlaylistFetchForm';
import PlaylistConfigForm from './PlaylistConfigForm';
import TerminalDisplay from '../common/TerminalDisplay'; // <-- IMPORT THE TERMINAL

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

export default function DownloadPlaylist() {
  const socket = useContext(SocketContext);
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState('mp4');
  const [quality, setQuality] = useState('1080p');
  const [numToDownload, setNumToDownload] = useState(1);
  const [playlistInfo, setPlaylistInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]); // <-- STATE FOR TERMINAL

  useEffect(() => {
    const terminalOutputHandler = (data) => setLogs(prev => [...prev, data.line]);
    const downloadCompleteHandler = () => setIsDownloading(false);
    const downloadErrorHandler = (err) => {
      setError(err.error);
      setIsDownloading(false);
    };

    socket.on('terminal_output', terminalOutputHandler);
    socket.on('download_complete', downloadCompleteHandler);
    socket.on('download_error', downloadErrorHandler);

    return () => {
      socket.off('terminal_output', terminalOutputHandler);
      socket.off('download_complete', downloadCompleteHandler);
      socket.off('download_error', downloadErrorHandler);
    };
  }, [socket]);

  const handleFetchInfo = async () => {
    if (!url) return;
    setIsLoading(true);
    setPlaylistInfo(null);
    setError('');
    try {
      const response = await fetch('/api/playlist/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const result = await response.json();
      if (result.status === 'error') throw new Error(result.message);
      setPlaylistInfo(result);
      setNumToDownload(result.video_count); // Default to all
    } catch (err) {
      setError(`Error fetching playlist: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPlaylist = async () => {
    if (!playlistInfo) return;
    setIsDownloading(true);
    setLogs([]); // Clear logs for new download
    setError('');
    await fetch('/api/playlist/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, num_videos: Number(numToDownload), quality, format })
    });
  };

  const isAudioFormat = format === 'mp3' || format === 'm4a';

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-4 sm:p-8">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-3xl mx-auto">
        <Header
          title="Playlist Power-Downloader"
          subtitle="Download entire YouTube playlists as video or audio."
          icon={<ListVideo size={40} />}
          gradient="from-rose-400 to-fuchsia-500"
        />

        {/* Step 1: Fetch Form (only show if not downloading) */}
        {!isDownloading && (
          <PlaylistFetchForm
            url={url}
            setUrl={setUrl}
            handleFetchInfo={handleFetchInfo}
            isLoading={isLoading}
          />
        )}

        {/* Display fetch error if any */}
        {error && !isDownloading && (
            <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="bg-red-500/10 text-red-400 p-4 rounded-lg text-center mb-6">
                {error}
            </motion.div>
        )}

        {/* Step 2: Config Form (only show if info is fetched and not downloading) */}
        <AnimatePresence>
          {playlistInfo && !isDownloading && (
            <PlaylistConfigForm
              playlistInfo={playlistInfo}
              numToDownload={numToDownload}
              setNumToDownload={setNumToDownload}
              format={format}
              setFormat={setFormat}
              quality={quality}
              setQuality={setQuality}
              isAudioFormat={isAudioFormat}
              handleDownloadPlaylist={handleDownloadPlaylist}
              isDownloading={isDownloading}
            />
          )}
        </AnimatePresence>

        {/* Step 3: Terminal Display (only show when a download is active) */}
        <AnimatePresence>
          {isDownloading && (
            <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
                <h2 className="text-xl font-semibold mb-4">Download Progress</h2>
                <TerminalDisplay logs={logs} />
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
}