import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaEnvelope } from 'react-icons/fa';

const VerifyOTP: React.FC = () => {
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { email, role } = location.state || {};

  useEffect(() => {
    if (!email) {
      navigate('/auth/forgot-password');
    }
  }, [email, navigate]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return false;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus next input
    if (element.value !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const data = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(data)) return;

    const newOtp = [...otp];
    data.split("").forEach((char, index) => {
      newOtp[index] = char;
      if (index < 5) inputRefs.current[index + 1]?.focus();
    });
    setOtp(newOtp);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }
    setLoading(true);
    // Simple artificial delay before redirecting to reset password page
    await new Promise(resolve => setTimeout(resolve, 800));
    setLoading(false);
    navigate('/auth/reset-password', { state: { email, otp: otpString, role } });
  };

  if (!email) return null;

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[480px] bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-2xl shadow-slate-200/50 animate-fade-in border border-white relative">
        {/* Top-Left Back Button */}
        <div className="absolute top-6 left-6">
          <Link 
            to="/auth/forgot-password" 
            className="inline-flex items-center text-xs font-black text-[#6B7280] uppercase tracking-wider hover:text-[#002B5B] transition-colors group"
          >
            <FaArrowLeft className="mr-1.5 transition-transform group-hover:-translate-x-0.5" size={12} /> 
            Back
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8 pt-4 text-center">
          <div className="w-16 h-16 bg-[#F0F2F5] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FaEnvelope className="text-[#002B5B] text-2xl" />
          </div>
          <h2 className="text-2xl font-black text-[#1F2937] mb-2 tracking-tight">Verify Account</h2>
         
          <p className="text-sm font-bold text-[#002B5B] mt-0.5">{email || 'your email address'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex justify-between gap-2 sm:gap-3">
            {otp.map((data, index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                ref={(el) => (inputRefs.current[index] = el)}
                value={data}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-full h-14 text-center text-xl font-black bg-slate-50 border border-slate-200 rounded-xl focus:border-[#002B5B] focus:ring-4 focus:ring-[#002B5B]/10 outline-none transition-all text-[#1F2937]"
              />
            ))}
          </div>

          <div className="space-y-5">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#002B5B] hover:bg-[#00224a] text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-[#002B5B]/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
            
            <p className="text-xs font-black text-[#6B7280] uppercase tracking-widest text-center">
              Didn't receive? <Link to="/auth/forgot-password" className="text-[#002B5B] hover:text-[#00224a] font-black transition-colors">Resend</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyOTP;