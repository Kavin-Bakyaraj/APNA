export default function PasswordStrengthBar({ password }) {
    const getStrength = () => {
      if (password.length < 6) return "Weak";
      if (/[A-Z]/.test(password) && /[0-9]/.test(password)) return "Strong";
      return "Medium";
    };
  
    return (
      <div className="mt-2">
        <div className={`h-2 rounded-full ${getStrength() === "Weak" ? "bg-red-500" : getStrength() === "Medium" ? "bg-yellow-500" : "bg-green-500"}`}></div>
        <p className="text-xs text-gray-600 mt-1">{getStrength()}</p>
      </div>
    );
  }
  