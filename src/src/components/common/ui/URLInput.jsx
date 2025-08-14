// src/components/common/ui/URLInput.jsx
import { motion } from 'framer-motion';

export default function URLInput({ url, setUrl, icon, placeholder, focusColor }) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{icon}</div>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 pl-10 text-white placeholder-gray-500 focus:ring-2 ${focusColor} transition-all`}
      />
    </div>
  );
}