import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI, teacherAPI, studentAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FaUserShield, FaChalkboardTeacher, FaUserGraduate, FaKey } from 'react-icons/fa';

const Login: React.FC = () => {
  const [userType, setUserType] = useState<'admin' | 'teacher'>('admin');
  const [formData, setFormData] = useState<any>({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
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
      toast.success('Login successful!');
      
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary-600 mb-2">
            School ERP
          </h1>
          <p className="text-sm text-gray-600">Admin & Teacher Panel</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              type="button"
              onClick={() => setUserType('admin')}
              className={`flex flex-col items-center p-2 rounded-lg border-2 transition-all ${
                userType === 'admin'
                  ? 'border-primary-500 bg-primary-50 text-primary-600'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FaUserShield className="text-xl mb-1" />
              <span className="text-xs font-medium">Admin</span>
            </button>
            <button
              type="button"
              onClick={() => setUserType('teacher')}
              className={`flex flex-col items-center p-2 rounded-lg border-2 transition-all ${
                userType === 'teacher'
                  ? 'border-primary-500 bg-primary-50 text-primary-600'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FaChalkboardTeacher className="text-xl mb-1" />
              <span className="text-xs font-medium">Teacher</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {userType === 'admin' ? 'Email Address' : 'Email / Teacher Code'}
              </label>
              <input
                type="text"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field w-full px-3 py-2 text-sm"
                placeholder={userType === 'admin' ? 'Enter your email' : 'Enter email or teacher code'}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field w-full px-3 py-2 text-sm"
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <Link to="/auth/forgot-password" className="text-primary-600 hover:text-primary-700">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
