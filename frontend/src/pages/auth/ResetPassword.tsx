import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaLock, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import { adminAPI, teacherAPI } from '../../services/api';

const ResetPassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { email, otp, role } = location.state || {};

  if (!email || !otp) {
    navigate('/auth/forgot-password');
    return null;
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const api = role === 'admin' ? adminAPI : teacherAPI;
      const res = await api.verifyOTP({ email, otp, newPassword });
      if (res.data.success) {
        toast.success('Password reset successful! Please login with your new password.');
        navigate('/login');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6">
        <Link to="/auth/verify-otp" state={{ email }} className="inline-flex items-center text-primary-600 mb-4 text-sm">
          <FaArrowLeft className="mr-2" /> Back
        </Link>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full mb-4">
            <FaLock className="text-primary-600 text-xl" />
          </div>
          <h2 className="text-2xl font-bold">Reset Password</h2>
          <p className="text-gray-500 text-sm">Set a new secure password for your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field w-full pl-3 pr-3 py-2"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <div className="relative">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field w-full pl-3 pr-3 py-2"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full btn-primary py-2 font-bold flex items-center justify-center gap-2"
          >
            {loading ? 'Resetting...' : (
              <>
                <FaCheckCircle /> Reset Password
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
