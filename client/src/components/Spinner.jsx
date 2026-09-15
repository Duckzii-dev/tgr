export default function Spinner({ className = 'w-5 h-5' }) {
    return (
      <div
        className={`${className} border-2 border-ink-600 border-t-accent rounded-full animate-spin`}
      />
    );
  }