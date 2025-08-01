import React from "react";

interface ModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const Modal: React.FC<ModalProps> = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-lg">
        <p className="mb-4">{message}</p>
        <div className="flex justify-center gap-2">
          <button
            className="w-20 px-4 py-2 bg-gray-300 hover:bg-[#F09C42] rounded"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="w-20 px-4 py-2 rounded bg-gray-300 hover:bg-[#F09C42]"
            onClick={onConfirm}
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
