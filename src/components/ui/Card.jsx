import React from 'react';

const Card = ({ children, className = "", ...props }) => (
  <div
    {...props}
    className={`bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden transition-all duration-200 ${className}`}
  >
    {children}
  </div>
);

export default Card;
