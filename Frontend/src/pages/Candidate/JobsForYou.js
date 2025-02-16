import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Cookies from "js-cookie";
import { toast } from "react-toastify";

const JobsForYou = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [candidateSkills, setCandidateSkills] = useState([]);

  useEffect(() => {
    const fetchMatchedJobs = async () => {
      try {
        const token = Cookies.get("jwt");
        if (!token) {
          toast.error("Authorization token missing. Please log in.");
          setLoading(false);
          return;
        }

        const response = await fetch("http://localhost:8000/apna/get_matched_jobs/", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (response.ok) {
          setJobs(data.matched_jobs || []);
          setCandidateSkills(data.candidate_skills || []);
        } else {
          toast.error(data.message || "Error fetching matched jobs.");
        }
      } catch (error) {
        toast.error("Network error while fetching matched jobs.");
      } finally {
        setLoading(false);
      }
    };

    fetchMatchedJobs();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-purple-700">Jobs for You</h1>
      <p className="text-gray-600 mb-4">
        Based on your skills:{" "}
        <span className="font-semibold text-purple-600">{candidateSkills.join(", ")}</span>
      </p>

      {loading ? (
        <div className="text-center text-gray-600">Loading jobs...</div>
      ) : jobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div key={job._id.$oid} className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-bold text-purple-700">{job.job_title}</h2>
              <p className="text-gray-600">{job.job_description}</p>

              <p className="mt-2">
                <strong>Skills Required:</strong> {job.skills_required}
              </p>
              <p>
                <strong>Salary:</strong> {job.salary} LPA
              </p>
              <p>
                <strong>Experience:</strong> {job.experience} years
              </p>

              <Link
                to={`/job-preview/${job._id.$oid}`}
                className="block bg-purple-600 text-white px-4 py-2 rounded mt-4 text-center hover:bg-purple-700 transition"
              >
                Apply Now
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-600 mt-4">
          No matched jobs found based on your skills.
        </div>
      )}
    </div>
  );
};

export default JobsForYou;
