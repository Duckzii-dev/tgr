import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className={`card w-full ${wide ? 'max-w-2xl' : 'max-w-md'} p-5 rounded-t-2xl sm:rounded-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold">{title}</div>
          <button onClick={onClose} className="text-ink-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}