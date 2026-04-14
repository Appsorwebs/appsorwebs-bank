import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: 'blue' | 'green' | 'orange';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  hover = false,
  glow 
}) => {
  const glowClass = glow === 'blue' ? 'hover:shadow-glow' : 
                   glow === 'green' ? 'hover:shadow-glow-green' :
                   glow === 'orange' ? 'hover:shadow-glow-orange' : '';

  return (
    <motion.div
      className={`
        bg-white dark:bg-dark-800/50 backdrop-blur-sm 
        border border-gray-200 dark:border-dark-700 
        rounded-xl shadow-lg dark:shadow-dark-900/20
        ${hover ? 'transition-all duration-300 hover:shadow-xl hover:-translate-y-1' : ''}
        ${glowClass}
        ${className}
      `}
      initial={hover ? { y: 0 } : false}
      whileHover={hover ? { y: -2 } : {}}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
};