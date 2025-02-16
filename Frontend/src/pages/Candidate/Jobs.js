import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiBriefcase, FiUser, FiMail } from "react-icons/fi";

export default function JobList() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch("http://localhost:8000/apna/get_all_jobs/");
        const data = await response.json();
        if (response.ok) {
          setJobs(data.jobs);
        } else {
          console.error("Error fetching jobs:", data.message);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const formatSkills = (skills) => {
    return Array.isArray(skills) ? skills.join(", ") : skills;
  };

  return (

    <div className="min-h-screen flex flex-col items-center bg-gray-50 p-6">
      <h2 className="text-3xl font-bold text-[#190A28] mb-6">Available Jobs</h2>

      {loading ? (
        <p className="text-lg text-gray-500">Loading jobs...</p>
      ) : jobs.length === 0 ? (
        <p className="text-lg text-gray-500">No jobs available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
          {jobs.map((job) => (
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
                  <strong>Skills:</strong> {formatSkills(job.skills_required)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Salary:</strong> {job.salary} LPA
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Experience:</strong> {job.experience} years
                </p>
              </div>

              <div className="mt-4 text-sm text-gray-600 flex items-center">
                <FiUser className="mr-2 text-[#190A28]" />
                <strong>HR:</strong> {job.hr_name}
              </div>
              <div className="text-sm text-gray-600 flex items-center">
                <FiMail className="mr-2 text-[#190A28]" />
                <strong>Email:</strong> {job.hr_email}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
