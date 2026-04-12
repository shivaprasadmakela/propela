export function AccountsPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Accounts</h1>
        </div>
        <button className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-200 flex items-center gap-2">
          <span className="text-lg leading-none">+</span>
          New Account
        </button>
      </div>

      <div className="flex-1 rounded-2xl border border-border bg-card overflow-hidden flex flex-col items-center justify-center min-h-0 text-foreground/40">
        <p>Accounts module coming soon...</p>
      </div>
    </div>
  );
}
