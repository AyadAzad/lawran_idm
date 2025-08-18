// src/components/common/TerminalDisplay.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import 'xterm/css/xterm.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal as TerminalIcon,
  Zap,
  Code2,
  Cpu,
  Server,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Download,
  Rocket
} from 'lucide-react';

const TerminalDisplay = ({ logs }) => {
  const terminalRef = useRef(null);
  const termInstance = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState('terminal');
  const [glowColor, setGlowColor] = useState('from-purple-500 to-blue-500');

  // Rotate glow colors
  useEffect(() => {
    const colors = [
      'from-purple-500 to-blue-500',
      'from-pink-500 to-rose-500',
      'from-emerald-500 to-teal-500',
      'from-amber-500 to-orange-500',
      'from-violet-500 to-fuchsia-500'
    ];

    const interval = setInterval(() => {
      setGlowColor(colors[Math.floor(Math.random() * colors.length)]);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Initialize terminal
  useEffect(() => {
    if (terminalRef.current && !termInstance.current) {
      const term = new Terminal({
        cursorBlink: true,
        convertEol: true,
        theme: {
          background: 'transparent',
          foreground: '#e0e0e0',
          cursor: 'rgba(255, 255, 255, 0.7)',
          black: '#32344a',
          red: '#ff7b72',
          green: '#7ee787',
          yellow: '#ffa657',
          blue: '#79c0ff',
          magenta: '#d2a8ff',
          cyan: '#a5d6ff',
          white: '#c9d1d9',
        },
        fontSize: 14,
        fontFamily: '"Fira Code", monospace',
        rows: 18,
        letterSpacing: 0.8,
        fontWeight: 400,
      });

      term.open(terminalRef.current);
      termInstance.current = term;
      setIsInitialized(true);

      // Initial welcome message
      setTimeout(() => {
        term.writeln('\x1b[1;36m⚡ Welcome to the Legendary Terminal\x1b[0m\r\n');
        term.writeln('\x1b[1;33m➜\x1b[0m Type \x1b[1;32mhelp\x1b[0m to see available commands\r\n');
      }, 500);
    }

    return () => {
      if (termInstance.current) {
        termInstance.current.dispose();
        termInstance.current = null;
      }
    };
  }, []);

  // Handle logs updates
  useEffect(() => {
    if (termInstance.current && logs.length > 0) {
      const lastLog = logs[logs.length - 1];
      termInstance.current.write(lastLog);
    }
  }, [logs]);

  // Clear terminal when empty
  useEffect(() => {
    if (termInstance.current && logs.length === 0) {
      termInstance.current.clear();
      termInstance.current.writeln('\x1b[1;32m✓\x1b[0m Terminal ready. Awaiting commands...\r\n');
      termInstance.current.writeln('\x1b[1;33m➜\x1b[0m Try \x1b[1;36mdownload\x1b[0m to start the magic\r\n');
    }
  }, [logs.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative w-full max-w-4xl mx-auto"
    >
      {/* Floating decorations */}
      <AnimatePresence>
        {isHovered && (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute -top-3 -left-3"
            >
              <Sparkles className="text-yellow-400 w-5 h-5" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="absolute -bottom-3 -right-3"
            >
              <Zap className="text-blue-400 w-5 h-5" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Terminal header */}
      <motion.div
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className={`relative z-10 flex items-center justify-between p-3 rounded-t-xl bg-gradient-to-r ${glowColor} bg-opacity-20 border-b border-white/10 backdrop-blur-sm`}
      >
        <div className="flex items-center space-x-2">
          <div className="flex space-x-2">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-3 h-3 rounded-full bg-red-500 cursor-pointer"
            />
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-3 h-3 rounded-full bg-yellow-500 cursor-pointer"
            />
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-3 h-3 rounded-full bg-green-500 cursor-pointer"
            />
          </div>

          <motion.div
            className="flex items-center px-3 py-1 ml-2 space-x-2 text-xs rounded-full bg-black/30 text-white/80"
            whileHover={{ scale: 1.05 }}
          >
            <TerminalIcon className="w-4 h-4 text-emerald-400" />
            <span>Lawran-terminal</span>
          </motion.div>
        </div>

        <div className="flex items-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center px-3 py-1 text-xs rounded-full transition-all ${activeTab === 'terminal' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}
            onClick={() => setActiveTab('terminal')}
          >
            <Code2 className="w-4 h-4 mr-1" />
            Terminal
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center px-3 py-1 text-xs rounded-full transition-all ${activeTab === 'server' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}
            onClick={() => setActiveTab('server')}
          >
            <Server className="w-4 h-4 mr-1" />
            Server
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center px-3 py-1 text-xs rounded-full transition-all ${activeTab === 'system' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}
            onClick={() => setActiveTab('system')}
          >
            <Cpu className="w-4 h-4 mr-1" />
            System
          </motion.button>
        </div>
      </motion.div>

      {/* Terminal body */}
      <motion.div
        className="relative overflow-hidden rounded-b-xl bg-gray-900/80 backdrop-blur-sm"
        initial={{ height: 0 }}
        animate={{ height: 'auto' }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Status bar */}
        <div className="flex items-center justify-between px-4 py-2 text-xs text-white/60 bg-black/20 border-b border-white/5">
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{ rotate: isInitialized ? 0 : 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className={`flex items-center ${isInitialized ? 'text-green-400' : 'text-amber-400'}`}
            >
              {isInitialized ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <Loader2 className="w-3 h-3 animate-spin" />
              )}
              <span className="ml-1">{isInitialized ? 'Connected' : 'Connecting...'}</span>
            </motion.div>

            <div className="flex items-center text-blue-400">
              <Download className="w-3 h-3" />
              <span className="ml-1">Ready for download</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center text-purple-400">
              <Rocket className="w-3 h-3" />
              <span className="ml-1">Turbo Mode</span>
            </div>
            <div className="w-px h-3 bg-white/20"></div>
            <div className="flex items-center">
              <span>v3.1.4</span>
            </div>
          </div>
        </div>

        {/* Actual terminal */}
        <div
          ref={terminalRef}
          className="w-full p-4 h-80 font-mono"
        />

        {/* Floating command prompt */}
        <AnimatePresence>
          {logs.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute bottom-4 left-4 flex items-center px-3 py-2 text-sm rounded-lg bg-white/5 backdrop-blur-sm"
            >
              <span className="text-green-400">➜</span>
              <span className="ml-2 text-white/80">See Download progress here...</span>
              <motion.div
                className="ml-2 w-2 h-5 bg-white/80"
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Subtle floating particles */}
      <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/5"
            initial={{
              x: Math.random() * 100,
              y: Math.random() * 100,
              width: Math.random() * 4 + 1,
              height: Math.random() * 4 + 1,
            }}
            animate={{
              y: [0, Math.random() * 50 - 25],
              x: [0, Math.random() * 50 - 25],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default TerminalDisplay;