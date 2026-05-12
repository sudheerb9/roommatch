// Reusable UI component for the floating-elements interface element.
import { motion } from 'motion/react';

const FloatingElements = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <motion.div
        className="absolute top-[10%] left-[5%] w-32 h-32 bg-[#7a0019]/10 rounded-full blur-3xl"
        animate={{
          y: [0, -30, 0],
          x: [0, 20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 10,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute top-[30%] right-[10%] w-48 h-48 bg-[#881c1c]/10 rounded-full blur-3xl"
        animate={{
          y: [0, 40, 0],
          x: [0, -30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 12,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'easeInOut',
          delay: 2,
        }}
      />

      <motion.div
        className="absolute bottom-[20%] left-[15%] w-40 h-40 bg-[#a0252a]/10 rounded-full blur-3xl"
        animate={{
          y: [0, -50, 0],
          x: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 15,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'easeInOut',
          delay: 5,
        }}
      />

      <motion.div
        className="absolute bottom-[10%] right-[20%] w-24 h-24 bg-[#7a0019]/10 rounded-full blur-2xl"
        animate={{
          y: [0, 20, 0],
          x: [0, -20, 0],
        }}
        transition={{
          duration: 8,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'easeInOut',
          delay: 1,
        }}
      />
    </div>
  );
};

export default FloatingElements;
