import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { FiMail, FiLock, FiKey } from "react-icons/fi";

export default function CandidateLogin() {
  const [view, setView] = useState("login"); // "login", "forgotPassword", "resetPassword"
  const [formData, setFormData] = useState({ email: "", password: "", otp: "", newPassword: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let apiEndpoint = "";
    let payload = {};

    switch (view) {
      case "login":
        apiEndpoint = "http://localhost:8000/apna/login/";
        payload = { email: formData.email, password: formData.password };
        break;
      case "forgotPassword":
        apiEndpoint = "http://localhost:8000/apna/forgot-password/";
        payload = { email: formData.email };
        break;
      case "resetPassword":
        apiEndpoint = "http://localhost:8000/apna/reset-password/ ";
        payload = { email: formData.email, otp: formData.otp, new_password: formData.newPassword };
        break;
      default:
        setLoading(false);
        return;
    }

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        if (view === "login") {
          Cookies.set("jwt", data.token, { expires: 1 });
          localStorage.setItem("candidate_email", formData.email);
          toast.success("Login successful!");
          setTimeout(() => navigate("/candidate-dashboard"), 1500);
        } else if (view === "forgotPassword") {
          toast.success("OTP sent to your email!");
          setView("resetPassword"); // Switch to OTP verification view
        } else {
          toast.success("Password reset successful! Please login.");
          setView("login"); // Switch back to login after reset
        }
      } else {
        toast.error(data.message || "Operation failed.");
      }
    } catch (error) {
      toast.error("Something went wrong. Try again.");
    }

    setLoading(false);
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
    <div className="min-h-screen flex justify-center items-center bg-gray-50">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-6">
        <h2 className="text-2xl font-bold text-[#190A28] text-center mb-4">
          {view === "login" ? "Candidate Login" : view === "forgotPassword" ? "Forgot Password" : "Reset Password"}
          <p className="text-sm mt-3 text-gray-600 text-center">
          New user : <a href="/candidate-register" className="text-[#190A28] font-medium">Sign up</a>
        </p>
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field (Visible in all cases) */}
          <div className="relative">
            <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              className="pl-10 pr-3 py-2 w-full border rounded-md bg-gray-100 focus:ring-2 focus:ring-[#190A28] focus:bg-white"
              required
            />
          </div>

          {/* Password Field (Only for Login) */}
          {view === "login" && (
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className="pl-10 pr-3 py-2 w-full border rounded-md bg-gray-100 focus:ring-2 focus:ring-[#190A28] focus:bg-white"
                required
              />
            </div>
          )}

          {/* OTP Field (Only for Reset Password) */}
          {view === "resetPassword" && (
            <div className="relative">
              <FiKey className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                name="otp"
                value={formData.otp}
                onChange={handleChange}
                placeholder="Enter OTP"
                className="pl-10 pr-3 py-2 w-full border rounded-md bg-gray-100 focus:ring-2 focus:ring-[#190A28] focus:bg-white"
                required
              />
            </div>
          )}

          {/* New Password Field (Only for Reset Password) */}
          {view === "resetPassword" && (
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="New Password"
                className="pl-10 pr-3 py-2 w-full border rounded-md bg-gray-100 focus:ring-2 focus:ring-[#190A28] focus:bg-white"
                required
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className={`w-full px-4 py-2 rounded-md flex justify-center transition ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-[#190A28] hover:bg-[#2B1C43] text-white"
            }`}
            disabled={loading}
          >
            {loading ? "Processing..." : view === "login" ? "Login" : view === "forgotPassword" ? "Request OTP" : "Reset Password"}
          </button>
        </form>

        {/* Footer Links for Switching Views */}
        <div className="text-center mt-4 text-sm text-gray-600">
          {view === "login" && (
            <p>
              <button onClick={() => setView("forgotPassword")} className="text-[#190A28] font-medium hover:underline">
                Forgot Password?
              </button>
            </p>
          )}
          {view !== "login" && (
            <p>
              <button onClick={() => setView("login")} className="text-[#190A28] font-medium hover:underline">
                Back to Login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
