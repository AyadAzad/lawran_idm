import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Import your existing, beautiful sidebar
import SideBar from '../SideBar.jsx';

/**
 * Renders the main dashboard layout, which includes the sidebar and the main content area.
 * It lifts the sidebar's collapsed state to dynamically adjust the main content's padding.
 * It also uses AnimatePresence to create smooth transitions between different pages (views).
 */
export default function Dashboard() {
  /**
   * @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]}
   * State to track if the sidebar is minimized. This state is "lifted up"
   * from the Sidebar component so the main layout can react to it.
   */
  const [isMinimized, setIsMinimized] = useState(false);

  /**
   * useLocation hook from react-router-dom is used to get a unique key for
   * the AnimatePresence component, which triggers the animation on route changes.
   */
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-gray-900 font-sans">
      {/* Pass the state and setter down to the Sidebar */}
      <SideBar isMinimized={isMinimized} setIsMinimized={setIsMinimized} />

      {/*
        The main content area.
        The `pl` (padding-left) class is dynamic, creating space for the sidebar.
      */}
      <main className={`flex-1 relative overflow-y-auto transition-all duration-500 ease-in-out ${isMinimized ? 'pl-20' : 'pl-64'}`}>
        {/* Animated background pattern for a legendary feel */}
        <div className="absolute inset-0 bg-grid-white/[0.03] [mask-image:linear-gradient(to_bottom,white_0%,transparent_100%)]"></div>

        <div className="p-6 sm:p-10">
          {/*
            AnimatePresence handles the exit/enter animations when the view changes.
            The `location.pathname` is the key that tells it when to animate.
          */}
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Outlet renders the active child route (e.g., DashboardHome, DownloadVideo, etc.) */}
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}