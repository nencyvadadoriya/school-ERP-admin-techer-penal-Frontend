import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaGraduationCap, FaShieldAlt } from 'react-icons/fa';

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
    <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4">
      <div className="w-full max-w-[380px] bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-2xl shadow-slate-200/50 animate-fade-in border border-white relative">
        {/* Top-Left Back Button */}
        <div className="absolute top-6 left-6">
          <Link 
            to="/auth/forgot-password" 
            className="inline-flex items-center text-[10px] font-black text-[#6B7280] uppercase tracking-wider hover:text-primary-600 transition-colors group"
          >
            <FaArrowLeft className="mr-1.5 transition-transform group-hover:-translate-x-0.5" size={10} /> 
            Back
          </Link>
        </div>

        {/* Header */}
        <div className="mb-4 pt-6 text-center text-center">
          <div className="inline-flex items-center justify-center p-2.5 bg-primary-50 rounded-2xl mb-2">
            <FaShieldAlt className="text-3xl text-primary-600" />
          </div>
          <h2 className="text-xl font-black text-[#1F2937] mb-0.5 tracking-tight">Verify Account</h2>
          <p className="text-[11px] text-[#6B7280] font-bold uppercase tracking-widest opacity-60 hidden sm:block">
            Enter the 6-digit code sent to
          </p>
          <p className="text-[10px] font-black text-[#1F2937] break-all px-4 sm:px-0">{email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-between gap-1.5 sm:gap-2">
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
                className="w-full h-11 text-center text-lg font-black bg-slate-50 border border-slate-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 outline-none transition-all text-[#1F2937]"
              />
            ))}
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#002B5B] hover:bg-[#00224a] text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary-500/20 transition-all active:scale-[0.98]"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
            
            <p className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest text-center">
              Didn't receive? <Link to="/auth/forgot-password" className="text-primary-600 font-black">Resend</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyOTP;
