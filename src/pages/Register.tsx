import type React from "react";
import { useState } from "react";
import axios from "axios";
import FormModal from "../pages/common/form-modal";
import { useNavigate } from "react-router";
import { FaEye, FaEyeSlash, FaGoogle, FaFacebook, FaGithub, FaLinkedinIn } from "react-icons/fa";
import logo from "../assets/ambrosia-logo-2.png";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
  });

  const [otp, setOtp] = useState("");
  const [isOtpFormOpen, setIsOtpFormOpen] = useState(false);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL || '${backendApiUrl}';
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
        email: formData.email,
        otp,
      });
      if (response.data.success) {
        toast.success(response.data.message || "OTP verified successfully!");
        setIsOtpFormOpen(false);
        setTimeout(() => navigate("/login"), 3000);
      } else {
        toast.error(response.data.message || "Failed to verify OTP.");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "An error occurred while verifying OTP.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const validateForm = () => {
    let isValid = true;

    // Validate Full Name
    if (!formData.fullName.trim()) {
      toast.error("Full Name is required");
      isValid = false;
    } else if (formData.fullName.length > 50) {
      toast.error("Full Name must not exceed 50 characters");
      isValid = false;
    } else if (!/^[a-zA-ZÀ-ỹ]+( [a-zA-ZÀ-ỹ]+){0,2}$/.test(formData.fullName)) {
      toast.error("Full Name can only have up to 2 spaces and must not contain special characters.");
      isValid = false;
    }

    // Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      toast.error("Valid email is required");
      isValid = false;
    } else if (formData.email.length > 50) {
      toast.error("Email must not exceed 50 characters");
      isValid = false;
    } else if (/\s/.test(formData.email)) {
      toast.error("Email must not contain spaces");
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      toast.error("Invalid email format");
      isValid = false;
    }

    // Validate Phone Number
    if (!formData.phoneNumber.trim()) {
      toast.error("Phone Number is required");
      isValid = false;
    } else if (!/^\d+$/.test(formData.phoneNumber)) {
      toast.error("Phone Number must contain only digits");
      isValid = false;
    } else if (formData.phoneNumber.length > 15) {
      toast.error("Phone Number must not exceed 15 digits");
      isValid = false;
    }
    else if (!/^0\d{9,10}$/.test(formData.phoneNumber)) {
      toast.error("Phone Number format is invalid (must start with 0 and be 9–11 digits)");
      isValid = false;
    }

    // Validate Password
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      isValid = false;
    } else if (formData.password.length > 50) {
      toast.error("Password must not exceed 50 characters");
      isValid = false;
    } else if (/\s/.test(formData.password)) {
      toast.error("Password must not contain spaces");
      isValid = false;
    } else if (!/[A-Za-z]/.test(formData.password)) {
      toast.error("Password must contain at least one letter");
      isValid = false;
    } else if (!/\d/.test(formData.password)) {
      toast.error("Password must contain at least one number");
      isValid = false;
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      toast.error("Password must contain at least one special character");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (validateForm()) {
      try {
        setLoading(true);
        const response = await axios.post(`${backendApiUrl}/auth/register`, {
          fullname: formData.fullName,
          email: formData.email,
          password: formData.password,
          phoneNumber: formData.phoneNumber,
        });

        if (response.data.success) {
          toast.success(response.data.message || "Registration successful! Please verify your email with the OTP sent.");
          setIsOtpFormOpen(true);
        } else {
          if (response.data.code === 1001) {
            toast.error(response.data.message || "Your account is not verified or has been banned. Please verify your email or contact support.");
          } else if (response.data.message === "Email is already registered.") {
            toast.error("Email is already registered. Please use a different email or log in.");
          } else {
            toast.error(response.data.message || "Registration failed. Please check your input.");
          }
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || "An error occurred during registration. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFormModalClose = () => {
    setIsOtpFormOpen(false);
  };

  const handleLoginGoogle = () => {
    window.location.href =`${backendApiUrl}/login/google`;
  };

  const handleLoginFacebook = () => {
    window.location.href = `${backendApiUrl}/facebook`;
  };

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

      <div className="flex justify-center w-full mt-6 mb-6">
        <div className="flex items-center">  
          <img
            src={logo}
            alt="Ambrosia Logo"
            className="w-[3rem] h-[3rem] rounded-full border-4 border-[#a68a64] shadow-lg object-cover cursor-pointer bg-[#a68a64]"
          />
          <p className="ml-3 text-3xl font-bold text-[#a68a64]">Ambrosia</p>
        </div>
      </div>


      <div className="flex flex-col md:flex-row w-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-xl min-h-[600px] md:min-h-[500px]">
        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center flex-1 space-y-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center md:text-left">Registration</h2>

          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="mb-3">
              <input
                type="text"
                id="fullName"
                name="fullName"
                className="w-full py-3 px-4 bg-gray-100 border-0 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#a68a64]"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Full Name"
                disabled={loading}
              />
            </div>

            <div className="mb-3">
              <input
                type="email"
                id="email"
                name="email"
                className="w-full py-3 px-4 bg-gray-100 border-0 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#a68a64]"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                disabled={loading}
              />
            </div>

            <div className="mb-3">
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                className="w-full py-3 px-4 bg-gray-100 border-0 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#a68a64]"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Phone Number"
                disabled={loading}
              />
            </div>

            <div className="mb-4 relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                className="w-full py-3 px-4 bg-gray-100 border-0 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#a68a64]"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                disabled={loading}
              />
              <span
                className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#a68a64] text-white font-medium rounded-lg transition-all duration-300 hover:bg-[#8b7355] focus:outline-none focus:ring-2 focus:ring-[#a68a64] focus:ring-offset-2"
              disabled={loading}
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>

          <div className="flex items-center my-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gray-200"></div>
            <span className="px-4 text-sm text-gray-500 font-medium">or register with</span>
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
            <p className="text-sm text-gray-600">Already have an account?</p>
            <button onClick={() => navigate("/login")} className="mt-1 text-[#a68a64] font-medium hover:underline">
              Login
            </button>
          </div>
        </div>

        <div
          className="hidden md:flex md:w-1/2 p-8 flex-col justify-center items-center text-white text-center"
          style={{ backgroundColor: "#a68a64" }}
        >
          <h1 className="text-3xl font-bold mb-2">Welcome Back!</h1>
          <p className="text-sm mb-8 opacity-90">Already have an account?</p>
          <button
            onClick={() => navigate("/login")}
            className="py-2.5 px-6 rounded-lg font-medium border-2 border-white transition-all duration-300 hover:bg-white hover:bg-opacity-10"
          >
            Login
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

export default Register;