import React from 'react';
import { FaTimes } from 'react-icons/fa';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity p-0 md:p-4" onClick={onClose}>
      <div 
        className={`bg-white w-full ${sizes[size]} max-h-[92vh] md:max-h-[90vh] overflow-y-auto 
          rounded-t-[2rem] md:rounded-2xl shadow-2xl 
          animate-in slide-in-from-bottom duration-300 md:zoom-in-95 flex flex-col`} 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-gray-100 sticky top-0 bg-white z-20">
          <div className="flex flex-col w-full items-center md:items-start">
            <div className="md:hidden w-10 h-1 bg-gray-200 rounded-full mb-3"></div>
            <h3 className="text-base md:text-lg font-bold text-gray-900 leading-none">{title}</h3>
          </div>
          <button onClick={onClose} className="absolute right-4 top-4 md:static p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all active:scale-90">
            <FaTimes size={18} />
          </button>
        </div>
        <div className="p-5 md:p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
