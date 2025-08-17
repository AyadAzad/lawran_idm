// src/components/DownloadVideo/index.jsx

import { useState, useEffect, useContext } from 'react';
import { SocketContext } from '../../context/socket';
import { motion } from 'framer-motion';
import { Video, DownloadCloud } from 'lucide-react';

// Import reusable components
import Header from '../common/Header';
import DownloadFormWrapper from '../common/DownloadFormWrapper';
import ActionButton from '../common/ui/ActionButton';
import SelectInput from '../common/ui/SelectInput';
import URLInput from '../common/ui/URLInput';
import TerminalDisplay from '../common/TerminalDisplay'; // <-- IMPORT THE NEW COMPONENT

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };

export default function DownloadVideo() {
  const socket = useContext(SocketContext);
  const [url, setUrl] = useState('');
  const [quality, setQuality] = useState('1080p');
  const [isRequesting, setIsRequesting] = useState(false);
  const [logs, setLogs] = useState([]); // <-- NEW STATE FOR TERMINAL LOGS

  useEffect(() => {
    const terminalOutputHandler = (data) => {
      setLogs(prev => [...prev, data.line]);
    };

    const downloadCompleteHandler = () => {
      setIsRequesting(false); // Re-enable the button
    };

    const downloadErrorHandler = (error) => {
      console.error("Download error:", error);
      setIsRequesting(false); // Re-enable the button on error
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

  const handleDownload = async () => {
    if (!url || isRequesting) return;
    setIsRequesting(true);
    setLogs([]); // <-- CLEAR LOGS FOR NEW DOWNLOAD
    await fetch('/api/download/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, quality })
    });
  };

  const qualityOptions = [
    { value: '1080p', label: '1080p (Full HD)' },
    { value: '720p', label: '720p (HD)' },
    { value: '480p', label: '480p (Standard)' },
    { value: '360p', label: '360p' },
    { value: '240p', label: '240p' },
    { value: '144p', label: '144p' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-4 sm:p-8">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-3xl mx-auto">
        <Header
          icon={<Video size={40} />}
          title="Legendary Video Downloader"
          subtitle="Download any YouTube video with style and speed."
          gradient="from-cyan-400 to-violet-500"
        />
        <DownloadFormWrapper>
          <URLInput
            url={url}
            setUrl={setUrl}
            icon={<Video size={20} />}
            placeholder="Paste YouTube URL here..."
            focusColor="focus:ring-cyan-500 focus:border-cyan-500"
          />
          <SelectInput
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            options={qualityOptions}
            focusColor="focus:ring-cyan-500 focus:border-cyan-500"
          />
          <ActionButton
            onClick={handleDownload}
            disabled={!url || isRequesting}
            icon={<DownloadCloud size={20} />}
            gradient="bg-gradient-to-r from-cyan-400 to-violet-500"
          >
            {isRequesting ? 'Download in Progress...' : 'Start Download'}
          </ActionButton>
        </DownloadFormWrapper>

        {/* List of active and completed downloads */}
        <div className="mt-8">
          <TerminalDisplay logs={logs} /> {/* <-- REPLACE DOWNLOAD LIST WITH TERMINAL */}
        </div>

      </motion.div>
    </div>
  );
}