import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, FileVideo, FileAudio, Clock } from 'lucide-react';

/**
 * Reusable animation variants for staggering item appearance.
 * @type {object}
 */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

/**
 * A reusable card component for displaying statistics with a hover effect.
 * @param {object} props - The component props.
 */
const StatCard = ({ icon, title, value, gradient }) => (
  <motion.div
    variants={itemVariants}
    className={`bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 flex items-center gap-6 transition-all duration-300 hover:border-gray-600 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1`}
  >
    <div className={`text-white p-4 rounded-lg bg-gradient-to-br ${gradient}`}>
      {icon}
    </div>
    <div>
      <div className="text-gray-400 text-sm">{title}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  </motion.div>
);

/**
 * Renders the default home screen for the dashboard.
 * Displays summary statistics and a list of the most recent downloads.
 */
export default function DashboardHome() {
  const [recentFiles, setRecentFiles] = useState([]);
  const [stats, setStats] = useState({ total: 0, videos: 0, audios: 0 });

  useEffect(() => {
    /**
     * Fetches the list of downloaded files to populate stats and recent activity.
     */
    const fetchRecent = async () => {
      try {
        const response = await fetch('/api/downloads/list');
        const data = await response.json();
        setRecentFiles(data.slice(0, 5)); // Show the 5 most recent files
        setStats({
          total: data.length,
          videos: data.filter(f => f.type === 'video').length,
          audios: data.filter(f => f.type === 'audio').length,
        });
      } catch (error) {
        console.error("Failed to fetch recent downloads:", error);
      }
    };
    fetchRecent();
  }, []);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-10"
    >
      {/* Statistics Section */}
      <motion.div variants={itemVariants}>
        <h2 className="text-3xl font-bold text-white mb-6">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard icon={<Download size={24} />} title="Total Downloads" value={stats.total} gradient="from-cyan-500 to-blue-500" />
          <StatCard icon={<FileVideo size={24} />} title="Videos" value={stats.videos} gradient="from-violet-500 to-purple-500" />
          <StatCard icon={<FileAudio size={24} />} title="Audios" value={stats.audios} gradient="from-emerald-500 to-teal-500" />
        </div>
      </motion.div>

      {/* Recent Activity Section */}
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-semibold text-white mb-4">Recent Activity</h2>
        <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-4 space-y-3">
          {recentFiles.length > 0 ? (
            recentFiles.map(file => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-3 overflow-hidden">
                  {file.type === 'video' ? <FileVideo className="text-cyan-400 flex-shrink-0" /> : <FileAudio className="text-emerald-400 flex-shrink-0" />}
                  <span className="text-gray-300 text-sm truncate">{file.filename}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 whitespace-nowrap">
                  <Clock size={14} />
                  <span>{file.created_at}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">No recent downloads found.</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}