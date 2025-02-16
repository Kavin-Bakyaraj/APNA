import { useState } from "react";
import PasswordStrengthBar from "../../components/PasswordStrengthBar";
export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    companyname: "",
    password: "",
    confirmPassword: ""
  });

  const [emailError, setEmailError] = useState("");

  // List of commonly rejected public email domains
  const publicDomains = [
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
    "aol.com",
    "icloud.com",
    "mail.com"
  ];

  // List of accepted organization domains (example)
  const acceptedDomains = [
    "snsce.ac.in",    // College domain
    "microsoft.com",   // Company domain
    "adobe.com",      // Company domain
    "wipro.com",      // Company domain
    "tcs.com",        // Company domain
    "infosys.com"     // Company domain
  ];

  // Email validation function
  const isValidEmail = (email) => {
    if (!email) return { isValid: true, message: "" }; // Don't show error for empty field

    // Basic email format validation
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return { 
        isValid: false, 
        message: "Please enter a valid email address" 
      };
    }

    const domain = email.split("@")[1].toLowerCase();

    // Check if it's a public email domain
    if (publicDomains.includes(domain)) {
      return {
        isValid: false,
        message: "Please use your organization email address instead of a personal email"
      };
    }

    // Optional: If you want to strictly allow only specific domains
    // Uncomment the following block if you want to restrict to only accepted domains
    /*
    if (!acceptedDomains.includes(domain)) {
      return {
        isValid: false,
        message: "Please use an approved organization email domain"
      };
    }
    */

    // Additional validation for institutional email pattern
    // This example checks for patterns like:
    // firstname.lastname@domain
    // firstname.lastname.year@domain
    // firstname.department.year@domain
    const localPart = email.split("@")[0];
    const validLocalPartPattern = /^[a-zA-Z]+[.][a-zA-Z0-9._-]+$/;
    
    if (!validLocalPartPattern.test(localPart)) {
      return {
        isValid: false,
        message: "Email should follow organization format (e.g., firstname.lastname@organization.domain)"
      };
    }

    return { isValid: true, message: "" };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Only validate email field
    if (name === "email") {
      const emailValidation = isValidEmail(value);
      setEmailError(emailValidation.isValid ? "" : emailValidation.message);
    }
  };

  const handleRegister = async () => {
    const emailValidation = isValidEmail(formData.email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.message);
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/apna/hr_register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
          companyname: formData.companyname.trim(),
          password: formData.password
        })
      });

      const data = await response.json();
      if (response.ok) {
        // Handle successful registration
        setFormData({
          name: "",
          email: "",
          companyname: "",
          password: "",
          confirmPassword: ""
        });
        setEmailError("");
      } else {
        // Handle error
        console.error("Registration failed:", data.message);
      }
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
      <h2 className="text-2xl font-semibold text-[#190A28] text-center mb-6">
        Register
      </h2>

      <div className="space-y-4">
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Full Name"
          className="input-field"
          maxLength={50}
        />

        <div>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Organization Email (e.g., firstname.lastname@organization.domain)"
            className={`input-field ${emailError ? 'border-red-500' : ''}`}
            maxLength={100}
          />
          {emailError && (
            <p className="text-red-500 text-sm mt-1">{emailError}</p>
          )}
          <p className="text-gray-500 text-xs mt-1">
            Use your organization email (e.g., JD@company.com, 
            )
          </p>
        </div>

        <input
          type="text"
          name="companyname"
          value={formData.companyname}
          onChange={handleChange}
          placeholder="Company/Organization Name"
          className="input-field"
          maxLength={100}
        />

        <div className="space-y-2">
          <PasswordStrengthBar password={formData.password} />
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            className="input-field"
            maxLength={128}
          />
        </div>

        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm Password"
          className="input-field"
          maxLength={128}
        />

        <button
          onClick={handleRegister}
          className="btn w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Register
        </button>
      </div>
    </div>
  );
}