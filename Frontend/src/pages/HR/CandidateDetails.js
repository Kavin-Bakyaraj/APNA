import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

export default function CandidateDetails() {
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    skills: false,
    experience: false,
    projects: false,
    questions: false,
  });

  // Get candidate email from localStorage
  const email = localStorage.getItem("selected_candidate_email");

  useEffect(() => {
    if (!email) {
      toast.error("No candidate selected.");
      navigate("/hr-dashboard");
      return;
    }

    const fetchCandidateDetails = async () => {
      try {
        const token = Cookies.get("jwt");
        const response = await fetch(`http://localhost:8000/apna/candidate/${email}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setCandidate(data);
        } else {
          toast.error(data.message || "Error fetching candidate details");
        }
      } catch (error) {
        toast.error("Network error while fetching candidate details");
      }
    };

    fetchCandidateDetails();
  }, [email, navigate]);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <button
        onClick={() => {
          localStorage.removeItem("selected_candidate_email"); // Clear stored email
          navigate(-1);
        }}
        className="mb-4 px-4 py-2 bg-[#190A28] text-white rounded-md hover:bg-[#2B1C43] transition"
      >
        Back
      </button>

      {candidate ? (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          {/* Candidate Basic Info */}
          <h2 className="text-3xl font-bold text-[#190A28]">{candidate.name}</h2>
          <p className="text-gray-600 text-lg">📧 {candidate.email}</p>
          <p className={`text-lg font-semibold ${candidate.profile_status === "Verified" ? "text-green-600" : "text-red-600"}`}>
            Profile Status: {candidate.profile_status}
          </p>

          {/* Skills Section */}
          <div className="mt-4 border-t pt-4">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("skills")}
            >
              <h3 className="text-xl font-semibold">Skills</h3>
              {expandedSections.skills ? <FiChevronUp /> : <FiChevronDown />}
            </div>
            {expandedSections.skills && (
              <div className="mt-2 flex flex-wrap gap-2">
                {candidate.resume_skills.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-[#190A28] text-white rounded-md text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Work Experience Section */}
          <div className="mt-4 border-t pt-4">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("experience")}
            >
              <h3 className="text-xl font-semibold">Work Experience</h3>
              {expandedSections.experience ? <FiChevronUp /> : <FiChevronDown />}
            </div>
            {expandedSections.experience && (
              <ul className="mt-2 list-disc pl-5 text-gray-700">
                {candidate.work_experience.map((exp, index) => (
                  <li key={index}>{exp}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Projects Section */}
          <div className="mt-4 border-t pt-4">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("projects")}
            >
              <h3 className="text-xl font-semibold">Projects</h3>
              {expandedSections.projects ? <FiChevronUp /> : <FiChevronDown />}
            </div>
            {expandedSections.projects && (
              <ul className="mt-2 list-disc pl-5 text-gray-700">
                {candidate.projects.map((project, index) => (
                  <li key={index}>{project}</li>
                ))}
              </ul>
            )}
          </div>

          {/* HR Questions Section */}
          <div className="mt-4 border-t pt-4">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("questions")}
            >
              <h3 className="text-xl font-semibold">Generated Questions</h3>
              {expandedSections.questions ? <FiChevronUp /> : <FiChevronDown />}
            </div>
            {expandedSections.questions && (
              <ul className="mt-2 list-disc pl-5 text-gray-700">
                {candidate.generated_questions.map((q, index) => (
                  <li key={index}>
                    <p className="font-medium">{q.question}</p>
                    <p className="text-gray-500 text-sm">Keyword: {q.keyword}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <p className="text-gray-500">Loading candidate details...</p>
      )}
    </div>
  );
}
