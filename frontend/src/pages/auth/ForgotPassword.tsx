import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminAPI, teacherAPI } from '../../services/api';
import { FaAlignLeft } from 'react-icons/fa';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [role, setRole] = useState<string>('admin');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Try to detect role from URL or state if needed, default to admin
    const searchParams = new URLSearchParams(location.search);
    const roleParam = searchParams.get('role');
    if (roleParam === 'teacher') setRole('teacher');
  }, [location]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const api = role === 'admin' ? adminAPI : teacherAPI;
      const res = await api.forgotPassword({ email });
      if (res.data.success) {
        toast.success('OTP sent to your email!');
        navigate('/auth/verify-otp', { state: { email, role } });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6">
        <Link to="/login" className="inline-flex items-center text-primary-600 mb-4 text-sm">
          <FaAlignLeft className="mr-2" /> Back to Login
        </Link>
        <h2 className="text-2xl font-bold mb-2">Forgot Password?</h2>
        <p className="text-gray-600 text-sm mb-6">
          Select your role and enter email to receive OTP
        </p>
        
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setRole('admin')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg border ${role === 'admin' ? 'bg-primary-50 border-primary-600 text-primary-600' : 'bg-white border-gray-200 text-gray-500'}`}
          >
            Admin
          </button>
          <button
            onClick={() => setRole('teacher')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg border ${role === 'teacher' ? 'bg-primary-50 border-primary-600 text-primary-600' : 'bg-white border-gray-200 text-gray-500'}`}
          >
            Teacher
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field w-full px-3 py-2 mb-4"
            placeholder="Email"
            required
          />
          <button type="submit" disabled={loading} className="w-full btn-primary py-2">
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
