import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authApi, type UserClient } from '@/features/auth/api/authApi';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userClients, setUserClients] = useState<UserClient[] | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleInitialSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const credentials = {
        userName: email,
        password,
        rememberMe: true,
        cookie: false,
        indentifierType: 'EMAIL_ID',
      };

      const clients = await authApi.findUserClients(credentials);

      if (!clients || clients.length === 0) {
        throw new Error('No client profile found for this user.');
      }

      if (clients.length === 1) {
        // Auto login if exactly 1 client
        await login({ ...credentials, userId: clients[0].userId });
        navigate('/dashboard');
      } else {
        // Show selection options
        setUserClients(clients);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClientSelect = async (userId: number) => {
    setError('');
    setIsSubmitting(true);
    try {
      await login({
        userName: email,
        password,
        rememberMe: true,
        cookie: false,
        indentifierType: 'EMAIL_ID',
        userId,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Logo */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
            P
          </div>
          <span className="text-2xl font-bold tracking-tight text-foreground">Propela</span>
        </Link>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {userClients ? 'Select Client' : 'Welcome back'}
          </h1>
          <p className="text-sm text-foreground/40">
            {userClients ? 'Choose which workspace to log into' : 'Sign in to your account to continue'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* Step 2: Select Client */}
        {userClients ? (
          <div className="space-y-3">
            {userClients.map((userClient) => (
              <button
                key={userClient.userId}
                onClick={() => handleClientSelect(userClient.userId)}
                disabled={isSubmitting}
                className="w-full relative group text-left px-5 py-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/60 hover:border-primary/30 transition-all duration-200 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/0 to-primary/5 group-hover:to-primary/10 transition-colors" />
                <div className="relative flex items-center justify-between">
                  <div>
                    <h3 className="text-foreground font-medium mb-0.5">{userClient.client.name}</h3>
                    <p className="text-xs text-foreground/40 font-mono">{userClient.client.code} • {userClient.client.typeCode}</p>
                  </div>
                  <div className="text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                    →
                  </div>
                </div>
              </button>
            ))}
            
            <button
              type="button"
              onClick={() => setUserClients(null)}
              disabled={isSubmitting}
              className="w-full mt-6 py-2 text-sm text-foreground/40 hover:text-foreground transition-colors"
            >
              ← Back to credentials
            </button>
          </div>
        ) : (
          /* Step 1: Credentials Form */
          <form onSubmit={handleInitialSubmit} className="space-y-5">
            {/* Email */}
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

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground/60 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground placeholder-foreground/20 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60 transition-colors text-sm"
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Remember / Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-foreground/40 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded bg-muted/50 border-border text-primary focus:ring-primary/20"
                />
                Remember me
              </label>
              <a href="#" className="text-sm text-primary hover:text-primary/80 transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign in'
              )}
            </button>
            
            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-foreground/20 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* SSO placeholder */}
            <button type="button" className="w-full py-3 rounded-xl bg-muted/20 border border-border hover:bg-muted/60 text-foreground/60 hover:text-foreground/80 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2">
              <span>🔑</span>
              Continue with SSO
            </button>
          </form>
        )}
      </div>

      {/* Bottom link */}
      <p className="text-center text-sm text-foreground/30 mt-6">
        Don't have an account?{' '}
        <a href="#" className="text-primary hover:text-primary/80 transition-colors font-medium">
          Request access
        </a>
      </p>
    </div>
  );
}
