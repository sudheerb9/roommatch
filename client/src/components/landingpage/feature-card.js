import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

const FeatureCard = ({ icon: Icon, title, description, to }) => {
  const cardBody = (
    <div className="relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/50 bg-white/40 p-10 text-center shadow-xl backdrop-blur-md transition-all duration-500 hover:border-[#881c1c]/50 hover:shadow-2xl hover:shadow-[#881c1c]/10">
        {/* Hover Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#7a0019]/0 to-[#881c1c]/0 group-hover:from-[#7a0019]/10 group-hover:to-[#881c1c]/5 transition-all duration-500"></div>

        <motion.div
          className="relative w-20 h-20 bg-gradient-to-br from-[#7a0019] to-[#881c1c] rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg group-hover:scale-110 transition-transform duration-300"
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          <Icon className="w-10 h-10 text-white drop-shadow-md" />
        </motion.div>

        <h3 className="relative text-2xl font-bold mb-4 text-[#100e06] group-hover:text-[#881c1c] transition-colors duration-300">
          {title}
        </h3>

        <p className="relative flex-grow font-medium leading-relaxed text-[#100e06]/70">
          {description}
        </p>
      </div>
  );

  return (
    <motion.div
      className="group h-full"
      whileHover={{ y: -10 }}
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 300 }}
    >
      {to ? (
        <Link
          to={to}
          className="block h-full cursor-pointer rounded-[2rem] text-inherit no-underline outline-none focus-visible:ring-2 focus-visible:ring-[#881c1c]/50 focus-visible:ring-offset-2"
        >
          {cardBody}
        </Link>
      ) : (
        cardBody
      )}
    </motion.div>
  );
};

export default FeatureCard;
