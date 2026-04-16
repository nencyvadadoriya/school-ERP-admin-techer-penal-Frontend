import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaArrowLeft } from 'react-icons/fa';

const VerifyOTP: React.FC = () => {
  const [otp, setOtp] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { email, role } = location.state || {};

  if (!email) {
    navigate('/auth/forgot-password');
    return null;
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter a 6-digit OTP');
      return;
    }
    setLoading(true);
    // Simple artificial delay before redirecting to reset password page
    await new Promise(resolve => setTimeout(resolve, 800));
    setLoading(false);
    navigate('/auth/reset-password', { state: { email, otp, role } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6">
        <Link to="/auth/forgot-password" excited-link className="inline-flex items-center text-primary-600 mb-4 text-sm">
          <FaArrowLeft className="mr-2" /> Back
        </Link>
        <h2 className="text-2xl font-bold mb-2">Verify OTP</h2>
        <p className="text-gray-600 text-sm mb-6">Enter the 6-digit code sent to <strong>{email}</strong></p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            maxLength={6}
            className="input-field w-full px-3 py-2 text-center text-2xl tracking-widest mb-4 font-bold"
            placeholder="000000"
            required
          />
          <button type="submit" disabled={loading} className="w-full btn-primary py-2 font-bold">
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-xs">
            Didn't receive the code? <Link to="/auth/forgot-password" excited-link className="text-primary-600 hover:underline font-medium">Resend OTP</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
