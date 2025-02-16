import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiBriefcase, FiDollarSign, FiClock, FiUsers, FiSearch, FiTrash2, FiChevronDown } from "react-icons/fi";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

export default function HrDashboard() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortType, setSortType] = useState("");
  const [expandedJob, setExpandedJob] = useState(null);
  const [selectedCandidates, setSelectedCandidates] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const token = Cookies.get("jwt");
        const response = await fetch("http://localhost:8000/apna/get_jobs/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setJobs(data.jobs);
          setFilteredJobs(data.jobs);
        } else {
          toast.error(data.message || "Error fetching jobs");
        }
      } catch (error) {
        toast.error("Network error while fetching jobs");
      }
    };
    fetchJobs();
  }, []);

  const fetchSelectedCandidates = async (jobId) => {
    try {
      const response = await fetch(`http://localhost:8000/apna/get_selected_candidates/${jobId}/`);
      const data = await response.json();
      if (response.ok) {
        setSelectedCandidates((prev) => ({ ...prev, [jobId]: data.selected_candidates }));
      } else {
        toast.error("Error fetching selected candidates");
      }
    } catch (error) {
      toast.error("Network error while fetching candidates");
    }
  };

  const handleSearch = (event) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);
    setFilteredJobs(jobs.filter((job) => job.job_title.toLowerCase().includes(query)));
  };

  const handleSort = (type) => {
    setSortType(type);
    let sortedJobs = [...jobs];
    if (type === "salary") {
      sortedJobs.sort((a, b) => b.salary - a.salary);
    } else if (type === "experience") {
      sortedJobs.sort((a, b) => b.experience - a.experience);
    }
    setFilteredJobs(sortedJobs);
  };

  const deleteJob = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    try {
      const token = Cookies.get("jwt");
      const response = await fetch(`http://localhost:8000/apna/delete_job/${jobId}/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        setJobs(jobs.filter((job) => job._id !== jobId));
        setFilteredJobs(filteredJobs.filter((job) => job._id !== jobId));
        toast.success("Job deleted successfully");
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to delete job");
      }
    } catch (error) {
      toast.error("Error deleting job");
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 space-y-2 md:space-y-0">
        <h2 className="text-3xl font-bold text-[#190A28]">HR Dashboard</h2>
        <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto">
          <div className="relative w-full md:w-auto">
            <FiSearch className="absolute left-3 top-2 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-10 pr-4 py-2 border rounded-md w-full md:w-64"
            />
          </div>
          <select
            className="px-4 py-2 border rounded-md w-full md:w-auto"
            value={sortType}
            onChange={(e) => handleSort(e.target.value)}
          >
            <option value="">Sort By</option>
            <option value="salary">Highest Salary</option>
            <option value="experience">Most Experience</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJobs.slice().reverse().map((job) => (
          <div
            key={job._id}
            className="bg-white p-6 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition"
          >
            <div onClick={() => {
              setExpandedJob(expandedJob === job._id ? null : job._id);
              fetchSelectedCandidates(job._id);
            }}>
              <h3 className="text-xl font-bold flex items-center">
                <FiBriefcase className="mr-2 text-[#190A28]" /> {job.job_title}
              </h3>
              <p className="text-gray-600 mt-1">{job.job_description}</p>
              <div className="mt-3">
                <p className="text-gray-600 flex items-center">
                  <FiClock className="mr-2 text-[#190A28]" /> {job.experience} years experience
                </p>
                <p className="text-gray-600 flex items-center">
                  <FiDollarSign className="mr-2 text-[#190A28]" /> {job.salary} LPA
                </p>
                <p className="text-gray-600 flex items-center">
                  <FiUsers className="mr-2 text-[#190A28]" /> Selected Candidates: {job.selected_candidates.length}
                </p>
              </div>
              <FiChevronDown className="text-[#190A28] mt-2" />
            </div>

            {/* Delete Job Button */}
            <button
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-700 transition"
              onClick={() => deleteJob(job._id)}
            >
              <FiTrash2 className="mr-2" />
            </button>

            {expandedJob === job._id && (
              <div className="mt-4 p-4 bg-gray-100 rounded-md">
                <h4 className="text-lg font-semibold">Selected Candidates:</h4>
                {selectedCandidates[job._id] && selectedCandidates[job._id].length > 0 ? (
                  selectedCandidates[job._id].map((candidate) => (
                    <p
                      key={candidate.candidate_id}
                      className="text-gray-700 cursor-pointer hover:text-[#190A28]"
                      onClick={() => {
                        localStorage.setItem("selected_candidate_email", candidate.email);  // Store email in localStorage
                        navigate(`/candidate-details`);
                      }}
                    >
                      {candidate.name} - {candidate.email} (Score: {candidate.score}%)
                    </p>
                  ))
                ) : (
                  <p className="text-gray-500">No candidates selected yet.</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
