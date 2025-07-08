import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [otpTimer, setOtpTimer] = useState(300);
  const [resendCount, setResendCount] = useState(0); // 👈 giới hạn gửi lại OTP
  const navigate = useNavigate();
  const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL || '${backendApiUrl}';
  useEffect(() => {
    let interval: any;
    if (step === 2 && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, otpTimer]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSubmitEmail = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${backendApiUrl}/auth/forgot-password`, { email });
      if (response.data.message === "Your account is banned. Cannot reset password.") {
        toast.error("Your account has been banned. Please contact support.");
      } else if (response.data.success) {
        toast.success(response.data.message || 'OTP sent to your email.');
        setStep(2);
        setOtp('');
        setOtpTimer(60);
        setResendCount(0); // 👈 reset lượt gửi lại
      } else {
        toast.error(response.data.message || 'Error sending OTP. Please try again.');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error sending OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCount >= 3) {
      toast.error("You have reached the maximum number of resend attempts.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${backendApiUrl}/auth/forgot-password`, { email });
      if (response.data.success) {
        toast.success('OTP resent to your email.');
        setOtp('');
        setOtpTimer(60); // số tg otp Reset 
        setResendCount((prev) => prev + 1); // tăng lượt gửi otp
      } else {
        toast.error(response.data.message || 'Failed to resend OTP.');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOtp = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${backendApiUrl}/auth/verify-otp`, { email, otp });
      if (response.data.success) {
        toast.success(response.data.message || 'OTP verified successfully.');
        setStep(3);
      } else {
        toast.error(response.data.message || 'OTP is incorrect. Please try again.');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'OTP is incorrect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPassword = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${backendApiUrl}/auth/reset-password`, { email, newPassword });
      if (response.data.success) {
        toast.success(response.data.message || 'Password reset successfully.');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        toast.error(response.data.message || 'Error resetting password.');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Same as old password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} theme="light" />
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-md">
        {step === 1 && (
          <form onSubmit={handleSubmitEmail}>
            <h2 className="text-2xl font-bold mb-2 text-[#5b3b1a] text-center">Forgot Password</h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <label className="text-sm font-medium text-black">Email</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-[#c19b76] rounded-md mb-6 focus:outline-none focus:ring-2 focus:ring-[#a17852]"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 text-white rounded-md bg-gradient-to-r from-[#955d2b] to-[#c19b76] hover:opacity-90"
            >
              {loading ? 'Sending reset link...' : 'Send reset link'}
            </button>
            <div className="mt-6 text-center">
              <a href="/login" className="text-[#a17852] text-sm hover:underline">Back to login</a>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmitOtp}>
            <h2 className="text-2xl font-bold mb-4 text-[#5b3b1a] text-center">Enter OTP</h2>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              className="w-full px-4 py-2 border border-[#c19b76] rounded-md mb-3"
            />

            {otpTimer > 0 ? (
              <p className="text-sm text-red-600 text-center mb-4">
                OTP expires in: <strong>{formatTime(otpTimer)}</strong>
              </p>
            ) : (
              <div className="text-center mb-4">
                <p className="text-sm text-red-600 font-semibold">OTP has expired.</p>
                {resendCount < 3 ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="mt-2 text-sm text-[#a17852] underline hover:text-[#7a5833]"
                  >
                    Resend OTP ({3 - resendCount} left)
                  </button>
                ) : (
                  <p className="mt-2 text-sm text-gray-500">
                    You’ve reached the maximum number of resend attempts.
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || otpTimer === 0}
              className="w-full py-2 text-white rounded-md bg-gradient-to-r from-[#955d2b] to-[#c19b76] hover:opacity-90"
            >
              {loading ? 'Verifying OTP...' : 'Verify OTP'}
            </button>
            <div className="mt-6 text-center">
              <a href="/login" className="text-[#a17852] text-sm hover:underline">Back to login</a>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmitPassword}>
            <h2 className="text-2xl font-bold mb-4 text-[#5b3b1a] text-center">Set New Password</h2>
            <div className="relative mb-6">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-[#c19b76] rounded-md pr-10"
              />
              <span
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 text-white rounded-md bg-gradient-to-r from-[#955d2b] to-[#c19b76] hover:opacity-90"
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
            <div className="mt-6 text-center">
              <a href="/login" className="text-[#a17852] text-sm hover:underline">Back to login</a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
