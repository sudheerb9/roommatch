// Reusable UI component for the button interface element.

const Button = ({ children, className = '', size = 'default', ...props }) => {
  const sizeClasses = {
    default: 'px-4 py-2',
    lg: 'px-8 py-4 text-lg',
    sm: 'px-3 py-1.5 text-sm',
  };

  return (
    <button
      className={`inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export { Button };
