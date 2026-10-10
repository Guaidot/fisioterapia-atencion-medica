import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useContainer } from '../../app/container.jsx';

export function RequireAuth({ children }) {
  const { authService } = useContainer();
  const location = useLocation();
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    let active = true;
    authService.currentUser().then((u) => {
      if (active) setUser(u);
    });
    const unsubscribe = authService.onAuthChange((u) => {
      if (active) setUser(u);
    });
    return () => {
      active = false;
      unsubscribe.unsubscribe();
    };
  }, [authService]);

  if (user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Verificando sesión…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}