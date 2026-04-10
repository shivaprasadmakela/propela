import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Router } from './app/router';
import { useAuthStore } from './features/auth/store/useAuthStore';
import './index.css';

function App() {
  const initAuth = useAuthStore((state) => state.initAuth);
  
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return <Router />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
