import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CreateBorrower: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'BORROWER'
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // If not admin, shouldn't be here
  if (!user?.roles.includes('TENANT_ADMIN')) {
    return <div style={{ padding: '20px', color: '#f44336' }}>Unauthorized. Only Tenant Admins can create borrowers.</div>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await axiosClient.post('/users', formData);
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create borrower. Email might already be in use.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      
      <button 
        className="btn btn-secondary" 
        onClick={() => navigate('/dashboard')}
        style={{ marginBottom: '24px', padding: '8px 16px' }}
      >
        <ArrowLeft size={18} /> Back to Dashboard
      </button>

      <div className="glass-panel animate-fade-in" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(102, 252, 241, 0.1)', marginBottom: '16px' }}>
            <UserPlus size={32} className="text-accent" />
          </div>
          <h2 style={{ fontSize: '1.8rem', margin: 0 }}>Register Borrower</h2>
          <p>Create a new borrower account for your organization</p>
        </div>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(244, 67, 54, 0.1)', color: '#f44336', border: '1px solid rgba(244, 67, 54, 0.3)', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {success ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ color: '#4CAF50', fontSize: '1.2rem', marginBottom: '16px' }}>
              ✓ Borrower created successfully!
            </div>
            <p>They can now log in using your Tenant ID and their credentials.</p>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>Redirecting to dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="input-group">
                <label>First Name</label>
                <input 
                  type="text" 
                  name="firstName"
                  className="input-field" 
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label>Last Name</label>
                <input 
                  type="text" 
                  name="lastName"
                  className="input-field" 
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Email Address</label>
              <input 
                type="email" 
                name="email"
                className="input-field" 
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label>Temporary Password</label>
              <input 
                type="text" 
                name="password"
                className="input-field" 
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
              />
            </div>

            <button type="submit" className="btn" style={{ width: '100%', marginTop: '16px' }} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateBorrower;
