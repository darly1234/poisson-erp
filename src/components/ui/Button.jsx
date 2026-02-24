import React from 'react';

const Button = ({ children, onClick, variant = 'primary', className = "", icon: Icon, size = 'md', disabled = false }) => {
  const variants = {
    primary: `bg-[#1F2A8A] text-white hover:bg-[#161e63] shadow-sm`,
    secondary: `bg-[#3B82F6] text-white hover:bg-[#2563EB]`,
    excel: `bg-[#166534] text-white hover:bg-[#14532d] shadow-sm`,
    outline: `border border-gray-300 bg-white text-gray-700 hover:bg-gray-50`,
    ghost: `text-gray-500 hover:bg-gray-100`,
    danger: `bg-red-600 text-white hover:bg-red-700 shadow-sm`
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-[11px]',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg transition-all flex items-center justify-center gap-2 font-semibold ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  );
};

export default Button;
