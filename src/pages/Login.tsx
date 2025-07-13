import type React from "react";
import { useState, useEffect } from "react";
import { FaGoogle, FaFacebook, FaEye, FaEyeSlash, FaGithub, FaLinkedinIn } from "react-icons/fa";
import { useNavigate } from "react-router";
import FormModal from "../pages/common/form-modal";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import logo from "../assets/ambrosia-logo-2.png";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";

const getCookie = (name: string) => {
  const cookieArr = document.cookie.split("; ");
  for (const cookie of cookieArr) {
    const [key, value] = cookie.split("=");
    if (key === name) return decodeURIComponent(value);
  }
  return null;
};

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [isOtpFormOpen, setIsOtpFormOpen] = useState(false);
  const [, setIsLoading] = useState(true);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);
  const token = getCookie("token");
  const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000';
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const successMessage = urlParams.get("success");
    const errorMessage = urlParams.get("error");

    if (successMessage) {
      toast.success(successMessage);
      setTimeout(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
        navigate("/");
      }, 1500);
      return;
    }

    if (errorMessage) {
      toast.error(errorMessage);
      setTimeout(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 3000);
    }

    if (token) {
      document.cookie = `token=${token}; path=/;`;
      navigate("/");
    } else {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (lockoutTime > 0) {
      const timer = setInterval(() => {
        setLockoutTime((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutTime]);

  const enterOtpForm = {
    title: "Enter The OTP",
    fields: [
      {
        value: otp,
        label: "OTP",
        name: "otp",
        type: "text",
        required: true,
        onChange: (e: { target: { value: React.SetStateAction<string> } }) => setOtp(e.target.value),
      },
    ],
    submitText: "Verify OTP",
  };

  const onVerifyOtp = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    try {
      const response = await axios.post(`${backendApiUrl}/auth/verify-otp`, {
        email,
        otp,
      });
      if (response.data.success) {
        toast.success(response.data.message || "OTP verified successfully! Please login now.");
        setIsOtpFormOpen(false);
      } else {
        toast.error(response.data.message || "Failed to verify OTP.");
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      toast.error("An unexpected error occurred during OTP verification.");
    }
  };

  const handleLoginGoogle = () => {
    window.location.href = `${backendApiUrl}/login/google`;
  };

  const handleLoginFacebook = () => {
    window.location.href = `${backendApiUrl}/facebook`;
  };

  const validateInputs = () => {
    if (!email || !password) {
      toast.error("Email and password are required.");
      return false;
    }
    if (email.length < 6 || email.length > 50 || email.includes(" ") || !/\S+@\S+\.\S+/.test(email)) {
      toast.error("Invalid email format or length (6-50 characters, no spaces).");
      return false;
    }
    if (
      password.length < 6 ||
      password.length > 50 ||
      password.includes(" ") ||
      !/(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)
    ) {
      toast.error("Password must be 6-50 characters, no spaces, and include letters, numbers, and special characters.");
      return false;
    }
    return true;
  };

  const handleFormModalClose = () => {
    setIsOtpFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateInputs()) return;

    if (lockoutTime > 0) {
      toast.error(`Too many failed attempts. Try again in ${lockoutTime}s.`);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${backendApiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch((jsonError) => {
        console.error("Invalid JSON response:", jsonError);
        throw new Error("Invalid response from server.");
      });

      if (response.status === 403) {
        if (data.code === 1001) {
          setError(data.message);
          toast.error(data.message);
        } else if (data.code === 1002) {
          setIsOtpFormOpen(true);
          toast.info("Please verify your email with the OTP sent.");
        } else {
          toast.error(data.message || "Access denied.");
        }
        setLoginAttempts((prev) => prev + 1);
        return;
      }

      if (!response.ok) {
        console.error("API Error:", response.status, data.message);
        toast.error(data.message || `Error: ${response.statusText}`);
        setLoginAttempts((prev) => prev + 1);
        return;
      }

      Cookies.set("token", data.token, { expires: 7, path: "/" });

      const decodedToken: any = jwtDecode(data.token);

      toast.success(data.message || `Welcome back, ${decodedToken.fullname || "User"}!`);

      setTimeout(() => {
        const roleMap: Record<string, string> = {
          '67ac64afe072694cafa16e76': '/manage/dashboard', // admin
          '67ac64c7e072694cafa16e7a': '/staff',            // staff
          '67ac667ae072694cafa16e7c': '/chef',             // chef
          '67ac64afe072694cafa16e79': '/',                 // customer or default
        };

        let destination = '/';

        if (Array.isArray(decodedToken.roleId)) {
          for (const roleId of decodedToken.roleId) {
            if (roleMap[roleId]) {
              destination = roleMap[roleId];
              break;
            }
          }
        } else if (typeof decodedToken.roleId === 'string') {
          destination = roleMap[decodedToken.roleId] || '/';
        }

        navigate(destination);
      }, 1500);

    } catch (err) {
      console.error("Unexpected error during login:", err);
      toast.error("An unexpected error occurred. Please try again later.");
      setLoginAttempts((prev) => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loginAttempts >= 3) {
      setLockoutTime(60);
      setLoginAttempts(0);
    }
  }, [loginAttempts]);

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 py-6 px-4">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <div className="flex items-center justify-center -translate-y-5" onClick={() => navigate("/")}>
        <img
          src={logo}
          alt="Ambrosia Logo"
          className="w-[3rem] h-[3rem] rounded-full border-4 border-[#a68a64] shadow-lg object-cover cursor-pointer bg-[#a68a64]"
        />
        <p className="ml-3 text-3xl font-bold text-[#a68a64]">Ambrosia</p>
      </div>

      <div className="flex flex-col md:flex-row w-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-xl min-h-[600px] md:min-h-[500px]">
        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center flex-1 space-y-6">
          <h2 className="text-2xl font-bold mb-10 text-gray-800 text-center md:text-left">Login</h2>
          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="mb-4">
              <input
                type="email"
                className="w-full py-3 px-4 bg-gray-100 border-0 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#a68a64]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                autoComplete="off"
                disabled={loading}
              />
            </div>

            <div className="mb-4 relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full py-3 px-4 bg-gray-100 border-0 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#a68a64]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="off"
                disabled={loading}
              />
              <span
                className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <div className="text-center text-sm mb-4">
              <a href="#" onClick={() => navigate("/forgot-password")} className="text-gray-500 hover:text-gray-700">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#a68a64] text-white font-medium rounded-lg transition-all duration-300 hover:bg-[#8b7355] focus:outline-none focus:ring-2 focus:ring-[#a68a64] focus:ring-offset-2"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="flex items-center my-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gray-200"></div>
            <span className="px-4 text-sm text-gray-500 font-medium">or login with</span>
            <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
          </div>

          <div className="flex justify-center gap-2 md:gap-3 mb-3">
            <button
              type="button"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-[#db4437] transition-all duration-300 hover:bg-gray-200"
              onClick={handleLoginGoogle}
              disabled={loading}
            >
              <FaGoogle className="text-sm" />
            </button>
            <button
              type="button"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-[#1877f2] transition-all duration-300 hover:bg-gray-200"
              onClick={handleLoginFacebook}
              disabled={loading}
            >
              <FaFacebook className="text-sm" />
            </button>
            <button
              type="button"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-all duration-300 hover:bg-gray-200"
              disabled={loading}
            >
              <FaGithub className="text-sm" />
            </button>
            <button
              type="button"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-[#0077b5] transition-all duration-300 hover:bg-gray-200"
              disabled={loading}
            >
              <FaLinkedinIn className="text-sm" />
            </button>
          </div>
          <div className="mt-3 text-center md:hidden">
            <p className="text-sm text-gray-600">Don't have an account?</p>
            <button onClick={() => navigate("/register")} className="mt-1 text-[#a68a64] font-medium hover:underline">
              Register
            </button>
          </div>
        </div>

        <div
          className="hidden md:flex md:w-1/2 p-8 flex-col justify-center items-center text-white text-center"
          style={{ backgroundColor: "#a68a64" }}
        >
          <h1 className="text-3xl font-bold mb-2">Hello, Welcome to Ambrosia!</h1>
          <p className="text-sm mb-8 opacity-90">Don't have an account?</p>
          <button
            onClick={() => navigate("/register")}
            className="py-2.5 px-6 rounded-lg font-medium border-2 border-white transition-all duration-300 hover:bg-white hover:bg-opacity-10"
          >
            Register
          </button>
        </div>
      </div>

      <div className="mt-4 text-center text-xs text-gray-500">
        <p>© {new Date().getFullYear()} Ambrosia. All rights reserved.</p>
      </div>

      {isOtpFormOpen && (
        <FormModal
          handleClose={handleFormModalClose}
          open={isOtpFormOpen}
          formData={enterOtpForm}
          onSubmit={onVerifyOtp}
        />
      )}
    </div>
  );
};

export default Login;