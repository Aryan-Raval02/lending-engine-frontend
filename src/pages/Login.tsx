import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { Shield } from 'lucide-react';

const Login: React.FC = () => {
  const location = useLocation();
  const state = location.state as { tenantId?: string; email?: string } | null;

  const [tenantId, setTenantId] = useState(state?.tenantId || '');
  const [email, setEmail] = useState(state?.email || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axiosClient.post('/auth/login', {
        tenantId,
        email,
        password
      });

      const { accessToken, refreshToken } = response.data;
      login(accessToken, refreshToken, tenantId);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '420px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(102, 252, 241, 0.1)', marginBottom: '16px' }}>
            <Shield size={32} className="text-accent" />
          </div>
          <h2 style={{ fontSize: '1.8rem' }}>Welcome Back</h2>
          <p>Login to your B2B Lending Dashboard</p>
        </div>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(244, 67, 54, 0.1)', color: '#f44336', border: '1px solid rgba(244, 67, 54, 0.3)', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="tenantId">Tenant ID</label>
            <input 
              type="text" 
              id="tenantId" 
              className="input-field" 
              placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              className="input-field" 
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              className="input-field" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn" style={{ width: '100%', marginTop: '12px' }} disabled={isLoading}>
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
          
          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
              Don't have an organization yet? <Link to="/register" style={{ color: '#66fcf1', textDecoration: 'none' }}>Register here</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
