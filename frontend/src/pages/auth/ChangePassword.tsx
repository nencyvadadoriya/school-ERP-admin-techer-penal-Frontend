import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const ChangePassword: React.FC = () => {
  const [formData, setFormData] = useState<any>({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (formData.new_password !== formData.confirm_password) {
      toast.error('Passwords do not match!');
      return;
    }
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success('Password changed!');
    setLoading(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6">
        <h2 className="text-2xl font-bold mb-2">Change Password</h2>
        <p className="text-gray-600 text-sm mb-6">Enter new password</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            name="current_password"
            value={formData.current_password}
            onChange={handleChange}
            className="input-field w-full px-3 py-2"
            placeholder="Current Password"
            required
          />
          <input
            type="password"
            name="new_password"
            value={formData.new_password}
            onChange={handleChange}
            className="input-field w-full px-3 py-2"
            placeholder="New Password"
            required
          />
          <input
            type="password"
            name="confirm_password"
            value={formData.confirm_password}
            onChange={handleChange}
            className="input-field w-full px-3 py-2"
            placeholder="Confirm Password"
            required
          />
          <button type="submit" disabled={loading} className="w-full btn-primary py-2">
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
        <Link to="/login" className="block text-center text-primary-600 mt-4 text-sm">
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default ChangePassword;
