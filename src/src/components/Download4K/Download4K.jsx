// src/components/Download4K/index.jsx

import { useState, useEffect, useContext } from 'react';
import { SocketContext } from '../../context/socket';
import { motion } from 'framer-motion';
import { Sparkles, MonitorUp, DownloadCloud } from 'lucide-react';

// Import reusable components
import Header from '../common/Header';
import DownloadFormWrapper from '../common/DownloadFormWrapper';
import DownloadList from '../common/DownloadList';
import ActionButton from '../common/ui/ActionButton';
import URLInput from '../common/ui/URLInput';

/**
 * Animation variants for the main container to stagger the appearance of child elements.
 */
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };

/**
 * Renders the dedicated page for downloading 4K YouTube videos.
 * This component manages the state for the URL input, the list of active downloads,
 * and the overall download request status. It uses reusable child components to
 * build the UI.
 */
export default function Download4K() {
  // Access the shared socket instance from the context.
  const socket = useContext(SocketContext);

  // --- Component State ---
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} State for the YouTube URL input field. */
  const [url, setUrl] = useState('');
  /** @type {[Array<object>, React.Dispatch<React.SetStateAction<Array<object>>>]} State for the list of current and completed downloads. */
  const [downloads, setDownloads] = useState([]);
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} State to track if a download is actively in progress to disable the UI. */
  const [isRequesting, setIsRequesting] = useState(false);

  /**
   * Effect to determine if any download is currently active.
   * This is used to disable the main download button to prevent multiple simultaneous requests.
   */
  useEffect(() => {
    const isAnyActiveDownload = downloads.some(d => d.active !== false && d.status !== 'error');
    setIsRequesting(isAnyActiveDownload);
  }, [downloads]);

  /**
   * Effect to set up and tear down Socket.IO event listeners for download progress and errors.
   */
  useEffect(() => {
    const progressHandler = (data) => {
      setDownloads(prev => {
        const newDownload = { ...data, id: data.filename + Date.now() }; // Add a unique ID for animation keys
        const existingIndex = prev.findIndex(d => d.filename === data.filename);
        if (existingIndex >= 0) {
          const newDownloads = [...prev];
          newDownloads[existingIndex] = { ...newDownloads[existingIndex], ...data };
          return newDownloads;
        }
        return [...prev, newDownload];
      });
    };
    const errorHandler = (error) => {
      setIsRequesting(false);
      setDownloads(prev => [...prev, { filename: error.filename || "4K Download", status: 'error', error: error.error, active: true, id: (error.filename || "4K Download") + Date.now() }]);
    };

    socket.on('download_progress', progressHandler);
    socket.on('download_error', errorHandler);

    return () => {
      socket.off('download_progress', progressHandler);
      socket.off('download_error', errorHandler);
    };
  }, [socket]);

  /**
   * Effect to periodically clean up completed or inactive downloads from the list.
   */
  useEffect(() => {
    const interval = setInterval(() => { setDownloads(current => current.filter(d => d.active !== false)); }, 5000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Handles the download button click event.
   * Sends a request to the backend API to start the 4K download process.
   */
  const handleDownload = async () => {
    if (!url || isRequesting) return;
    setIsRequesting(true);
    await fetch('/api/download/4k', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
  };

  /**
   * A utility function to determine the Tailwind CSS classes for a download item
   * based on its current status.
   * @param {string} status - The current status of the download (e.g., 'complete', 'error').
   * @returns {object} An object with Tailwind class strings for styling.
   */
  const getStatusStyles = (status) => {
    switch (status) {
      case 'complete': return { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30', progressBg: 'bg-green-500' };
      case 'error': return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', progressBg: 'bg-red-500' };
      case 'merging files...': return { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', progressBg: 'bg-purple-500' };
      case 'downloading':
      case 'starting':
        return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', progressBg: 'bg-amber-500' };
      default: return { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30', progressBg: 'bg-gray-500' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-4 sm:p-8">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-3xl mx-auto">
        {/* Page Header */}
        <Header
          icon={<Sparkles size={40} />}
          title="UltraHD Downloader"
          subtitle="Download videos in stunning 4K and 8K resolution."
          gradient="from-amber-400 to-orange-500"
        />
        {/* Form for URL input and download button */}
        <DownloadFormWrapper>
          <URLInput
            url={url}
            setUrl={setUrl}
            icon={<MonitorUp size={20} />}
            placeholder="Paste a 4K-compatible YouTube URL..."
            focusColor="focus:ring-amber-500 focus:border-amber-500"
          />
          <ActionButton
            onClick={handleDownload}
            disabled={!url || isRequesting}
            icon={<DownloadCloud size={20} />}
            gradient="bg-gradient-to-r from-amber-400 to-orange-500"
          >
            {isRequesting ? 'Download in Progress...' : 'Download in 4K'}
          </ActionButton>
        </DownloadFormWrapper>
        {/* List of active and completed downloads */}
        <DownloadList
          downloads={downloads}
          getStatusStyles={getStatusStyles}
          showDownloadButton={true}
          emptyMessage="Your 4K downloads will appear here."
        />
      </motion.div>
    </div>
  );
}