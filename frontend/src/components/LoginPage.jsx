import { useState } from 'react';
import { useAuth } from './AuthProvider';

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google');
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page" id="login-page">
      {/* Floating orbs background */}
      <div className="login-page__bg">
        <div className="login-page__orb login-page__orb--1" />
        <div className="login-page__orb login-page__orb--2" />
        <div className="login-page__orb login-page__orb--3" />
      </div>

      <div className="login-card" id="login-card">
        {/* Logo */}
        <div className="login-card__logo">
          <div className="login-card__logo-icon">P</div>
          <span className="login-card__logo-text">
            Protly<span style={{ color: 'var(--accent)' }}>.</span>
          </span>
        </div>

        <h1 className="login-card__title">Welcome Back</h1>
        <p className="login-card__subtitle">
          Sign in to access the Protein Folding Analysis Dashboard
        </p>

        {error && (
          <div className="login-card__error" id="login-error">
            <span>✕</span>
            {error}
          </div>
        )}

        <button
          className="login-card__google-btn"
          id="google-login-btn"
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="spinner spinner--dark" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
          )}
          {isLoading ? 'Signing in…' : 'Continue with Google'}
        </button>

        <div className="login-card__divider">
          <span>Secure Authentication</span>
        </div>

        <div className="login-card__features">
          <div className="login-card__feature">
            <span className="login-card__feature-icon">🔒</span>
            <div>
              <strong>End-to-End Security</strong>
              <p>OAuth 2.0 via Supabase with encrypted sessions</p>
            </div>
          </div>
          <div className="login-card__feature">
            <span className="login-card__feature-icon">🧬</span>
            <div>
              <strong>Protein Analysis</strong>
              <p>ESMFold structure prediction & visualization</p>
            </div>
          </div>
          <div className="login-card__feature">
            <span className="login-card__feature-icon">🔍</span>
            <div>
              <strong>UniProt Discovery</strong>
              <p>Search & analyze millions of protein entries</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
