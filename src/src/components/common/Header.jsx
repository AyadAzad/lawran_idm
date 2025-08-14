import { motion } from 'framer-motion';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Header({ icon, title, subtitle, gradient }) {
  return (
    <motion.div variants={itemVariants} className="text-center mb-10">
      <h1 className={`text-4xl sm:text-5xl font-bold bg-gradient-to-r ${gradient} text-transparent bg-clip-text flex items-center justify-center gap-3`}>
        {icon}
        {title}
      </h1>
      <p className="text-gray-400 mt-2">{subtitle}</p>
    </motion.div>
  );
}