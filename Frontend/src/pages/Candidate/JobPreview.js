import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { FiBriefcase, FiStar, FiDollarSign, FiClock, FiArrowLeft, FiX } from "react-icons/fi";
import { toast } from "react-toastify";

export default function JobPreview() {
  const { jobid } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const response = await fetch(`http://localhost:8000/apna/get_job_details/${jobid}/`);
        const data = await response.json();
        if (response.ok) {
          setJob(data);
        } else {
          console.error("Error fetching job details:", data.message);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobid]);

  const handleAnswerChange = (index, value) => {
    setAnswers({ ...answers, [job.hr_questions[index].question]: value });
  };

  const handleApply = async () => {
    setSubmitting(true);
    const token = Cookies.get("jwt");
    const candidateEmail = localStorage.getItem("candidate_email"); // Assuming email is stored in cookies

    if (!token || !candidateEmail) {
      toast.error("Please login before applying.");
      setSubmitting(false);
      return;
    }

    const payload = {
      job_id: jobid,
      candidate_email: candidateEmail,
      answers: answers,
    };

    try {
      const response = await fetch("http://localhost:8000/apna/apply_job/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        setResult(data);
        toast.success(data.passed ? "Application successful! You passed the test!" : "Application submitted, but you did not pass.");
      } else {
        toast.error(data.message || "Failed to submit application.");
      }
    } catch (error) {
      toast.error("Error submitting application.");
    }

    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 p-6">
      <button onClick={() => navigate("/candidate-dashboard")} className="mb-4 flex items-center text-[#190A28] hover:underline">
        <FiArrowLeft className="mr-2" /> Back to Jobs
      </button>

      {loading ? (
        <p className="text-lg text-gray-500">Loading job details...</p>
      ) : job ? (
        <div className="bg-white shadow-lg rounded-xl p-6 w-full max-w-3xl">
          <h2 className="text-3xl font-bold text-[#190A28] flex items-center">
            <FiBriefcase className="mr-2" /> {job.job_title}
          </h2>
          <p className="text-gray-600 mt-2">{job.job_description}</p>

          <div className="mt-4 space-y-2">
            <p className="text-lg text-gray-600 flex items-center">
            <FiStar className="mr-2 text-[#190A28]" />
                <strong>Skills Required:</strong>
                {Array.isArray(job.skills_required)
                    ? job.skills_required.join(", ")
                    : job.skills_required}
            </p>
            <p className="text-lg text-gray-600 flex items-center">
              <FiDollarSign className="mr-2 text-[#190A28]" />
              <strong>Salary:</strong> {job.salary} LPA
            </p>
            <p className="text-lg text-gray-600 flex items-center">
              <FiClock className="mr-2 text-[#190A28]" />
              <strong>Experience:</strong> {job.experience} years
            </p>
          </div>

          {/* Apply Now Button */}
          <button onClick={() => setShowModal(true)} className="mt-6 w-full px-4 py-2 bg-[#190A28] text-white rounded-md hover:bg-[#2B1C43] transition">
            Apply Now
          </button>
        </div>
      ) : (
        <p className="text-lg text-gray-500">Job not found.</p>
      )}

      {/* Job Application Modal */}
      {showModal && job && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white shadow-lg rounded-xl p-6 w-full max-w-lg relative">
            <button onClick={() => setShowModal(false)} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700">
              <FiX />
            </button>
            <h2 className="text-2xl font-bold text-[#190A28]">Answer HR Questions</h2>

            {job.hr_questions.map((q, index) => (
              <div key={index} className="mt-4">
                <p className="text-gray-600">{q.question}</p>
                <input
                  type="text"
                  className="mt-2 w-full px-4 py-2 border rounded-md"
                  placeholder="Your Answer"
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                />
              </div>
            ))}

            <button
              onClick={handleApply}
              className={`mt-6 w-full px-4 py-2 rounded-md flex justify-center transition ${
                submitting ? "bg-gray-400 cursor-not-allowed" : "bg-[#190A28] hover:bg-[#2B1C43] text-white"
              }`}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Answers"}
            </button>

            {result && (
              <p className={`mt-4 text-lg ${result.passed ? "text-green-600" : "text-red-500"}`}>
                {result.passed ? "✅ You Passed!" : "❌ You Did Not Pass. Try Again!"}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
