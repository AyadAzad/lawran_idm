import { useState, useEffect, useContext } from 'react';
import { SocketContext } from '../../context/socket';
import { motion } from 'framer-motion';
import { Sparkles, MonitorUp, DownloadCloud } from 'lucide-react';

// Import reusable components
import Header from '../common/Header';
import DownloadFormWrapper from '../common/DownloadFormWrapper';
import ActionButton from '../common/ui/ActionButton';
import URLInput from '../common/ui/URLInput';
import TerminalDisplay from '../common/TerminalDisplay'; // <-- IMPORT THE TERMINAL COMPONENT

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };

export default function Download4K() {
  const socket = useContext(SocketContext);
  const [url, setUrl] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [logs, setLogs] = useState([]); // <-- NEW STATE FOR LOGS, REPLACES 'downloads'

  // Effect to set up and tear down Socket.IO event listeners
  useEffect(() => {
    const terminalOutputHandler = (data) => {
      setLogs(prev => [...prev, data.line]);
    };

    const downloadCompleteHandler = () => {
      setIsRequesting(false); // Re-enable button on success
    };

    const downloadErrorHandler = (error) => {
      console.error("Download error:", error);
      setIsRequesting(false); // Re-enable button on error
    };

    // Listen to the new events from our refactored backend
    socket.on('terminal_output', terminalOutputHandler);
    socket.on('download_complete', downloadCompleteHandler);
    socket.on('download_error', downloadErrorHandler);

    return () => {
      socket.off('terminal_output', terminalOutputHandler);
      socket.off('download_complete', downloadCompleteHandler);
      socket.off('download_error', downloadErrorHandler);
    };
  }, [socket]);

  // Handles the download button click event
  const handleDownload = async () => {
    if (!url || isRequesting) return;
    setIsRequesting(true);
    setLogs([]); // Clear previous logs for the new download
    await fetch('/api/download/4k', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-4 sm:p-8">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-3xl mx-auto">
        <Header
          icon={<Sparkles size={40} />}
          title="UltraHD Downloader"
          subtitle="Download videos in stunning 4K and 8K resolution."
          gradient="from-amber-400 to-orange-500"
        />
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

        {/* Replace the old download list with the new terminal display */}
        <div className="mt-8">
          <TerminalDisplay logs={logs} />
        </div>

      </motion.div>
    </div>
  );
}