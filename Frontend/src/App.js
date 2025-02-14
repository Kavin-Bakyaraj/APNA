import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";


export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#F4F2F6] flex flex-col">
        {/* Navbar */}
        <nav className="bg-white shadow-md py-4 px-6 flex justify-between items-center">
          <div className="text-[#190A28] text-2xl font-bold">apna</div>
          <div>
            <a href="/" className="text-[#190A28] font-medium px-4">Home</a>
            <a href="/jobs" className="text-[#190A28] font-medium px-4">Jobs</a>
            <a href="/career-compass" className="text-[#190A28] font-medium px-4">Career Compass</a>
            <a href="/contests" className="text-[#190A28] font-medium px-4">Contests</a>
          </div>
          <div>
            <a href="/login" className="px-4 py-2 bg-[#190A28] text-white rounded-md hover:bg-[#2B1C43] transition">Login</a>
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex-grow flex items-center justify-center">
          <Routes>
          <Route path="/register" element={<Register />} />
            <Route path="/" element={<Login />} />
          </Routes>
        </div>

        {/* Footer */}
        <footer className="bg-white py-4 text-center text-gray-600 text-sm shadow-md">
          © 2025 Apna. All rights reserved.
        </footer>
      </div>
    </Router>
  );
}
