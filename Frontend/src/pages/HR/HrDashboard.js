import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import HrNavbar from "../../components/HrNavbar";
import { FiBriefcase } from "react-icons/fi";
import { FaMoneyBillWave, FaTools } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

export default function HrDashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const token = Cookies.get("jwt");
        if (!token) {
          toast.error("Unauthorized access! Please login.");
          return;
        }

        const response = await fetch("http://localhost:8000/apna/get_jobs/", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        if (response.ok) {
          setJobs(data.jobs);
        } else {
          toast.error(data.message || "Failed to fetch jobs.");
        }
      } catch (error) {
        toast.error("Error fetching jobs.");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  return (
    <>
      <HrNavbar />
      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-xl p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#190A28] text-center mb-6">HR Dashboard</h2>

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <AiOutlineLoading3Quarters className="text-[#190A28] text-4xl animate-spin" />
            </div>
          ) : jobs.length === 0 ? (
            <p className="text-center text-gray-600">No jobs available.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <div
                  key={job.job_id}
                  className="border rounded-xl p-4 sm:p-6 shadow-md bg-white hover:shadow-lg transition-transform transform hover:scale-105"
                >
                  <h3 className="text-xl sm:text-2xl font-bold text-[#190A28] mb-2 sm:mb-4">{job.job_title}</h3>
                  <p className="text-gray-700 mb-3 sm:mb-4">{job.job_description}</p>

                  <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                    <span className="flex items-center bg-gray-200 px-3 py-1 rounded-md text-sm">
                      <FiBriefcase className="text-[#190A28] mr-1" /> {job.experience} Years
                    </span>
                    <span className="flex items-center bg-gray-200 px-3 py-1 rounded-md text-sm">
                      <FaMoneyBillWave className="text-green-500 mr-1" /> {job.salary} LPA
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-gray-700 flex items-center">
                    <FaTools className="text-lg text-[#190A28] mr-2" />
                    <strong>Skills:</strong> {job.skills_required.split(", ").join(", ")}
                    </p>
                    {/* <p className="text-gray-700 flex items-center">
                      <FiUser className="text-lg text-[#190A28] mr-2" />
                      <strong>HR Name:</strong> {job.hr_name}
                    </p>
                    <p className="text-gray-700 flex items-center">
                      <FiMail className="text-lg text-[#190A28] mr-2" />
                      <strong>HR Email:</strong> {job.hr_email}
                    </p> */}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
