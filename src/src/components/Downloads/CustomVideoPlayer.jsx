import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Play, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';

export default function CustomVideoPlayer({ file, onClose }) {
  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);
  const progressRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [areControlsVisible, setAreControlsVisible] = useState(true);
  let controlsTimeout;

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const hideControls = () => { if (!videoRef.current?.paused) setAreControlsVisible(false); };
  const showControls = () => { clearTimeout(controlsTimeout); setAreControlsVisible(true); controlsTimeout = setTimeout(hideControls, 3000); };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const updateProgress = () => { setCurrentTime(video.currentTime); setProgress((video.currentTime / video.duration) * 100); };
    const setVideoDuration = () => setDuration(video.duration);
    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('loadedmetadata', setVideoDuration);
    const handleKeyDown = (e) => {
      if (e.code === "Space") { e.preventDefault(); togglePlay(); }
      if (e.code === "KeyF") toggleFullscreen();
      if (e.code === "KeyM") toggleMute();
      if (e.code === "ArrowRight") video.currentTime += 5;
      if (e.code === "ArrowLeft") video.currentTime -= 5;
    };
    window.addEventListener('keydown', handleKeyDown);
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    showControls();
    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('loadedmetadata', setVideoDuration);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      clearTimeout(controlsTimeout);
    };
  }, []);

  const togglePlay = () => { if (isPlaying) videoRef.current.pause(); else videoRef.current.play(); setIsPlaying(!isPlaying); };
  const handleSeek = (e) => { const seekTime = (e.nativeEvent.offsetX / progressRef.current.offsetWidth) * duration; videoRef.current.currentTime = seekTime; };
  const handleVolumeChange = (newVolume) => { videoRef.current.volume = newVolume; setVolume(newVolume); setIsMuted(newVolume === 0); };
  const toggleMute = () => { videoRef.current.muted = !isMuted; setIsMuted(!isMuted); };
  const toggleFullscreen = () => { if (!isFullscreen) playerContainerRef.current.requestFullscreen(); else document.exitFullscreen(); };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50" onClick={onClose}>
      <motion.div ref={playerContainerRef} initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} transition={{ type: "spring", damping: 30, stiffness: 200 }} className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()} onMouseMove={showControls} onMouseLeave={hideControls}>
        <video ref={videoRef} src={`/downloads/${file.filename}`} autoPlay className="w-full h-full" onClick={togglePlay} />
        <AnimatePresence>
        {areControlsVisible && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
          <div ref={progressRef} className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer group" onClick={handleSeek}>
              <div className="bg-cyan-400 h-full rounded-full relative" style={{width: `${progress}%`}}><div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full transform scale-0 group-hover:scale-100 transition-transform"/></div>
          </div>
          <div className="flex items-center justify-between mt-2 text-white">
            <div className="flex items-center gap-4">
              <motion.button onClick={togglePlay} whileHover={{scale: 1.1}} whileTap={{scale: 0.9}}>{isPlaying ? <Pause/> : <Play/>}</motion.button>
              <div className="group relative flex items-center">
                <motion.button onClick={toggleMute} whileHover={{scale: 1.1}} whileTap={{scale: 0.9}}>{isMuted || volume === 0 ? <VolumeX/> : <Volume2/>}</motion.button>
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-28 p-2 bg-gray-800/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                   <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => handleVolumeChange(parseFloat(e.target.value))} className="w-full h-1 accent-cyan-400"/>
                </div>
              </div>
              <div className="text-sm font-mono">{formatTime(currentTime)} / {formatTime(duration)}</div>
            </div>
            <motion.button onClick={toggleFullscreen} whileHover={{scale: 1.1}} whileTap={{scale: 0.9}}>{isFullscreen ? <Minimize/> : <Maximize/>}</motion.button>
          </div>
        </motion.div>
        )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}