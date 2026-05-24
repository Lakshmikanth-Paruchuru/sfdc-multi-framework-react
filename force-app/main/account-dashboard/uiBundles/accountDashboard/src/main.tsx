import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AccountDashboard from './AccountDashboard';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AccountDashboard />
  </StrictMode>
);
