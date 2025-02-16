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
import CandidateDetails from "./pages/HR/CandidateDetails";
import CandidateResumeUpload from "./pages/Candidate/CandidateResumeUpload";
import CandidateProfile from "./pages/Candidate/CandidateProfile";
import JobList from "./pages/Candidate/Jobs";
import JobsForYou from "./pages/Candidate/JobsForYou";
import HRProfile from "./pages/HR/HRProfile";

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
        <Route path="/job-preview/:jobid" element={<JobPreview />} />
        <Route path="/candidate-register" element={<CandidateRegister />} />
        <Route path="/candidate-login" element={<CandidateLogin />} />

        {/* HR Routes */}
          <Route element={<HrLayout />}>
          <Route path="/hr-dashboard" element={<HrDashboard />} />
          <Route path="/post-job" element={<PostJob />} />
          <Route path="/candidate-details" element={<CandidateDetails />} />
          <Route path="/hr-profile" element={<HRProfile />} />
        </Route>

        {/* Applicant Routes */}
        <Route element={<ApplicantLayout />}>
        <Route path="/candidate-dashboard" element={<CandidateDashboard />} />
        <Route path="/jobs" element={<JobList />} />
        <Route path="/profile" element={<CandidateProfile />} />
        <Route path="/verify-profile" element={<CandidateResumeUpload /> } />
        <Route path="/jobsforyou" element={<JobsForYou />} />

      </Route>
      </Routes>
    </Router>
  );
}
