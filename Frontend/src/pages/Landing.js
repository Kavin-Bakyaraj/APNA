import React, { useState } from 'react';
import { FaFacebook, FaTwitter, FaLinkedin, FaBars, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      <div className='sticky top-0 bg-white shadow z-10 rounded-b-lg'>
      {/* Navbar */}
      <nav className="flex justify-between items-center p-4 bg-white shadow-md md:px-8 sticky top-0 z-50">
        
        {/* <div className="text-xl font-bold text-gray-800">apna</div> */}
        
        {/* Hamburger Menu Button for Mobile */}
        <div className="md:hidden cursor-pointer" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </div>

        {/* Navigation Links */}
        <ul className={`absolute top-16 left-0 w-full bg-white shadow-md md:static md:flex md:space-x-6 md:bg-transparent md:shadow-none transition-all duration-300 ${menuOpen ? 'block' : 'hidden'}`}>
          <li className="text-gray-600 hover:text-gray-800 cursor-pointer p-4 md:p-0">Jobs</li>
          <li className="text-gray-600 hover:text-gray-800 cursor-pointer p-4 md:p-0">Career</li>
          <li className="text-gray-600 hover:text-gray-800 cursor-pointer p-4 md:p-0">Contests</li>
          <li className="text-gray-600 hover:text-gray-800 cursor-pointer p-4 md:p-0">Degree</li>
          <div className="flex flex-col space-y-2 p-4 md:hidden">
          <button onClick={() => navigate('/hr-login')} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Employer Login</button>
          <button onClick={() => navigate('/candidate-login')} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Candidate Login</button>          </div>
        </ul>

        {/* Desktop Buttons */}
        <div className="hidden md:flex space-x-2">
        <button onClick={() => navigate('/hr-login')} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Employer Login</button>
        <button onClick={() => navigate('/candidate-login')} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Candidate Login</button>        </div>
      </nav>
      </div>

      {/* Hero Section */}
      <section className="py-16 text-center px-4 md:px-0 flex-grow flex flex-col justify-center items-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">INDIA'S #1 JOB PLATFORM</h1>
        <h2 className="text-2xl md:text-3xl text-gray-700 mb-2">Your job search ends here</h2>
        <p className="text-lg text-gray-600 mb-8">Discover 50 lakh+ career opportunities</p>
        <div className="flex flex-col md:flex-row justify-center space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto">
          <input type="text" placeholder="Search jobs by 'title'" className="px-4 py-2 border border-gray-300 rounded w-full md:w-auto" />
          <select className="px-4 py-2 border border-gray-300 rounded w-full md:w-auto">
            <option>Your Experience</option>
          </select>
          <select className="px-4 py-2 border border-gray-300 rounded w-full md:w-auto">
            <option>Search for an area or...</option>
          </select>
          <button className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 w-full md:w-auto">Search Jobs</button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 px-4 md:px-0 mt-auto">
        <div className="container mx-auto flex flex-col items-center space-y-4 pl-4 pr-4 md:flex-row md:justify-between md:space-y-0">
          {/* Logo */}
          <div className="text-xl font-bold">apna</div>

          {/* Navigation Links */}
          <div className="flex space-x-4">
            <div className="hover:text-gray-300">About Us</div>
            <div className="hover:text-gray-300">Contact</div>
            <div className="hover:text-gray-300">Privacy Policy</div>
          </div>

          {/* Social Media Icons */}
          <div className="flex space-x-4">
            <div className="text-gray-300 hover:text-white">
              <FaFacebook size={24} />
            </div>
            <div className="text-gray-300 hover:text-white">
              <FaTwitter size={24} />
            </div>
            <div className="text-gray-300 hover:text-white">
              <FaLinkedin size={24} />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
