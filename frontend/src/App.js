import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import HRDashboard from "./pages/HRJobs";
import CreateJob from "./pages/createjob";
import CandidateDetails from "./pages/candidatedetails";
export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#F4F2F6] flex flex-col">
 
          <div>
  
          </div>
     

        {/* Main Content */}
        <div className="flex-grow flex items-center justify-center">
          <Routes>
          <Route path="/register" element={<Register />} />
            <Route path="/" element={<Login />} />
            <Route path="/hr-jobs" element={<HRDashboard />} /> 
            <Route path="/create-job" element={<CreateJob />} />
            <Route path="/candidate/:candidateEmail" element={<CandidateDetails />} />
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
