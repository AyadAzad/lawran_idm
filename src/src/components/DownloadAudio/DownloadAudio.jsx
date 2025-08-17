// src/components/DownloadAudio/index.jsx

import { useState, useEffect, useContext } from 'react';
import { SocketContext } from '../../context/socket';
import { motion } from 'framer-motion';
import { Music, DownloadCloud, FileAudio } from 'lucide-react';

// Import reusable components
import Header from '../common/Header';
import DownloadFormWrapper from '../common/DownloadFormWrapper';
import ActionButton from '../common/ui/ActionButton';
import SelectInput from '../common/ui/SelectInput';
import URLInput from '../common/ui/URLInput';
import TerminalDisplay from '../common/TerminalDisplay'; // <-- IMPORT THE TERMINAL COMPONENT

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };

export default function DownloadAudio() {
  const socket = useContext(SocketContext);
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState('mp3');
  const [isRequesting, setIsRequesting] = useState(false);
  const [logs, setLogs] = useState([]); // <-- NEW STATE FOR LOGS, REPLACES 'downloads'

  // Effect to set up and tear down Socket.IO event listeners
  useEffect(() => {
    const terminalOutputHandler = (data) => {
      setLogs(prev => [...prev, data.line]);
    };

    const downloadCompleteHandler = () => {
      setIsRequesting(false); // Re-enable the button on success
    };

    const downloadErrorHandler = (error) => {
      console.error("Download error:", error);
      setIsRequesting(false); // Re-enable the button on error
    };

    // Listen to the new events from our backend
    socket.on('terminal_output', terminalOutputHandler);
    socket.on('download_complete', downloadCompleteHandler);
    socket.on('download_error', downloadErrorHandler);

    return () => {
      socket.off('terminal_output', terminalOutputHandler);
      socket.off('download_complete', downloadCompleteHandler);
      socket.off('download_error', downloadErrorHandler);
    };
  }, [socket]);

  // Handles the download button click event.
  const handleDownload = async () => {
    if (!url || isRequesting) return;
    setIsRequesting(true);
    setLogs([]); // Clear logs for the new download
    await fetch('/api/download/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, format })
    });
  };

  const formatOptions = [
    { value: 'mp3', label: 'MP3 (Best Compatibility)' },
    { value: 'm4a', label: 'M4A (Best Quality)' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-4 sm:p-8">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-3xl mx-auto">
        <Header
          icon={<Music size={40} />}
          title="Sonic Ripper"
          subtitle="Extract high-quality audio from any YouTube video."
          gradient="from-emerald-400 to-teal-500"
        />
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
            {isRequesting ? 'Extraction in Progress...' : 'Extract Audio'}
          </ActionButton>
        </DownloadFormWrapper>

        {/* Replace the old download list with our new terminal display */}
        <div className="mt-8">
          <TerminalDisplay logs={logs} />
        </div>

      </motion.div>
    </div>
  );
}