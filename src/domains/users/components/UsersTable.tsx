import { useState, useEffect, useCallback } from 'react';
import { usersApi, type UserEntity } from '../api/usersApi';
import { DataTable, type ColumnDef } from '@/shared/ui/table/DataTable';
import { useToast } from '@/shared/ui/toast/ToastProvider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

interface UsersTableProps {
  onBack: () => void;
}

export function UsersTable({ onBack }: UsersTableProps) {
  const [users, setUsers] = useState<UserEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(25);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const toast = useToast();

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await usersApi.fetchUsers(page, pageSize);
      setUsers(response.content || []);
      setTotalElements(response.totalElements || 0);
      setTotalPages(response.totalPages || 0);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast('Failed to load users', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(
    (u) =>
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      u.emailId?.toLowerCase().includes(search.toLowerCase())
  );

  const columns: ColumnDef<UserEntity>[] = [
    {
      key: '_serial',
      header: 'S. NO',
      width: '60px',
      render: (_, i) => (
        <span className="text-foreground/50 text-sm">{page * pageSize + i + 1}</span>
      ),
    },
    {
      key: 'name',
      header: 'USER NAME',
      render: (user) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground/80">
            {user.firstName} {user.lastName}
          </span>
          <span className="text-xs text-foreground/40">{user.emailId}</span>
        </div>
      ),
    },
    {
      key: 'phoneNumber',
      header: 'PHONE NUMBER',
      render: (user) => (
        <span className="text-sm text-foreground/60">{user.phoneNumber || '-'}</span>
      ),
    },
    {
      key: 'designation',
      header: 'DESIGNATION',
      render: (user) => (
        <span className="text-sm text-foreground/60">
          {user.designation?.name || '-'}
        </span>
      ),
    },
    {
      key: 'reportingUser',
      header: 'REPORTING TO',
      render: (user) => (
        <span className="text-sm text-foreground/60">
          {user.reportingUser ? `${user.reportingUser.firstName} ${user.reportingUser.lastName}` : '-'}
        </span>
      ),
    },
    {
      key: 'statusCode',
      header: 'STATUS',
      render: (user) => (
        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${
          user.statusCode === 'ACTIVE' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' 
            : 'bg-gray-100 text-gray-500 border-gray-200'
        }`}>
          {user.statusCode}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'ACTION',
      render: () => (
        <button className="text-sm text-primary hover:underline">
          Edit
        </button>
      ),
    }
  ];

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors text-foreground/60"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <div>
            <h2 className="text-xl font-bold">Users</h2>
            <p className="text-sm text-foreground/50">Manage your team and their permissions</p>
          </div>
        </div>
      </div>

      <div className="flex-1 rounded-2xl border border-border bg-card overflow-hidden flex flex-col min-h-0">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="relative">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30 text-sm" />
            <input
              type="text"
              placeholder="Search for user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl bg-muted/50 border border-border text-foreground placeholder-foreground/20 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all w-64"
            />
          </div>
        </div>

        <DataTable
          data={filteredUsers}
          columns={columns}
          isLoading={isLoading}
          startIndex={page * pageSize}
          page={page}
          size={pageSize}
          totalElements={totalElements}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
