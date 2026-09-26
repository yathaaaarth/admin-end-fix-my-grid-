import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { login, adminRegister } from '../api/authority';
import { Shield, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let data;
      if (isRegister) {
        data = await adminRegister({ email, password, firstName, lastName });
      } else {
        data = await login(email, password);
      }

      const token = data.token || data.key || data.access;
      const user = data.user;

      loginUser(user, token);
      navigate('/', { replace: true });
    } catch (err) {
      const resp = err.response?.data;
      if (resp?.non_field_errors) {
        setError('Incorrect email or password. Please try again.');
      } else if (resp?.email) {
        setError(resp.email[0]);
      } else if (resp?.password) {
        const msgs = Array.isArray(resp.password) ? resp.password : [resp.password];
        setError(msgs.join(' '));
      } else if (resp?.detail) {
        setError(resp.detail);
      } else {
        setError('Unable to connect to the server. Please check your network.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Civic Intelligence</h1>
          <p className="text-primary-200 text-sm mt-1">Authority Admin Panel</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${
                !isRegister
                  ? 'bg-white text-primary-500 shadow-sm'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setError(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${
                isRegister
                  ? 'bg-white text-primary-500 shadow-sm'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Sign Up
            </button>
          </div>

          <h2 className="text-xl font-bold text-ink mb-1">
            {isRegister ? 'Create account' : 'Welcome back'}
          </h2>
          <p className="text-sm text-muted mb-6">
            {isRegister
              ? 'Register a new staff account'
              : 'Sign in to your staff account'}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    First name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-line bg-background text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    placeholder="Jane"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Last name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-line bg-background text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    placeholder="Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-line bg-background text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-2.5 rounded-lg border border-line bg-background text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {isRegister && (
                <p className="text-xs text-muted mt-1">
                  Minimum 8 characters
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-semibold rounded-lg transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4" fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  {isRegister ? 'Creating account...' : 'Signing in...'}
                </span>
              ) : (
                isRegister ? 'Create account' : 'Sign in'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-5">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={toggleMode}
              className="text-primary-500 hover:text-primary-700 font-semibold"
            >
              {isRegister ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>

        <p className="text-center text-primary-200 text-xs mt-6">
          Civic Intelligence © 2026. Authorized personnel only.
        </p>
      </div>
    </div>
  );
}
