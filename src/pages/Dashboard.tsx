import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { LogOut, LayoutDashboard, Plus, FileText, CheckCircle, XCircle, UserPlus, TrendingUp, AlertTriangle, Download } from 'lucide-react';
import RiskGauge from '../components/RiskGauge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface LoanApplication {
  id: string;
  requestedAmount: number;
  termMonths: number;
  loanPurpose: string;
  status: string;
  riskScore: number;
  riskCategory: string;
  createdAt: string;
  borrowerName: string;
}

interface RepaymentSchedule {
  id: string;
  installmentNumber: number;
  dueDate: string;
  emiAmount: number;
  principalComponent: number;
  interestComponent: number;
  closingBalance: number;
  status: string;
  paidDate: string | null;
  paidAmount: number | null;
}

interface Loan {
  id: string;
  loanReference: string;
  principalAmount: number;
  annualInterestRate: number;
  termMonths: number;
  monthlyEmi: number;
  outstandingBalance: number;
  totalInterestPayable: number;
  disbursementDate: string;
  maturityDate: string;
  status: string;
  borrowerName: string;
  repaymentSchedule: RepaymentSchedule[];
}

import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [schedulePage, setSchedulePage] = useState(1);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const SCHEDULE_ITEMS_PER_PAGE = 6;

  const isOfficer = user?.roles.includes('LOAN_OFFICER') || user?.roles.includes('TENANT_ADMIN');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const promises = [
        axiosClient.get('/loans/applications'),
        axiosClient.get('/loans')
      ];
      if (isOfficer) {
        promises.push(axiosClient.get('/analytics/overview'));
      }

      const results = await Promise.all(promises);
      setApplications(results[0].data.content || []);
      setLoans(results[1].data.content || []);
      if (isOfficer) {
        setAnalytics(results[2].data);
      }
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await axiosClient.get('/loans/applications');
      setApplications(response.data.content || []);
    } catch (err) {
      setError('Failed to refresh applications.');
    }
  };

  const fetchLoans = async () => {
    try {
      const response = await axiosClient.get('/loans');
      setLoans(response.data.content || []);
    } catch (err) {
      setError('Failed to refresh loans.');
    }
  };

  const handleMarkPaid = async (loanId: string, scheduleId: string) => {
    if (window.confirm('Are you sure you want to mark this installment as Paid?')) {
      try {
        await axiosClient.post(`/loans/${loanId}/repayments/${scheduleId}/pay`);
        fetchLoans();
        if (isOfficer) {
          const analyticsRes = await axiosClient.get('/analytics/overview');
          setAnalytics(analyticsRes.data);
        }
      } catch (err) {
        alert('Failed to mark as paid');
      }
    }
  };

  const handleDownloadPdf = async (loanId: string, loanReference: string) => {
    try {
      const response = await axiosClient.get(`/loans/${loanId}/schedule/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `repayment_schedule_${loanReference}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download PDF');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'APPROVED': return 'badge badge-status-approved';
      case 'REJECTED': return 'badge badge-status-rejected';
      case 'DISBURSED': return 'badge badge-status-active';
      default: return 'badge badge-status-submitted';
    }
  };

  const getRiskBadgeClass = (category: string) => {
    switch(category) {
      case 'LOW': return 'badge badge-risk-low';
      case 'MEDIUM': return 'badge badge-risk-medium';
      case 'HIGH': return 'badge badge-risk-high';
      case 'VERY_HIGH': return 'badge badge-risk-very-high';
      default: return 'badge badge-status-submitted';
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <header className="flex items-center justify-between animate-fade-in" style={{ marginBottom: '40px', marginTop: '20px' }}>
        <div className="flex items-center gap-4">
          <div style={{ background: 'rgba(102, 252, 241, 0.1)', padding: '12px', borderRadius: '12px' }}>
            <LayoutDashboard size={28} className="text-accent" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem' }}>Lending Dashboard</h1>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              Welcome back, {isOfficer ? 'Loan Officer' : 'Borrower'} • Tenant ID: <span style={{ fontFamily: 'monospace' }}>{user?.tenantId.substring(0,8)}...</span>
            </p>
          </div>
        </div>
        <button onClick={logout} className="btn btn-secondary">
          <LogOut size={18} /> Logout
        </button>
      </header>

      {/* Main Content Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        
        {/* Analytics Overview (Officers Only) */}
        {isOfficer && analytics && (
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={24} className="text-accent" /> Portfolio Analytics
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              
              {/* Stat Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ padding: '16px', background: 'rgba(102, 252, 241, 0.1)', borderRadius: '12px' }}>
                    <CheckCircle size={32} className="text-accent" />
                  </div>
                  <div>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Disbursed</p>
                    <h3 style={{ margin: 0, fontSize: '1.8rem' }}>${analytics.totalDisbursed.toLocaleString()}</h3>
                  </div>
                </div>
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ padding: '16px', background: 'rgba(255, 152, 0, 0.1)', borderRadius: '12px' }}>
                    <AlertTriangle size={32} style={{ color: '#ff9800' }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Outstanding</p>
                    <h3 style={{ margin: 0, fontSize: '1.8rem' }}>${analytics.totalOutstanding.toLocaleString()}</h3>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="glass-panel" style={{ padding: '16px', height: '240px' }}>
                <h4 style={{ margin: '0 0 16px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>Risk Distribution</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(analytics.riskDistribution || {}).map(([name, value]) => ({ name, value }))} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
                    <YAxis stroke="var(--text-secondary)" fontSize={12} allowDecimals={false} />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ background: 'var(--bg-color)', border: '1px solid var(--panel-border)', borderRadius: '8px' }} />
                    <Bar dataKey="value" fill="var(--accent-color)" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex justify-between items-center">
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>
            {isOfficer ? 'Application Queue' : 'My Applications'}
          </h2>
          <div>
            {!isOfficer && (
              <button className="btn" onClick={() => navigate('/apply-loan')}>
                <Plus size={18} /> Apply for Loan
              </button>
            )}
            {user?.roles.includes('TENANT_ADMIN') && (
              <button className="btn btn-secondary" style={{ marginLeft: '12px' }} onClick={() => navigate('/create-borrower')}>
                <UserPlus size={18} /> Add Borrower
              </button>
            )}
          </div>
        </div>

        {error && <div style={{ color: '#f44336' }}>{error}</div>}

        {loading ? (
          <p>Loading portfolio...</p>
        ) : applications.length === 0 ? (
          <div className="glass-panel text-center" style={{ padding: '48px' }}>
            <FileText size={48} style={{ opacity: 0.3, marginBottom: '16px', display: 'inline-block' }} />
            <h3>No applications found</h3>
            <p>You haven't submitted any loan applications yet.</p>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reference ID</th>
                  {isOfficer && <th>Borrower</th>}
                  <th>Amount</th>
                  <th>Term</th>
                  <th>Status</th>
                  <th>AI Risk Assessment</th>
                  {isOfficer && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td><span style={{ fontFamily: 'monospace' }}>{app.id.substring(0,8)}...</span></td>
                    {isOfficer && <td>{app.borrowerName}</td>}
                    <td style={{ fontWeight: 600 }}>${app.requestedAmount.toLocaleString()}</td>
                    <td>{app.termMonths} mo</td>
                    <td>
                      <span className={getStatusBadgeClass(app.status)}>{app.status.replace(/_/g, ' ')}</span>
                    </td>
                    <td>
                      {app.riskScore ? (
                         <div className="flex items-center gap-4">
                           <span className={getRiskBadgeClass(app.riskCategory)}>{app.riskCategory}</span>
                           <RiskGauge score={app.riskScore} size={40} />
                         </div>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>N/A</span>
                      )}
                    </td>
                    {isOfficer && (
                      <td>
                        <div className="flex gap-4">
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px', opacity: app.status === 'PENDING_OFFICER_REVIEW' ? 1 : 0.5 }} 
                            title="Approve"
                            disabled={app.status !== 'PENDING_OFFICER_REVIEW'}
                            onClick={async () => {
                              if(window.confirm('Approve this loan?')) {
                                try {
                                  await axiosClient.post(`/loans/applications/${app.id}/approve`, null, {
                                    params: {
                                      approvedAmount: app.requestedAmount,
                                      interestRate: 0.125,
                                      notes: "Approved via dashboard"
                                    }
                                  });
                                  fetchApplications();
                                } catch (e) {
                                  alert('Failed to approve loan');
                                }
                              }
                            }}
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px', color: 'var(--risk-high)', borderColor: 'var(--risk-high)', opacity: app.status === 'PENDING_OFFICER_REVIEW' ? 1 : 0.5 }} 
                            title="Reject"
                            disabled={app.status !== 'PENDING_OFFICER_REVIEW'}
                            onClick={async () => {
                              if(window.confirm('Reject this loan?')) {
                                try {
                                  await axiosClient.post(`/loans/applications/${app.id}/reject`, null, {
                                    params: {
                                      rejectionNotes: "Rejected via dashboard"
                                    }
                                  });
                                  fetchApplications();
                                } catch (e) {
                                  alert('Failed to reject loan');
                                }
                              }
                            }}
                          >
                            <XCircle size={18} />
                          </button>
                          {app.status === 'APPROVED' && (
                            <button 
                              className="btn" 
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }} 
                              onClick={async () => {
                                if(window.confirm('Disburse this loan now? This will generate the repayment schedule.')) {
                                  try {
                                    await axiosClient.post(`/loans/applications/${app.id}/disburse`);
                                    fetchData();
                                    alert('Loan disbursed successfully!');
                                  } catch (e) {
                                    alert('Failed to disburse loan');
                                  }
                                }
                              }}
                            >
                              Disburse
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Active Loans Section */}
        <div className="flex justify-between items-center" style={{ marginTop: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>
            Active Loans
          </h2>
        </div>

        {loading ? (
          <p>Loading active loans...</p>
        ) : loans.length === 0 ? (
          <div className="glass-panel text-center" style={{ padding: '48px' }}>
            <FileText size={48} style={{ opacity: 0.3, marginBottom: '16px', display: 'inline-block' }} />
            <h3>No active loans</h3>
            <p>You don't have any active loans at the moment.</p>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Loan Reference</th>
                  {isOfficer && <th>Borrower</th>}
                  <th>Principal</th>
                  <th>Interest Rate</th>
                  <th>Monthly EMI</th>
                  <th>Disbursed On</th>
                  <th>Outstanding</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => (
                  <React.Fragment key={loan.id}>
                    <tr>
                      <td><span style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{loan.loanReference}</span></td>
                      {isOfficer && <td>{loan.borrowerName}</td>}
                      <td style={{ fontWeight: 600 }}>${loan.principalAmount.toLocaleString()}</td>
                      <td>{(loan.annualInterestRate * 100).toFixed(2)}%</td>
                      <td>${loan.monthlyEmi.toLocaleString()}</td>
                      <td>{loan.disbursementDate}</td>
                      <td style={{ color: 'var(--risk-high)' }}>${loan.outstandingBalance.toLocaleString()}</td>
                      <td>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          onClick={() => {
                            if (selectedLoan?.id === loan.id) {
                              setSelectedLoan(null);
                            } else {
                              setSelectedLoan(loan);
                              setSchedulePage(1);
                            }
                          }}
                        >
                          {selectedLoan?.id === loan.id ? 'Hide Schedule' : 'View Schedule'}
                        </button>
                      </td>
                    </tr>
                    {selectedLoan?.id === loan.id && (
                      <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                        <td colSpan={isOfficer ? 8 : 7} style={{ padding: '24px' }}>
                          <div className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
                            <h4 style={{ margin: 0, color: 'var(--accent)' }}>Repayment Schedule</h4>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                              onClick={() => handleDownloadPdf(loan.id, loan.loanReference)}
                            >
                              <Download size={14} /> Download PDF
                            </button>
                          </div>
                          <table className="data-table" style={{ background: 'transparent' }}>
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>Due Date</th>
                                <th>EMI Amount</th>
                                <th>Principal</th>
                                <th>Interest</th>
                                <th>Closing Balance</th>
                                <th>Status</th>
                                {isOfficer && <th>Action</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {loan.repaymentSchedule
                                .slice((schedulePage - 1) * SCHEDULE_ITEMS_PER_PAGE, schedulePage * SCHEDULE_ITEMS_PER_PAGE)
                                .map(schedule => (
                                <tr key={schedule.id}>
                                  <td>{schedule.installmentNumber}</td>
                                  <td>{schedule.dueDate}</td>
                                  <td style={{ fontWeight: 600 }}>${schedule.emiAmount.toLocaleString()}</td>
                                  <td>${schedule.principalComponent.toLocaleString()}</td>
                                  <td>${schedule.interestComponent.toLocaleString()}</td>
                                  <td>${schedule.closingBalance.toLocaleString()}</td>
                                  <td>
                                    <span className={schedule.status === 'PAID' ? 'badge badge-status-approved' : 'badge badge-status-submitted'}>
                                      {schedule.status}
                                    </span>
                                  </td>
                                  {isOfficer && (
                                    <td>
                                      {schedule.status === 'PENDING' && (
                                        <button
                                          className="btn btn-secondary"
                                          style={{ padding: '4px 10px', fontSize: '0.75rem', borderColor: 'var(--accent)', color: 'var(--accent)' }}
                                          onClick={() => handleMarkPaid(loan.id, schedule.id)}
                                        >
                                          Mark Paid
                                        </button>
                                      )}
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {loan.repaymentSchedule.length > SCHEDULE_ITEMS_PER_PAGE && (
                            <div className="flex justify-between items-center" style={{ marginTop: '16px', padding: '0 8px' }}>
                              <button 
                                className="btn btn-secondary"
                                style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                                disabled={schedulePage === 1}
                                onClick={() => setSchedulePage(p => Math.max(1, p - 1))}
                              >
                                Previous
                              </button>
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Page {schedulePage} of {Math.ceil(loan.repaymentSchedule.length / SCHEDULE_ITEMS_PER_PAGE)}
                              </span>
                              <button 
                                className="btn btn-secondary"
                                style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                                disabled={schedulePage >= Math.ceil(loan.repaymentSchedule.length / SCHEDULE_ITEMS_PER_PAGE)}
                                onClick={() => setSchedulePage(p => p + 1)}
                              >
                                Next
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;
