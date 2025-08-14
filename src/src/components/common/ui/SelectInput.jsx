// src/components/common/ui/SelectInput.jsx
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function SelectInput({ value, onChange, options, focusColor }) {
  return (
    <div className="relative">
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
      <select
        value={value}
        onChange={onChange}
        className={`w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 appearance-none text-white focus:ring-2 ${focusColor} transition-all`}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}