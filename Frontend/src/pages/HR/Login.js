import { useState, useEffect } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/apna/hr_login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (response.ok) {
        // Store JWT token in cookies
        Cookies.set("jwt", data.token, { expires: 1, path: "/" });
        localStorage.setItem("hr_email", formData.email);
        toast.success("Login successful!");
        navigate("/hr-dashboard");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Something went wrong.");
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    try {
      const response = await fetch("http://localhost:8000/apna/hr_forgot-password/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("OTP sent to email!");
        setShowForgotModal(false);
        setShowResetModal(true);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Error sending OTP.");
    }
  };

  const handleResetPassword = async () => {
    try {
      const response = await fetch("http://localhost:8000/apna/hr_reset-password/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp, new_password: newPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Password reset successful!");
        setShowResetModal(false);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Error resetting password.");
    }
  };

  useEffect(() => {
    // Clear all cookies and local storage when login page is loaded
    Cookies.remove("jwt");
    Cookies.remove("candidate_email");
    Cookies.remove("hr_email");
    localStorage.clear();
    sessionStorage.clear();
  }, []);

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100 px-4">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-semibold text-[#190A28] text-center">HR Authentication</h2>

        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="input-field" />
        <div className="relative">
          <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder="Password" className="input-field" />
          <span className="absolute right-3 top-7 cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </span>
        </div>

        <button onClick={handleLogin} className={`w-full bg-[#190A28] text-white p-2 rounded-lg font-semibold mt-4 ${loading ? "opacity-50 cursor-not-allowed" : ""}`} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-sm mt-3 text-gray-600 text-center">
          Forgot Password? <span className="text-[#190A28] font-medium cursor-pointer" onClick={() => setShowForgotModal(true)}>Reset here</span>
        </p>
        <p className="text-sm mt-3 text-gray-600 text-center">
          New here? <a href="/hr-register" className="text-[#190A28] font-medium">Sign up</a>
        </p>

        {showForgotModal && (
          <div className="modal">
            <div className="modal-content">
              <h3 className="text-lg font-semibold">Forgot Password</h3>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter your email" className="input-field" />
              <button className="btn" onClick={handleForgotPassword}>Send OTP</button>
              <button className="btn-secondary" onClick={() => setShowForgotModal(false)}>Close</button>
            </div>
          </div>
        )}

        {showResetModal && (
          <div className="modal">
            <div className="modal-content">
              <h3 className="text-lg font-semibold">Reset Password</h3>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP" className="input-field" />
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter New Password" className="input-field" />
              <button className="btn" onClick={handleResetPassword}>Reset Password</button>
              <button className="btn-secondary" onClick={() => setShowResetModal(false)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
