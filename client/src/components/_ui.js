import React, { useEffect } from 'react';

export const Modal = ({ children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
    <div className="bg-white rounded-xl shadow-lg p-6 relative min-w-[320px] max-w-full" style={{ minWidth: 320 }}>
      <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl">&times;</button>
      {children}
    </div>
  </div>
);

export const Spinner = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-10">
    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
  </div>
);

export const Toast = ({ type = 'success', message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-semibold ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
      style={{ minWidth: 200 }}>
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 text-white text-lg font-bold">&times;</button>
    </div>
  );
}; 