import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const VerifyEmail: React.FC = () => {
  const [code, setCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success('Email verified!');
    setLoading(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6">
        <h2 className="text-2xl font-bold mb-2">Verify Email</h2>
        <p className="text-gray-600 text-sm mb-6">Enter verification code</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            className="input-field w-full px-3 py-2 text-center text-2xl tracking-widest mb-4"
            placeholder="000000"
            required
          />
          <button type="submit" disabled={loading} className="w-full btn-primary py-2">
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>
        <Link to="/login" className="block text-center text-primary-600 mt-4 text-sm">
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmail;
