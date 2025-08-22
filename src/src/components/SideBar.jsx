import { useState, useEffect } from 'react';
import {Link} from "react-router-dom";
import {PiHighDefinitionFill} from "react-icons/pi";
import {LuAudioLines} from "react-icons/lu";
import {Md4K} from "react-icons/md";
import {FaFolder} from "react-icons/fa6";
import {MdDashboard} from "react-icons/md";
import {MdOutlinePlaylistAdd} from "react-icons/md";
import {MdSummarize} from "react-icons/md";

const SideBar = ({isMinimized, setIsMinimized}) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isHovered, setIsHovered] = useState(false);

  // Sections data
  const sections = [
    { id: 'dashboard', name: 'Dashboard', link:'/', icon: <MdDashboard/> },
    { id: 'Download HD', name: 'Download HD', link:'/download-hd', icon: <PiHighDefinitionFill/> },
    { id: 'Download Audio', name: 'Download Audio', link:'/download-audio', icon: <LuAudioLines/> },
    { id: 'Download 4K', name: 'Download 4k', link:'/download-4k', icon: <Md4K/> },
    { id: 'Download Playlist', name: 'Download Playlist', link:'/download-playlist', icon: <MdOutlinePlaylistAdd/> },
    { id: 'Other Platforms', name: 'Other Platforms', link:'/other-platforms', icon: <MdSummarize/> },
    { id: 'Documents', name: 'Documents', link:'/documents', icon: <MdSummarize/> },
    { id: 'downloads', name: 'Downloads', link:'/downloads', icon: <FaFolder/> },
  ];

  return (
    <div
      className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-indigo-900 to-purple-900 text-white transition-all duration-500 ease-in-out ${isMinimized ? 'w-20' : 'w-64'} shadow-2xl z-50`}>
      {/* Logo/Header */}
      <div className={`flex items-center justify-center p-6 border-b border-purple-700 transition-all duration-300 ${isMinimized ? 'flex-col' : 'flex-row'}`}>
        <div className="text-3xl bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent font-bold">
          {isMinimized ? '⚡' : 'Lawran IDM'}
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <ul className="space-y-2">
          {sections.map((section) => (
                    <Link to={section.link}>
            <li key={section.id}>
              <button
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center p-3 rounded-lg transition-all duration-300 hover:bg-purple-800 hover:shadow-lg hover:translate-x-1 ${activeSection === section.id ? 'bg-purple-700 shadow-md' : ''}`}
              >
                <span className="text-xl">{section.icon}</span>
                {(!isMinimized || isHovered) && (
                  <span className={`ml-3 transition-opacity duration-200 ${isMinimized ? 'opacity-0' : 'opacity-100'}`}>
                    {section.name}
                  </span>
                )}
                {activeSection === section.id && (
                  <span className={`ml-auto h-2 w-2 rounded-full bg-cyan-400 animate-pulse ${isMinimized ? 'opacity-0' : ''}`}></span>
                )}
              </button>
            </li>
                    </Link>
          ))}
        </ul>
      </nav>

      {/* User Profile */}
      <div className={`absolute bottom-0 left-0 right-0 p-4 border-t border-purple-700 ${isMinimized ? 'flex justify-center' : ''}`}>
        <div className="flex items-center">
          <div className="relative">
            <img
              src="https://media.licdn.com/dms/image/v2/D4D03AQGBHDZzhW7YRg/profile-displayphoto-shrink_400_400/B4DZYTxs1nHwAg-/0/1744088518481?e=1757548800&v=beta&t=Rf3ITTsm-7rhj7Fj1tIZ2uQ5kF4rFrkT0Dek3ndIsc0"
              alt="User"
              className="w-10 h-10 rounded-full border-2 border-cyan-400 object-cover"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-purple-900"></span>
          </div>
          {(!isMinimized || isHovered) && (
            <div className={`ml-3 transition-opacity duration-200 ${isMinimized ? 'opacity-0' : 'opacity-100'}`}>
              <p className="text-sm font-medium">Ayad Ali</p>
              <p className="text-xs text-purple-300">Developer</p>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsMinimized(!isMinimized)}
        className="absolute -right-3 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-all duration-300"
      >
        {isMinimized ? '➡️' : '⬅️'}
      </button>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-cyan-400 animate-float"
            style={{
              width: `${Math.random() * 100 + 50}px`,
              height: `${Math.random() * 100 + 50}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 20 + 10}s`,
              animationDelay: `${Math.random() * 5}s`
            }}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default SideBar;