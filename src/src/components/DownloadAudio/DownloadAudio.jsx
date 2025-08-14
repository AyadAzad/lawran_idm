// src/components/DownloadAudio/index.jsx

import { useState, useEffect, useContext } from 'react';
import { SocketContext } from '../../context/socket';
import { motion } from 'framer-motion';
import { Music, DownloadCloud, FileAudio } from 'lucide-react';

// Import reusable components
import Header from '../common/Header';
import DownloadFormWrapper from '../common/DownloadFormWrapper';
import DownloadList from '../common/DownloadList';
import ActionButton from '../common/ui/ActionButton';
import SelectInput from '../common/ui/SelectInput';
import URLInput from '../common/ui/URLInput';

/**
 * Animation variants for the main container to stagger the appearance of child elements.
 */
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };

/**
 * Renders the dedicated page for downloading audio from YouTube videos.
 * This component manages state for the URL input, audio format, and the list of active downloads.
 * It is built using reusable child components for a clean and maintainable structure.
 */
export default function DownloadAudio() {
  // Access the shared socket instance from the context.
  const socket = useContext(SocketContext);

  // --- Component State ---
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} State for the YouTube URL input field. */
  const [url, setUrl] = useState('');
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} State for the selected audio format ('mp3' or 'm4a'). */
  const [format, setFormat] = useState('mp3');
  /** @type {[Array<object>, React.Dispatch<React.SetStateAction<Array<object>>>]} State for the list of current downloads. */
  const [downloads, setDownloads] = useState([]);
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} State to track if a download is active to disable the UI. */
  const [isRequesting, setIsRequesting] = useState(false);

  /**
   * Effect to determine if any download is currently active, used to disable the download button.
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
        const newDownload = { ...data, id: data.filename + Date.now() };
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
      setDownloads(prev => [...prev, { filename: error.filename, status: 'error', error: error.error, active: true, id: error.filename + Date.now() }]);
    };

    socket.on('download_progress', progressHandler);
    socket.on('download_error', errorHandler);

    return () => {
      socket.off('download_progress', progressHandler);
      socket.off('download_error', errorHandler);
    };
  }, [socket]);

  /**
   * Effect to periodically clean up completed or inactive downloads from the view.
   */
  useEffect(() => {
    const interval = setInterval(() => { setDownloads(current => current.filter(d => d.active !== false)); }, 5000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Handles the download button click event.
   * Sends a request to the backend API to start the audio download process.
   */
  const handleDownload = async () => {
    if (!url || isRequesting) return;
    setIsRequesting(true);
    await fetch('/api/download/audio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, format }) });
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
      case 'converting...': return { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30', progressBg: 'bg-yellow-500' };
      case 'downloading':
      case 'starting':
        return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', progressBg: 'bg-emerald-500' };
      default: return { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30', progressBg: 'bg-gray-500' };
    }
  };

  /**
   * Options for the audio format selector.
   */
  const formatOptions = [
    { value: 'mp3', label: 'MP3 (Best Compatibility)' },
    { value: 'm4a', label: 'M4A (Best Quality)' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-4 sm:p-8">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-3xl mx-auto">
        {/* Page Header */}
        <Header
          icon={<Music size={40} />}
          title="Sonic Ripper"
          subtitle="Extract high-quality audio from any YouTube video."
          gradient="from-emerald-400 to-teal-500"
        />
        {/* Form for URL input, format selection, and download button */}
        <DownloadFormWrapper>
          <URLInput
            url={url}
            setUrl={setUrl}
            icon={<FileAudio size={20} />}
            placeholder="Paste YouTube URL here..."
            focusColor="focus:ring-emerald-500 focus:border-emerald-500"
          />
          <SelectInput
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            options={formatOptions}
            focusColor="focus:ring-emerald-500 focus:border-emerald-500"
          />
          <ActionButton
            onClick={handleDownload}
            disabled={!url || isRequesting}
            icon={<DownloadCloud size={20} />}
            gradient="bg-gradient-to-r from-emerald-400 to-teal-500"
          >
            {isRequesting ? 'Download in Progress...' : 'Extract Audio'}
          </ActionButton>
        </DownloadFormWrapper>
        {/* List of active and completed downloads */}
        <DownloadList
          downloads={downloads}
          getStatusStyles={getStatusStyles}
          showDownloadButton={true}
          emptyMessage="Your audio rips will appear here."
        />
      </motion.div>
    </div>
  );
}