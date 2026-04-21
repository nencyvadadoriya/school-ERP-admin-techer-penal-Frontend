import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI, teacherAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FaUserShield, FaChalkboardTeacher, FaEye, FaEyeSlash, FaGraduationCap } from 'react-icons/fa';

const Login: React.FC = () => {
  const [userType, setUserType] = useState<'admin' | 'teacher'>('admin');
  const [formData, setFormData] = useState<any>({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: any) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      let response;
      let loginData;

      if (userType === 'admin') {
        loginData = { email: formData.email, password: formData.password };
        response = await adminAPI.login(loginData);
      } else {
        const v = formData.email.trim();
        if (v.includes('@')) {
          loginData = { email: v.toLowerCase(), password: formData.password };
        } else {
          loginData = { teacher_code: v, password: formData.password };
        }
        response = await teacherAPI.login(loginData);
      }

      const { data, token } = response.data;
      const userData = { ...data, role: userType };
      
      login(userData, token);
      toast.success('Welcome back! Login successful');
      
      if (userType === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/teacher/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex overflow-hidden">
      {/* Left Side - Visual/Marketing */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-500 to-primary-700 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-[-10%] left-[-10%] w-64 h-64 rounded-full bg-white blur-3xl"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full bg-white blur-3xl"></div>
        </div>
        
        <div className="relative z-10 text-white max-w-lg">
          <div className="bg-white/20 p-4 rounded-2xl w-fit mb-8 backdrop-blur-sm">
            <FaGraduationCap className="text-5xl" />
          </div>
          <h2 className="text-5xl font-extrabold mb-6 leading-tight tracking-tight">
            Manage Your School with Confidence
          </h2>
          <p className="text-xl text-primary-50 leading-relaxed mb-8">
            Empowering administrators and teachers with an all-in-one ERP solution for seamless school management.
          </p>
          <div className="flex gap-4">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 flex-1">
              <p className="text-3xl font-bold">100%</p>
              <p className="text-sm text-primary-100">Digital workflow</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 flex-1">
              <p className="text-3xl font-bold">24/7</p>
              <p className="text-sm text-primary-100">Live support</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form (Centered Card for Mobile) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-[380px] bg-white lg:bg-transparent rounded-[2.5rem] lg:rounded-none p-6 sm:p-8 lg:p-0 shadow-2xl shadow-slate-200/50 lg:shadow-none animate-fade-in border border-white lg:border-none">
          {/* Logo Section */}
          <div className="mb-4 text-center">
            <div className="inline-flex items-center justify-center p-2.5 bg-primary-50 rounded-2xl mb-2">
              <FaGraduationCap className="text-3xl text-primary-600" />
            </div>
            <h1 className="text-2xl font-black text-[#1F2937] tracking-tight">School ERP</h1>
          </div>

          <div className="mb-4 text-center hidden lg:block">
            <h2 className="text-xl font-black text-[#1F2937] mb-0.5 tracking-tight">Welcome Back</h2>
            <p className="text-[11px] text-[#6B7280] font-bold uppercase tracking-widest opacity-60">Access your dashboard</p>
          </div>

          {/* Role Selector */}
          <div className="flex p-1 bg-slate-100/80 rounded-xl mb-6">
            <button
              onClick={() => setUserType('admin')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[11px] font-black transition-all duration-300 ${
                userType === 'admin'
                  ? 'bg-white text-primary-600 shadow-sm ring-1 ring-slate-200'
                  : 'text-[#6B7280]'
              }`}
            >
              <FaUserShield className={userType === 'admin' ? 'text-primary-600' : 'text-slate-400'} size={14} />
              ADMIN
            </button>
            <button
              onClick={() => setUserType('teacher')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[11px] font-black transition-all duration-300 ${
                userType === 'teacher'
                  ? 'bg-white text-primary-600 shadow-sm ring-1 ring-slate-200'
                  : 'text-[#6B7280]'
              }`}
            >
              <FaChalkboardTeacher className={userType === 'teacher' ? 'text-primary-600' : 'text-slate-400'} size={14} />
              TEACHER
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[#1F2937] uppercase tracking-widest ml-1 opacity-60">
                {userType === 'admin' ? 'Email Address' : 'Email / Code'}
              </label>
              <input
                type="text"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 text-xs font-bold text-[#1F2937] transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 outline-none placeholder:text-slate-300"
                placeholder="Enter details"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black text-[#1F2937] uppercase tracking-widest opacity-60">Password</label>
                <Link 
                  to="/auth/forgot-password" 
                  className="text-[10px] font-black text-primary-600 hover:text-primary-700 uppercase tracking-wider transition-colors"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#002B5B] hover:bg-[#00224a] text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary-500/20 transition-all active:scale-[0.98] mt-2"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Checking...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <p className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest">
              Technical help? <a href="#" className="text-primary-600 font-black">Support</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
