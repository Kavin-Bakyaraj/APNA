import { useState } from "react";
import { Link } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";

export default function HrNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md py-4 px-6 flex justify-between items-center">
      {/* Brand Logo */}
      <div className="text-[#190A28] text-2xl font-bold">apna</div>

      {/* Desktop Menu */}
      <div className="hidden md:flex space-x-6">
        <Link to="/hr-dashboard" className="text-[#190A28] font-medium hover:text-gray-600">Dashboard</Link>
        <Link to="/post-job" className="text-[#190A28] font-medium hover:text-gray-600">Post Job</Link>
        <Link to="/hr-applicants" className="text-[#190A28] font-medium hover:text-gray-600">Applicants</Link>
      </div>

      {/* Logout Button */}
      <div className="hidden md:flex">
        <Link to="/login" className="px-4 py-2 bg-[#190A28] text-white rounded-md hover:bg-[#2B1C43] transition">Logout</Link>
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <button onClick={() => setIsOpen(!isOpen)} className="text-[#190A28]">
          {isOpen ? <FiX className="text-2xl" /> : <FiMenu className="text-2xl" />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {isOpen && (
        <div className="absolute top-16 left-0 w-full bg-white shadow-md p-4 flex flex-col space-y-4 md:hidden">
          <Link to="/hr-dashboard" className="text-[#190A28] font-medium" onClick={() => setIsOpen(false)}>Dashboard</Link>
          <Link to="/post-job" className="text-[#190A28] font-medium" onClick={() => setIsOpen(false)}>Post Job</Link>
          <Link to="/hr-applicants" className="text-[#190A28] font-medium" onClick={() => setIsOpen(false)}>Applicants</Link>
          <Link to="/login" className="px-4 py-2 bg-[#190A28] text-white rounded-md text-center" onClick={() => setIsOpen(false)}>Logout</Link>
        </div>
      )}
    </nav>
  );
}
