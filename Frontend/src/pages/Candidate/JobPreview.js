import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import Cookies from "js-cookie";
import { toast } from "react-toastify";

const JobPreview = () => {
  const { jobid } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testStatus, setTestStatus] = useState("not_attempted");
  const [answers, setAnswers] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Check application status function wrapped inside useCallback
  const checkApplicationStatus = useCallback(async () => {
    try {
      const token = Cookies.get("jwt");
      if (!token) return;

      const response = await fetch(
        `http://localhost:8000/apna/check_application_status/${jobid}/`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        setTestStatus(data.passed ? "passed" : data.applied ? "failed" : "not_attempted");
      }
    } catch (error) {
      toast.error("Error checking application status.");
    }
  }, [jobid]);

  // Fetch job details
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const token = Cookies.get("jwt");
        if (!token) {
          toast.error("Authorization token missing. Please log in.");
          return;
        }

        const response = await fetch(
          `http://localhost:8000/apna/get_job_details/${jobid}/`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();
        if (response.ok) {
          setJob(data);
          checkApplicationStatus(); // Check if user has applied before
        } else {
          toast.error(data.message || "Error fetching job details.");
        }
      } catch (error) {
        toast.error("Network error while fetching job details.");
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobid, checkApplicationStatus]); // Added checkApplicationStatus in dependencies

  // Handle input change
  const handleAnswerChange = (question, value) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [question]: value,
    }));
  };

  // Submit HR test
  const submitAnswers = async () => {
    setSubmitting(true);
    try {
      const token = Cookies.get("jwt");
      const candidateEmail = localStorage.getItem("candidate_email");

      if (!token || !candidateEmail) {
        toast.error("Please login before applying.");
        return;
      }

      const response = await fetch("http://localhost:8000/apna/apply_job/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          job_id: jobid,
          candidate_email: candidateEmail,
          answers,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        checkApplicationStatus();
      } else {
        toast.error(data.message || "Error submitting answers.");
      }
    } catch (error) {
      toast.error("Network error while submitting answers.");
    } finally {
      setSubmitting(false);
      setShowModal(false);
    }
  };

  if (loading) {
    return <div>Loading job details...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <button onClick={() => window.history.back()} className="text-blue-500">
        ← Back to Jobs
      </button>

      {job ? (
        <div className="bg-white shadow-md rounded-lg p-6 mt-4">
          <h2 className="text-2xl font-bold text-black-700">{job.job_title}</h2>
          <p>{job.job_description}</p>

          <p>
            <strong>Skills Required:</strong> {job.skills_required}
          </p>
          <p>
            <strong>Salary:</strong> {job.salary} LPA
          </p>
          <p>
            <strong>Experience:</strong> {job.experience} years
          </p>

          {/* Apply Button Logic */}
          {testStatus === "not_attempted" ? (
            <button
              onClick={() => setShowModal(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded mt-4"
            >
              Apply Now
            </button>
          ) : testStatus === "failed" ? (
            <button className="bg-red-600 text-white px-4 py-2 rounded mt-4" disabled>
              You have failed the test
            </button>
          ) : (
            <button className="bg-green-600 text-white px-4 py-2 rounded mt-4" disabled>
              You have already applied
            </button>
          )}

          {/* HR Questions Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
              <div className="bg-white p-6 rounded-lg w-96">
                <h3 className="text-xl font-bold">Answer HR Questions</h3>
                {job.hr_questions.map((q, index) => (
                  <div key={index} className="mt-3">
                    <label>{q.question}</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded mt-1"
                      onChange={(e) => handleAnswerChange(q.question, e.target.value)}
                    />
                  </div>
                ))}
                <button
                  onClick={submitAnswers}
                  className="bg-purple-700 text-white px-4 py-2 mt-4 rounded w-full"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Answers"}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-600 mt-4">Job not found.</p>
      )}
    </div>
  );
};

export default JobPreview;
