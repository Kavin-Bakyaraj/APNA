import { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { FiUser, FiMail, FiLock, FiAlertCircle } from "react-icons/fi";
import PasswordStrengthBar from "../../components/PasswordStrengthBar"; // Import the component

export default function CandidateRegister() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateFields = () => {
    const { name, email, password, confirmPassword } = formData;
    if (!name.trim()) {
      toast.error("Name is required.");
      return false;
    }
    if (!email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
      toast.error("Enter a valid email address.");
      return false;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return false;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateFields()) return;

    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/apna/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Registration successful!");
        setTimeout(() => navigate("/candidate-login"), 1500); // Redirect after success
      } else {
        toast.error(data.message || "Registration failed.");
      }
    } catch (error) {
      toast.error("Error registering candidate.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-6">
        <h2 className="text-2xl font-bold text-[#190A28] text-center mb-4">Candidate Registration</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Input */}
        <div className="relative">
            <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Name"
            className="pl-10 pr-3 py-2 w-full border rounded-md bg-gray-100 focus:ring-2 focus:ring-[#190A28] focus:bg-white"
            />
        </div>

        {/* Email Input */}
        <div className="relative">
            <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email Address"
            className="pl-10 pr-3 py-2 w-full border rounded-md bg-gray-100 focus:ring-2 focus:ring-[#190A28] focus:bg-white"
            />
        </div>

        {/* Password Input */}
        <div className="relative mb-4">
            <FiLock className="absolute left-3 top-5 transform -translate-y-1/2 text-gray-500" />
            <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password (Min 6 characters)"
            className="pl-10 pr-3 py-2 w-full border rounded-md bg-gray-100 focus:ring-2 focus:ring-[#190A28] focus:bg-white"
            />
            <PasswordStrengthBar password={formData.password} />
        </div>

        {/* Confirm Password Input */}
        <div className="relative">
            <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm Password"
            className="pl-10 pr-3 py-2 w-full border rounded-md bg-gray-100 focus:ring-2 focus:ring-[#190A28] focus:bg-white"
            />
            {formData.password !== formData.confirmPassword && formData.confirmPassword !== "" && (
            <p className="text-red-500 text-sm mt-1 flex items-center">
                <FiAlertCircle className="mr-1" /> Passwords do not match.
            </p>
            )}
        </div>
          {/* Register Button */}
          <button
            type="submit"
            className={`w-full px-4 py-2 rounded-md flex justify-center transition ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-[#190A28] hover:bg-[#2B1C43] text-white"
            }`}
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>
          </form>
      </div>
    </div>
  );
}
