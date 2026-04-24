import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSuccess(true);
    } catch (err) {
      setError('Something went wrong. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {}
      <div className="flex items-center justify-center gap-3 mb-10">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
            P
          </div>
          <span className="text-2xl font-bold tracking-tight text-foreground">Propela</span>
        </Link>
      </div>

      {}
      <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-8 shadow-2xl">
        {isSuccess ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
              📩
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">Check your email</h1>
            <p className="text-sm text-foreground/40 mb-8 leading-relaxed">
              We've sent a password reset link to <br />
              <span className="text-foreground font-medium">{email}</span>
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
            >
              ← Back to login
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-2">Forgot password?</h1>
              <p className="text-sm text-foreground/40">
                No worries, we'll send you reset instructions.
              </p>
            </div>

            {}
            {error && (
              <div className="px-4 py-3 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground/60 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground placeholder-foreground/20 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />
              </div>

              {}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                    Sending instructions...
                  </>
                ) : (
                  'Reset password'
                )}
              </button>

              <div className="text-center mt-6">
                <Link
                  to="/login"
                  className="text-sm text-foreground/40 hover:text-foreground transition-colors inline-flex items-center gap-2"
                >
                  ← Back to login
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
