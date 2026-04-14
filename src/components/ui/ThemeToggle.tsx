import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { motion } from 'framer-motion';

export const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative flex items-center justify-center w-12 h-6 bg-gray-300 dark:bg-dark-700 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-dark-900"
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="absolute w-5 h-5 bg-white dark:bg-dark-800 rounded-full shadow-lg flex items-center justify-center"
        animate={{
          x: isDark ? 20 : -20,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30
        }}
      >
        <motion.div
          animate={{
            rotate: isDark ? 0 : 180,
            scale: isDark ? 1 : 0.8
          }}
          transition={{
            duration: 0.3
          }}
        >
          {isDark ? (
            <Moon className="w-3 h-3 text-primary-600" />
          ) : (
            <Sun className="w-3 h-3 text-accent-500" />
          )}
        </motion.div>
      </motion.div>
    </motion.button>
  );
};