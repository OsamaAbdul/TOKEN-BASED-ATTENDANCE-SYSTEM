import React from 'react';

const DashboardCard = ({ title, value, icon: Icon, color, subValue }) => {
  // Extended color styles with modern shades and gradients
  const colorStyles = {
    teal: {
      bg: 'bg-teal-500/10',
      text: 'text-teal-600',
      hoverBg: 'hover:bg-teal-500/20',
      gradient: 'from-teal-400/20 to-teal-600/20',
      border: 'hover:border-teal-400',
    },
    indigo: {
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-600',
      hoverBg: 'hover:bg-indigo-500/20',
      gradient: 'from-indigo-400/20 to-indigo-600/20',
      border: 'hover:border-indigo-400',
    },
    purple: {
      bg: 'bg-purple-500/10',
      text: 'text-purple-600',
      hoverBg: 'hover:bg-purple-500/20',
      gradient: 'from-purple-400/20 to-purple-600/20',
      border: 'hover:border-purple-400',
    },
    blue: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-600',
      hoverBg: 'hover:bg-blue-500/20',
      gradient: 'from-blue-400/20 to-blue-600/20',
      border: 'hover:border-blue-400',
    },
  };

  // Ensure color exists, default to teal
  const styles = colorStyles[color] || colorStyles.teal;

  return (
    <div
      className={`
        relative bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-md hover:shadow-xl 
        border border-gray-100/50 ${styles.border} 
        transition-all duration-300 ease-in-out 
        transform hover:scale-102 focus:scale-102 
        w-full max-w-sm mx-auto 
        group overflow-hidden
        focus:outline-none focus:ring-2 focus:ring-${color}-300
      `}
      role="region"
      aria-label={`${title} card`}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.click()}
    >
      {/* Shine effect on hover */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 
        bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 
        transition-opacity duration-500"
      ></div>

      {/* Card content */}
      <div className="flex items-center space-x-4 relative z-10">
        <div
          className={`
            p-3 rounded-full ${styles.bg} ${styles.text} ${styles.hoverBg} 
            transition-colors duration-300
          `}
          aria-hidden="true"
        >
          <Icon className="text-2xl" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg md:text-xl font-semibold text-gray-800 tracking-tight">
            {' '}
            {title}
          </h3>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">{value}</p>
          {subValue && (
            <p className="text-sm text-gray-500 mt-1">{subValue}</p>
          )}
        </div>
      </div>

      {/* Gradient overlay for hover effect */}
      <div
        className={`
          absolute inset-0 rounded-2xl bg-gradient-to-r ${styles.gradient} 
          opacity-0 group-hover:opacity-30 transition-opacity duration-300
        `}
      ></div>

      {/* Ripple effect container */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl"></div>
    </div>
  );
};

export default DashboardCard;