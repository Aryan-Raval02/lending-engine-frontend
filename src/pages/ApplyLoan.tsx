import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { FileText, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ApplyLoan: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    requestedAmount: '',
    termMonths: '12',
    loanPurpose: 'WORKING_CAPITAL',
    businessDescription: '',
    annualRevenue: '',
    existingDebt: '0'
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // If not borrower, shouldn't be here
  if (!user?.roles.includes('BORROWER')) {
    return <div style={{ padding: '20px', color: '#f44336' }}>Unauthorized. Only Borrowers can apply for loans.</div>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const payload = {
        requestedAmount: parseFloat(formData.requestedAmount),
        termMonths: parseInt(formData.termMonths, 10),
        loanPurpose: formData.loanPurpose,
        businessDescription: formData.businessDescription,
        annualRevenue: formData.annualRevenue ? parseFloat(formData.annualRevenue) : null,
        existingDebt: formData.existingDebt ? parseFloat(formData.existingDebt) : 0
      };

      await axiosClient.post('/loans/applications', payload);
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit loan application.');
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

      <div className="glass-panel animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(102, 252, 241, 0.1)', marginBottom: '16px' }}>
            <FileText size={32} className="text-accent" />
          </div>
          <h2 style={{ fontSize: '1.8rem', margin: 0 }}>Apply for a Loan</h2>
          <p>Submit your financing request for AI risk evaluation</p>
        </div>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(244, 67, 54, 0.1)', color: '#f44336', border: '1px solid rgba(244, 67, 54, 0.3)', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {success ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ color: '#4CAF50', fontSize: '1.2rem', marginBottom: '16px' }}>
              ✓ Application submitted successfully!
            </div>
            <p>Your application is currently undergoing AI Risk Evaluation.</p>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>Redirecting to dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="input-group">
                <label>Requested Amount ($)</label>
                <input 
                  type="number" 
                  name="requestedAmount"
                  className="input-field" 
                  placeholder="e.g. 50000"
                  value={formData.requestedAmount}
                  onChange={handleChange}
                  required
                  min="1000"
                />
              </div>

              <div className="input-group">
                <label>Term (Months)</label>
                <select 
                  name="termMonths"
                  className="input-field" 
                  value={formData.termMonths}
                  onChange={handleChange}
                  required
                >
                  <option value="6">6 Months</option>
                  <option value="12">12 Months</option>
                  <option value="24">24 Months</option>
                  <option value="36">36 Months</option>
                  <option value="48">48 Months</option>
                  <option value="60">60 Months</option>
                </select>
              </div>
            </div>

            <div className="input-group">
              <label>Loan Purpose</label>
              <select 
                name="loanPurpose"
                className="input-field" 
                value={formData.loanPurpose}
                onChange={handleChange}
                required
              >
                <option value="WORKING_CAPITAL">Working Capital</option>
                <option value="EQUIPMENT">Equipment Purchase</option>
                <option value="REAL_ESTATE">Real Estate</option>
                <option value="REFINANCING">Refinancing</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="input-group">
              <label>Business Description</label>
              <textarea 
                name="businessDescription"
                className="input-field" 
                placeholder="Briefly describe what your business does and why you need this loan..."
                value={formData.businessDescription}
                onChange={handleChange}
                required
                rows={4}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="input-group">
                <label>Annual Revenue ($)</label>
                <input 
                  type="number" 
                  name="annualRevenue"
                  className="input-field" 
                  placeholder="e.g. 1200000"
                  value={formData.annualRevenue}
                  onChange={handleChange}
                  required
                  min="0"
                />
              </div>

              <div className="input-group">
                <label>Existing Debt ($)</label>
                <input 
                  type="number" 
                  name="existingDebt"
                  className="input-field" 
                  placeholder="e.g. 50000"
                  value={formData.existingDebt}
                  onChange={handleChange}
                  min="0"
                />
              </div>
            </div>

            <button type="submit" className="btn" style={{ width: '100%', marginTop: '16px' }} disabled={isLoading}>
              {isLoading ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ApplyLoan;
