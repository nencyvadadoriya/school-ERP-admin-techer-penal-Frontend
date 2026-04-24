import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminAPI, teacherAPI } from '../../services/api';
import { FaArrowLeft, FaEnvelope, FaUserShield, FaChalkboardTeacher, FaGraduationCap } from 'react-icons/fa';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [role, setRole] = useState<string>('admin');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
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
        toast.success('Verification code sent to your email!');
        navigate('/auth/verify-otp', { state: { email, role } });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4">
      <div className="w-full max-w-[380px] bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-2xl shadow-slate-200/50 animate-fade-in border border-white relative">
        

        {/* Header */}
        <div className="mb-4 pt-6 text-center">
          <h2 className="text-xl font-black text-[#1F2937] mb-0.5 tracking-tight">Forgot Password?</h2>
          
        </div>

        {/* Role Selector */}
        <div className="flex p-1 bg-slate-100/80 rounded-xl mb-6">
          <button
            onClick={() => setRole('admin')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[11px] font-black transition-all duration-300 ${
              role === 'admin'
                ? 'bg-white text-primary-600 shadow-sm ring-1 ring-slate-200'
                : 'text-[#6B7280]'
            }`}
          >
            <FaUserShield className={role === 'admin' ? 'text-primary-600' : 'text-slate-400'} size={14} />
            ADMIN
          </button>
          <button
            onClick={() => setRole('teacher')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[11px] font-black transition-all duration-300 ${
              role === 'teacher'
                ? 'bg-white text-primary-600 shadow-sm ring-1 ring-slate-200'
                : 'text-[#6B7280]'
            }`}
          >
            <FaChalkboardTeacher className={role === 'teacher' ? 'text-primary-600' : 'text-slate-400'} size={14} />
            TEACHER
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#1F2937] uppercase tracking-widest ml-1 opacity-60">Email Address</label>
            <div className="relative group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors">
                <FaEnvelope size={12} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 bg-white border border-slate-200 rounded-xl pl-10 pr-4 text-xs font-bold text-[#1F2937] transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 outline-none placeholder:text-slate-300"
                placeholder="name@school.com"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-[#002B5B] hover:bg-[#00224a] text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary-500/20 transition-all active:scale-[0.98] mt-2"
          >
            {loading ? 'Sending Code...' : 'Send Reset Code'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-100 pt-6">
          <p className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest">
            Back to <Link to="/login" className="text-primary-600 font-black">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
