import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import LoginPage from '../components/LoginPage';
import * as AuthProvider from '../components/AuthProvider';

describe('LoginPage Component', () => {
  it('renders login elements correctly', () => {
    vi.spyOn(AuthProvider, 'useAuth').mockReturnValue({
      signInWithGoogle: vi.fn(),
    });

    render(<LoginPage />);
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue with Google/i })).toBeInTheDocument();
  });

  it('calls signInWithGoogle on button click', async () => {
    const mockSignIn = vi.fn().mockResolvedValue();
    vi.spyOn(AuthProvider, 'useAuth').mockReturnValue({
      signInWithGoogle: mockSignIn,
    });
    const user = userEvent.setup();

    render(<LoginPage />);
    const btn = screen.getByRole('button', { name: /Continue with Google/i });
    await user.click(btn);

    expect(mockSignIn).toHaveBeenCalled();
  });

  it('displays the loading spinner when loading', async () => {
    const mockSignIn = vi.fn().mockImplementation(() => new Promise(() => {})); // Never resolves
    vi.spyOn(AuthProvider, 'useAuth').mockReturnValue({
      signInWithGoogle: mockSignIn,
    });
    const user = userEvent.setup();

    render(<LoginPage />);
    const btn = screen.getByRole('button', { name: /Continue with Google/i });
    await user.click(btn);

    expect(screen.getByText('Signing in…')).toBeInTheDocument();
  });
});
