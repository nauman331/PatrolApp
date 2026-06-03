import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../../store/slice/auth-management/authSlice';
import { RootState } from '../../store';
import { useRouter } from '@tanstack/react-router';
import { toast } from 'sonner';
import '../styles/Login.css';

const Login: React.FC = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loading, error } = useSelector((state: RootState) => state.auth);

  // Track whether a login attempt was made in this session
  const attemptedLogin = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    attemptedLogin.current = true;
    const result = await dispatch(login({ email, password }) as any);

    if (login.fulfilled.match(result)) {
      toast.success(`Welcome, ${result.payload.user.name || 'User'}!`, {
        description: 'Login successful.',
      });
      router.navigate({ to: '/' });
    } else {
      toast.error(result.payload || 'Invalid credentials');
    }
  };

  return (
    <div className="login-container">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Portal Login</h1>
        <div className="input-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        <button className="login-button" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default Login;