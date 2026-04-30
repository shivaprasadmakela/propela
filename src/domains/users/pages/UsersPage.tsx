import { useNavigate } from 'react-router-dom';
import { UsersTable } from '../components/UsersTable';

export function UsersPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full p-8">
      <UsersTable onBack={() => navigate('/settings')} />
    </div>
  );
}
