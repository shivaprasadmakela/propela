import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-12">
        {}
        <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full animate-pulse" />
        
        {}
        <h1 className="relative text-[12rem] font-black leading-none tracking-tighter text-foreground/5 select-none">
          404
        </h1>
        
        {}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 rounded-3xl bg-card border border-border shadow-2xl flex items-center justify-center text-4xl animate-bounce duration-[3000ms]">
            🔍
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-md">
        <h2 className="text-4xl font-bold text-foreground mb-4 tracking-tight">
          Page not found
        </h2>
        <p className="text-lg text-foreground/40 mb-10 leading-relaxed">
          Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-200"
          >
            Go back home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-muted/50 hover:bg-muted border border-border text-foreground font-semibold text-sm transition-all duration-200"
          >
            Go back
          </button>
        </div>
      </div>

      {}
      <div className="fixed bottom-10 left-10 w-2 h-2 rounded-full bg-primary/20" />
      <div className="fixed top-20 right-20 w-3 h-3 rounded-full bg-primary/10" />
      <div className="fixed bottom-40 right-10 w-4 h-4 rounded-full bg-primary/5" />
    </div>
  );
}
