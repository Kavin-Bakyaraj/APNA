import { BrowserRouter as Router, Route, Routes, Outlet } from "react-router-dom";
import Register from "./pages/HR/Register";
import Login from "./pages/HR/Login";
import  HrNavbar  from "./components/HrNavbar";
import  ApplicantNavbar  from "./components/ApplicantNavbar";
import HrDashboard from "./pages/HR/HrDashboard";
import PostJob from "./pages/HR/PostJob";
import CandidateRegister from "./pages/Candidate/CandidateRegister";
import CandidateLogin from "./pages/Candidate/CandidateLogin";
import Landing from "./pages/Landing";
import JobPreview from "./pages/Candidate/JobPreview";
import CandidateDashboard from "./pages/Candidate/CandidateDashboard";

// Layout component for HR routes
const HrLayout = () => (
  <>
    <HrNavbar />
    <Outlet />
  </>
);

// Layout component for Applicant routes
const ApplicantLayout = () => (
  <>
    <ApplicantNavbar />
    <Outlet />
  </>
);

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        {/* General Routes */}
        <Route path="/hr-register" element={<Register />} />
        <Route path="/hr-login" element={<Login />} />

        {/* HR Routes */}
          <Route element={<HrLayout />}>
          <Route path="/hr-dashboard" element={<HrDashboard />} />
          <Route path="/post-job" element={<PostJob />} />
        </Route>

        {/* Applicant Routes */}
        <Route element={<ApplicantLayout />}>
        <Route path="/candidate-register" element={<CandidateRegister />} />
        <Route path="/candidate-login" element={<CandidateLogin />} />
        <Route path="/candidate-dashboard" element={<CandidateDashboard />} />
        <Route path="/jobs" element={<div>Jobs Page</div>} />
        <Route path="/job-preview/:jobid" element={<JobPreview />} />
      </Route>
      </Routes>
    </Router>
  );
}
