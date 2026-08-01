import React from "react";
import CheckoutContent from "@/components/checkout/CheckoutContent";
import StripeElementsProvider from "@/components/checkout/StripeElementsProvider";

type CheckoutModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white text-gray-900 w-full max-w-3xl p-6 rounded-xl shadow-xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 text-xl z-10"
          aria-label="Close checkout"
        >
          ×
        </button>
        <StripeElementsProvider>
          <CheckoutContent layout="modal" isActive={isOpen} onComplete={onClose} />
        </StripeElementsProvider>
      </div>
    </div>
  );
};

export default CheckoutModal;
