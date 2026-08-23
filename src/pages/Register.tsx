import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { Building2 } from 'lucide-react';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    organizationName: '',
    schemaName: '',
    adminEmail: '',
    adminFirstName: '',
    adminLastName: '',
    adminPassword: '',
    industry: 'FINANCE'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Auto-generate schema name from organization name if user types in organization name
    if (name === 'organizationName' && !formData.schemaName) {
        const generatedSchema = value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 50);
        setFormData({ ...formData, [name]: value, schemaName: generatedSchema });
    } else {
        setFormData({ ...formData, [name]: value });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await axiosClient.post('/tenants/register', formData);
      const newTenant = response.data;
      
      setSuccess(`Organization registered successfully! Your Tenant ID is: ${newTenant.id}. Please save this ID to login.`);
      
      // Delay navigation so they can read the success message and copy their tenant ID
      setTimeout(() => {
        navigate('/login', { state: { tenantId: newTenant.id, email: formData.adminEmail }});
      }, 8000);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please check the form data.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '40px 20px' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(102, 252, 241, 0.1)', marginBottom: '16px' }}>
            <Building2 size={32} className="text-accent" />
          </div>
          <h2 style={{ fontSize: '1.8rem' }}>Register Organization</h2>
          <p>Onboard your company to the B2B Lending Engine</p>
        </div>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(244, 67, 54, 0.1)', color: '#f44336', border: '1px solid rgba(244, 67, 54, 0.3)', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ padding: '16px', background: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50', border: '1px solid rgba(76, 175, 80, 0.3)', borderRadius: '8px', marginBottom: '20px', fontSize: '0.95rem', fontWeight: 500, lineHeight: '1.5' }}>
            {success}
            <br/><br/>
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Redirecting to login in 8 seconds...</span>
          </div>
        )}

        {!success && (
          <form onSubmit={handleRegister}>
            <div className="input-group">
              <label htmlFor="organizationName">Organization Name</label>
              <input 
                type="text" 
                id="organizationName" 
                name="organizationName"
                className="input-field" 
                placeholder="e.g. Acme Financial Services"
                value={formData.organizationName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="schemaName">Database Schema Name (3-50 chars, lowercase & hyphens)</label>
              <input 
                type="text" 
                id="schemaName" 
                name="schemaName"
                className="input-field" 
                placeholder="e.g. acme-financial"
                value={formData.schemaName}
                onChange={handleChange}
                pattern="^[a-z0-9\-]{3,50}$"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group">
                <label htmlFor="adminFirstName">Admin First Name</label>
                <input 
                    type="text" 
                    id="adminFirstName" 
                    name="adminFirstName"
                    className="input-field" 
                    placeholder="John"
                    value={formData.adminFirstName}
                    onChange={handleChange}
                    required
                />
                </div>

                <div className="input-group">
                <label htmlFor="adminLastName">Admin Last Name</label>
                <input 
                    type="text" 
                    id="adminLastName" 
                    name="adminLastName"
                    className="input-field" 
                    placeholder="Doe"
                    value={formData.adminLastName}
                    onChange={handleChange}
                    required
                />
                </div>
            </div>

            <div className="input-group">
              <label htmlFor="adminEmail">Admin Email</label>
              <input 
                type="email" 
                id="adminEmail" 
                name="adminEmail"
                className="input-field" 
                placeholder="admin@acme.com"
                value={formData.adminEmail}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="adminPassword">Admin Password (min 8 chars)</label>
              <input 
                type="password" 
                id="adminPassword" 
                name="adminPassword"
                className="input-field" 
                placeholder="••••••••"
                value={formData.adminPassword}
                onChange={handleChange}
                minLength={8}
                required
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="industry">Industry</label>
              <select 
                id="industry" 
                name="industry"
                className="input-field" 
                value={formData.industry}
                onChange={handleChange}
                required
              >
                <option value="FINANCE">Finance</option>
                <option value="TECHNOLOGY">Technology</option>
                <option value="HEALTHCARE">Healthcare</option>
                <option value="RETAIL">Retail</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <button type="submit" className="btn" style={{ width: '100%', marginTop: '12px' }} disabled={isLoading}>
              {isLoading ? 'Provisioning Tenant...' : 'Register Organization'}
            </button>
            
            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                Already have a tenant account? <Link to="/login" style={{ color: '#66fcf1', textDecoration: 'none' }}>Log In here</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Register;
