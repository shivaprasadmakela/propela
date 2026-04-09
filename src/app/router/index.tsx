import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes';

export function Router() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
