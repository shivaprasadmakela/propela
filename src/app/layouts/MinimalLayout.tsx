import { Outlet } from 'react-router-dom';

export function MinimalLayout() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Outlet />
    </div>
  );
}
