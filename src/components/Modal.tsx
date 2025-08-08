import React from "react";

interface ModalProps {
  isOpen: boolean;
  message: React.ReactNode; 
  onConfirm: () => void;
  onCancel: () => void;
}

const Modal: React.FC<ModalProps> = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-[9999] p-4">
      <div className="bg-white rounded-2xl p-4 sm:p-7 w-full max-w-[360px] text-center shadow-2xl animate-fade-in">
        <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900">Confirm</h3>
        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">{message}</p>
        <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
          <button
            onClick={onConfirm}
            className="w-full sm:w-auto bg-[#f09c42] text-white px-6 sm:px-9 py-2 rounded-lg font-semibold text-sm hover:bg-[#e3912d] transition"
          >
            Yes
          </button>
          <button
            onClick={onCancel}
            className="w-full sm:w-auto border border-gray-300 text-gray-600 px-6 sm:px-5 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100 hover:border-gray-400 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
