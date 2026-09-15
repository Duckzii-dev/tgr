import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import Spinner from '../components/Spinner.jsx';

export default function AuthCallback() {
  const { refresh } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    (async () => {
      await refresh();
      nav('/');
    })();
  }, [refresh, nav]);
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner />
    </div>
  );
}