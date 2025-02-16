import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

export default function CandidateProfile() {
  const [candidate, setCandidate] = useState(null);

  useEffect(() => {
    const fetchCandidateProfile = async () => {
      try {
        const token = Cookies.get("jwt");
        const response = await fetch("http://localhost:8000/apna/candidate_profile/", {
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
          toast.error(data.message || "Error fetching candidate profile");
        }
      } catch (error) {
        toast.error("Network error while fetching profile");
      }
    };

    fetchCandidateProfile();
  }, []);

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
        {candidate ? (
          <>
            <h2 className="text-3xl font-bold text-[#190A28]">{candidate.name}</h2>
            <p className="text-gray-600">Email: {candidate.email}</p>
            <p className={`mt-2 font-semibold ${candidate.profile_status === "Verified" ? "text-green-600" : "text-yellow-600"}`}>
              Profile Status: {candidate.profile_status}
            </p>

            {/* Show Resume Skills if Available */}
            {candidate.resume_skills && candidate.resume_skills.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-[#190A28]">Skills</h3>
                <ul className="list-disc list-inside text-gray-700">
                  {candidate.resume_skills.map((skill, index) => (
                    <li key={index}>{skill}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Show Projects if Available */}
            {candidate.projects && candidate.projects.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-[#190A28]">Projects</h3>
                <ul className="list-disc list-inside text-gray-700">
                  {candidate.projects.map((project, index) => (
                    <li key={index}>{project}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Show Work Experience if Available */}
            {candidate.work_experience && candidate.work_experience.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-[#190A28]">Work Experience</h3>
                <ul className="list-disc list-inside text-gray-700">
                  {candidate.work_experience.map((exp, index) => (
                    <li key={index}>{exp}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Show Verify Button ONLY if profile is NOT verified */}
            {candidate.profile_status !== "Verified" && (
              <button
                className="mt-6 w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                onClick={() => window.location.href = "/verify-profile"}
              >
                Verify Profile
              </button>
            )}
          </>
        ) : (
          <p className="text-gray-500">Loading profile...</p>
        )}
      </div>
    </div>
  );
}
