import { useState, useEffect, useContext } from 'react';
import { SocketContext } from '../../context/socket';
import { motion } from 'framer-motion';
import { File, DownloadCloud } from 'lucide-react';
import Header from '../common/Header';
import DownloadFormWrapper from '../common/DownloadFormWrapper';
import URLInput from '../common/ui/URLInput';
import ActionButton from '../common/ui/ActionButton';
import TerminalDisplay from '../common/TerminalDisplay';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };

export default function DownloadDocuments() {
  const socket = useContext(SocketContext);
  const [url, setUrl] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // This page will display logs from ANY download type intercepted by the extension
    const terminalOutputHandler = (data) => setLogs(prev => [...prev, data.line]);
    const downloadCompleteHandler = () => setIsRequesting(false);
    const downloadErrorHandler = () => setIsRequesting(false);

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
    setLogs([]);
    await fetch('/api/download/document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-4 sm:p-8">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-3xl mx-auto">
        <Header
          icon={<File size={40} />}
          title="General Downloader"
          subtitle="Intercepted downloads & manual links appear here."
          gradient="from-gray-400 to-gray-600"
        />
        <DownloadFormWrapper>
          <URLInput
            url={url}
            setUrl={setUrl}
            icon={<File size={20} />}
            placeholder="Manually paste any download link..."
            focusColor="focus:ring-gray-500 focus:border-gray-500"
          />
          <ActionButton
            onClick={handleDownload}
            disabled={!url || isRequesting}
            icon={<DownloadCloud size={20} />}
            gradient="bg-gradient-to-r from-gray-500 to-gray-700"
          >
            {isRequesting ? 'Download in Progress...' : 'Start Manual Download'}
          </ActionButton>
        </DownloadFormWrapper>

        <div className="mt-8">
          <TerminalDisplay logs={logs} />
        </div>
      </motion.div>
    </div>
  );
}