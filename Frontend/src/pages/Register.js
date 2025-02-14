import { useState } from "react";
import { toast } from "react-toastify";
import PasswordStrengthBar from "../components/PasswordStrengthBar";

export default function Register() {
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/hr/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Registration successful!");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Something went wrong.");
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
      <h2 className="text-2xl font-semibold text-[#190A28] text-center">Register</h2>

      <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" className="input-field" />
      <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="input-field" />

      <PasswordStrengthBar password={formData.password} />
      <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" className="input-field" />
      <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm Password" className="input-field" />

      <button onClick={handleRegister} className="btn">Register</button>
    </div>
  );
}
