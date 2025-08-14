import { useState, useEffect, useContext } from 'react';
import { SocketContext } from '../../context/socket';
import { motion, AnimatePresence } from 'framer-motion';
import {ListVideo} from "lucide-react";
// Import the new smaller components
import Header from '../common/Header.jsx';
import PlaylistFetchForm from './PlaylistFetchForm';
import PlaylistConfigForm from './PlaylistConfigForm';
import PlaylistProgress from './PlaylistProgress';

/**
 * Reusable animation variants for staggering item appearance.
 * @type {object}
 */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

/**
 * Renders the main page for downloading YouTube playlists.
 * This component acts as the "controller" that holds all the state and logic,
 * passing props down to its child presentational components.
 */
export default function DownloadPlaylist() {
  // ==================================================================
  // --- CORE LOGIC - UNCHANGED ---
  // ==================================================================
  const socket = useContext(SocketContext);
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState('mp4');
  const [quality, setQuality] = useState('1080p');
  const [numToDownload, setNumToDownload] = useState(5);
  const [playlistInfo, setPlaylistInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [playlistStatus, setPlaylistStatus] = useState('');
  const [currentVideoProgress, setCurrentVideoProgress] = useState(null);
  const [completedVideos, setCompletedVideos] = useState([]);

  useEffect(() => {
    const playlistStatusHandler = (data) => {
      setPlaylistStatus(data.message);
      setCurrentVideoProgress(null);
      if (data.message === "Playlist download complete!") {
          setIsDownloading(false);
      }
    };
    const progressHandler = (data) => {
      if (data.status === 'complete') {
        setCompletedVideos(prev => [...prev, data]);
        setCurrentVideoProgress(null);
      } else {
        setCurrentVideoProgress(data);
      }
    };
    const errorHandler = (error) => {
       setPlaylistStatus(`Error: ${error.error}`);
       setIsDownloading(false);
    };

    socket.on('playlist_status', playlistStatusHandler);
    socket.on('download_progress', progressHandler);
    socket.on('download_error', errorHandler);

    return () => {
      socket.off('playlist_status', playlistStatusHandler);
      socket.off('download_progress', progressHandler);
      socket.off('download_error', errorHandler);
    };
  }, [socket]);

  const handleFetchInfo = async () => {
    if (!url) return;
    setIsLoading(true);
    setPlaylistInfo(null);
    setPlaylistStatus('');
    setCompletedVideos([]);
    try {
      const response = await fetch('/api/playlist/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const result = await response.json();
      if (result.status === 'error') throw new Error(result.message);
      setPlaylistInfo(result);
      setNumToDownload(result.video_count);
    } catch (error) {
      setPlaylistStatus(`Error fetching playlist: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPlaylist = async () => {
    if (!playlistInfo) return;
    setIsDownloading(true);
    setPlaylistStatus('Requesting playlist download...');
    setCompletedVideos([]);
    try {
      await fetch('/api/playlist/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, num_videos: Number(numToDownload), quality, format })
      });
    } catch (error) {
       setPlaylistStatus(`Error starting download: ${error.message}`);
       setIsDownloading(false);
    }
  };

  const isAudioFormat = format === 'mp3' || format === 'm4a';
  // ==================================================================
  // --- END OF CORE LOGIC ---
  // ==================================================================

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-4 sm:p-8">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-3xl mx-auto">
        <Header
            title=" Playlist Power-Downloader"
            subtitle="Download entire YouTube playlists as video or audio."
            icon={<ListVideo size={40}/>}
            gradient="from-rose-400 to-fuchsia-500"
        />

        <PlaylistFetchForm
          url={url}
          setUrl={setUrl}
          handleFetchInfo={handleFetchInfo}
          isLoading={isLoading}
        />

        <AnimatePresence>
          {playlistInfo && (
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

        <AnimatePresence>
          {(isDownloading || completedVideos.length > 0 || (playlistStatus && !playlistInfo)) && (
            <PlaylistProgress
              playlistStatus={playlistStatus}
              currentVideoProgress={currentVideoProgress}
              completedVideos={completedVideos}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}