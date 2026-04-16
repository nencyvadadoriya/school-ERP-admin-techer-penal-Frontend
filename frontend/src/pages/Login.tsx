import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminAPI, teacherAPI, studentAPI } from '../services/api';
import { toast } from 'react-toastify';
import { FaUserShield, FaChalkboardTeacher, FaUserGraduate } from 'react-icons/fa';

const Login: React.FC = () => {
  const [userType, setUserType] = useState<string>('admin');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    gr_number: '',
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
      } else if (userType === 'teacher') {
        const v = formData.email.trim();
          if (v.includes('@')) {
            loginData = { email: v.toLowerCase(), password: formData.password };
        } else {
          loginData = { teacher_code: v, password: formData.password };
        }
        response = await teacherAPI.login(loginData);
      } else {
        loginData = { gr_number: formData.gr_number, password: formData.password };
        response = await studentAPI.login(loginData);
      }

      const { data, token } = response.data;
      const userData = { ...data, role: userType };
      
      login(userData, token);
      toast.success('Login successful!');
      
      // Navigate based on user type
      if (userType === 'admin') {
        navigate('/admin/dashboard');
      } else if (userType === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-sm w-full"> {/* Changed from max-w-md to max-w-sm for reduced width */}
        {/* Logo/Title */}
        <div className="text-center mb-6"> {/* Reduced margin from mb-8 to mb-6 */}
          <h1 className="text-3xl font-bold text-primary-600 mb-2"> {/* Reduced text size from text-4xl to text-3xl */}
            School ERP
          </h1>
          <p className="text-sm text-gray-600">Welcome back! Please login to continue</p> {/* Reduced text size */}
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6"> {/* Reduced padding from p-8 to p-6 */}
          {/* User Type Selection */}
          <div className="grid grid-cols-3 gap-2 mb-4"> {/* Reduced margin from mb-6 to mb-4 */}
            <button
              type="button"
              onClick={() => setUserType('admin')}
              className={`flex flex-col items-center p-2 rounded-lg border-2 transition-all ${
                userType === 'admin'
                  ? 'border-primary-500 bg-primary-50 text-primary-600'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FaUserShield className="text-xl mb-1" /> {/* Reduced icon size from text-2xl to text-xl */}
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
              <FaChalkboardTeacher className="text-xl mb-1" /> {/* Reduced icon size from text-2xl to text-xl */}
              <span className="text-xs font-medium">Teacher</span>
            </button>
            <button
              type="button"
              onClick={() => setUserType('student')}
              className={`flex flex-col items-center p-2 rounded-lg border-2 transition-all ${
                userType === 'student'
                  ? 'border-primary-500 bg-primary-50 text-primary-600'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FaUserGraduate className="text-xl mb-1" /> {/* Reduced icon size from text-2xl to text-xl */}
              <span className="text-xs font-medium">Student</span>
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-3"> {/* Reduced spacing from space-y-4 to space-y-3 */}
            {userType === 'student' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1"> {/* Reduced margin from mb-2 to mb-1 */}
                  GR Number
                </label>
                <input
                  type="text"
                  name="gr_number"
                  value={formData.gr_number}
                  onChange={handleChange}
                  className="input-field w-full px-3 py-2 text-sm" 
                  placeholder="Enter your GR number"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1"> {/* Reduced margin from mb-2 to mb-1 */}
                    Email Address / Teacher Code
                  </label>
                  <input
                    type="text"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field w-full px-3 py-2 text-sm"
                    placeholder="Enter your email or teacher code"
                    required
                  />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1"> {/* Reduced margin from mb-2 to mb-1 */}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2 text-base disabled:opacity-50 disabled:cursor-not-allowed" /* Reduced padding and text size */
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