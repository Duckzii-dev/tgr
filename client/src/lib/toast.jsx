import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const push = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setItems((x) => [...x, { id, message, type }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 3500);
  }, []);

  const remove = (id) => setItems((x) => x.filter((i) => i.id !== id));

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={`card px-4 py-3 flex items-center gap-3 shadow-lg border ${
              t.type === 'error' ? 'border-red-500/40' : 'border-accent/40'
            }`}
          >
            {t.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-red-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-accent" />
            )}
            <span className="text-sm">{t.message}</span>
            <button onClick={() => remove(t.id)} className="text-ink-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx).push;