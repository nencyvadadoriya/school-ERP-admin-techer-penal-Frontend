import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaLock, FaCheckCircle, FaArrowLeft, FaEye, FaEyeSlash, FaShieldAlt } from 'react-icons/fa';
import { adminAPI, teacherAPI } from '../../services/api';

const ResetPassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
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
    <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4">
      <div className="w-full max-w-[380px] bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-2xl shadow-slate-200/50 animate-fade-in border border-white relative">
        {/* Top-Left Back Button */}
        <div className="absolute top-6 left-6">
          <Link 
            to="/auth/verify-otp" 
            state={{ email, role }}
            className="inline-flex items-center text-[10px] font-black text-[#6B7280] uppercase tracking-wider hover:text-primary-600 transition-colors group"
          >
            <FaArrowLeft className="mr-1.5 transition-transform group-hover:-translate-x-0.5" size={10} /> 
            Back
          </Link>
        </div>

        {/* Header */}
        <div className="mb-4 pt-6 text-center">
          <div className="inline-flex items-center justify-center p-2.5 bg-primary-50 rounded-2xl mb-2">
            <FaLock className="text-3xl text-primary-600" />
          </div>
          <h2 className="text-xl font-black text-[#1F2937] mb-0.5 tracking-tight">New Password</h2>
          <p className="text-[11px] text-[#6B7280] font-bold uppercase tracking-widest opacity-60 hidden sm:block">
            Create a secure password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#1F2937] uppercase tracking-widest ml-1 opacity-60">New Password</label>
            <div className="relative group">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 pr-10 text-xs font-bold text-[#1F2937] transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 outline-none placeholder:text-slate-300"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1"
              >
                {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#1F2937] uppercase tracking-widest ml-1 opacity-60">Confirm Password</label>
            <div className="relative group">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 pr-10 text-xs font-bold text-[#1F2937] transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 outline-none placeholder:text-slate-300"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1"
              >
                {showConfirmPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-[#002B5B] hover:bg-[#00224a] text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary-500/20 transition-all active:scale-[0.98] mt-2"
          >
            {loading ? 'Updating...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
