import React from "react";
import ReactDOM from "react-dom";

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
}

const PreviewModal: React.FC<ModalProps> = ({ children, onClose }) => {
  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose} // Close modal when clicking on overlay
    >
      <div
        className="relative w-full max-w-lg p-6 text-white bg-gray-900 rounded-lg shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="top-2 right-2 hover:text-white absolute text-gray-400"
        >
          &times;
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
};

export default PreviewModal;
