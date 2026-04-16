import React from 'react';
const Spinner = ({ size = 'md' }) => {
  const s = { sm: 'h-6 w-6', md: 'h-10 w-10', lg: 'h-16 w-16' };
  return (
    <div className="flex items-center justify-center py-10">
      <div className={`animate-spin rounded-full border-b-2 border-primary-500 ${s[size]}`}></div>
    </div>
  );
};
export default Spinner;
