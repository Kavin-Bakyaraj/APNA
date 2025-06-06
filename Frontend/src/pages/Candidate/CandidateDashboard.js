import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiBriefcase, FiUser, FiMail } from "react-icons/fi";
import Cookies from "js-cookie";
import { toast } from "react-toastify";

export default function CandidateDashboard() {
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAppliedJobs = async () => {
      try {
        const token = Cookies.get("jwt");
        if (!token) {
          toast.error("Unauthorized! Please log in.");
          navigate("/candidate-login");
          return;
        }

        const response = await fetch("http://localhost:8000/apna/get_applied_jobs/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (response.ok) {
          setAppliedJobs(data.applied_jobs);
        } else {
          toast.error(data.message || "Error fetching applied jobs.");
        }
      } catch (error) {
        toast.error("Network error while fetching applied jobs.");
      } finally {
        setLoading(false);
      }
    };

    fetchAppliedJobs();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 p-6">
      <h2 className="text-3xl font-bold text-[#190A28] mb-6">My Applied Jobs</h2>

      {loading ? (
        <p className="text-lg text-gray-500">Loading applied jobs...</p>
      ) : appliedJobs.length === 0 ? (
        <p className="text-lg text-gray-500">You haven't applied for any jobs yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
          {appliedJobs.map((job) => (
            <div
              key={job.job_id}
              onClick={() => navigate(`/job-preview/${job.job_id}`)}
              className="bg-white shadow-lg rounded-xl p-5 cursor-pointer hover:shadow-2xl transition transform hover:scale-105"
            >
              <h3 className="text-xl font-semibold text-[#190A28] flex items-center">
                <FiBriefcase className="mr-2" /> {job.job_title}
              </h3>
              <p className="text-gray-600 mt-1">{job.job_description}</p>

              <div className="mt-3">
                <p className="text-sm text-gray-600">
                  <strong>Skills:</strong> {Array.isArray(job.skills_required) ? job.skills_required.join(", ") : job.skills_required}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Salary:</strong> {job.salary} LPA
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Experience:</strong> {job.experience} years
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
