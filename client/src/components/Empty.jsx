import { Dumbbell } from 'lucide-react';

export default function Empty({
  title = 'Nothing here yet',
  hint = '',
  icon: Icon = Dumbbell,
  action,
}) {
  return (
    <div className="card p-8 flex flex-col items-center text-center gap-3">
      <div className="w-12 h-12 rounded-full bg-ink-800 flex items-center justify-center">
        <Icon className="w-6 h-6 text-ink-400" />
      </div>
      <div>
        <div className="font-medium">{title}</div>
        {hint && <div className="text-sm text-ink-400 mt-1">{hint}</div>}
      </div>
      {action}
    </div>
  );
}