import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiBriefcase, FiUser, FiMail, FiSearch, FiChevronDown } from "react-icons/fi";

export default function JobList() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortType, setSortType] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch("http://localhost:8000/apna/get_all_jobs/");
        const data = await response.json();
        if (response.ok) {
          setJobs(data.jobs);
          setFilteredJobs(data.jobs);
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

  useEffect(() => {
    // Filter jobs based on search query
    const filtered = jobs.filter((job) =>
      job.job_title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort jobs based on sort type
    if (sortType === "salary") {
      filtered.sort((a, b) => b.salary - a.salary);
    } else if (sortType === "experience") {
      filtered.sort((a, b) => b.experience - a.experience);
    }

    setFilteredJobs(filtered);
  }, [searchQuery, sortType, jobs]);

  const formatSkills = (skills) => {
    return Array.isArray(skills) ? skills.join(", ") : skills;
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 p-6">
      <h2 className="text-3xl font-bold text-[#190A28] mb-6">Available Jobs</h2>

      <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2 w-full max-w-6xl mb-4">
        <div className="relative w-full md:w-auto">
          <FiSearch className="absolute left-3 top-2 text-gray-400" />
          <input
            type="text"
            placeholder="Search jobs by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-md w-full md:w-64"
          />
        </div>
        <select
          className="px-4 py-2 border rounded-md w-full md:w-auto"
          value={sortType}
          onChange={(e) => setSortType(e.target.value)}
        >
          <option value="">Sort By</option>
          <option value="salary">Highest Salary</option>
          <option value="experience">Most Experience</option>
        </select>
      </div>

      {loading ? (
        <p className="text-lg text-gray-500">Loading jobs...</p>
      ) : filteredJobs.length === 0 ? (
        <p className="text-lg text-gray-500">No jobs available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
          {filteredJobs.slice().reverse().map((job) => (
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
