import { useState } from "react";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

export default function CandidateResumeUpload() {
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [profileStatus, setProfileStatus] = useState("");

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed!");
      return;
    }
    setResumeFile(file);
  };

  const uploadResume = async () => {
    if (!resumeFile) {
      toast.error("Please select a PDF resume to upload.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const token = Cookies.get("jwt");
    const formData = new FormData();
    formData.append("resume", resumeFile);

    try {
      const response = await fetch("http://localhost:8000/apna/upload_resume/", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Upload failed");

      // Simulate progress bar filling
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 20;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(progressInterval);
          setIsUploaded(true);
          setQuestions(data.data.questions || []);
          toast.success("Resume uploaded successfully!");
        }
      }, 2000);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnswerChange = (question, answer) => {
    setAnswers({ ...answers, [question]: answer });
  };

  const submitTest = async () => {
    const token = Cookies.get("jwt");

    if (Object.keys(answers).length !== questions.length) {
      toast.error("Please answer all questions before submitting.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/apna/candidate_test/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answers }),
      });

      const data = await response.json();
      if (response.ok) {
        setProfileStatus(data.profile_status);
        toast.success(`Test Completed! Status: ${data.profile_status}`);

        if (data.profile_status === "Verified") {
          setTimeout(() => {
            window.location.href = "/candidate-dashboard"; // Redirect after 3 seconds
          }, 3000);
        }
      } else {
        toast.error(data.message || "Verification failed");
      }
    } catch (error) {
      toast.error("Error verifying candidate");
    }
};

  return (
    <div className="min-h-screen p-6 bg-gray-50 flex flex-col items-center">
      <h2 className="text-3xl font-bold text-[#190A28]">Upload Your Resume</h2>

      {!isUploaded ? (
        <div className="mt-4 w-full max-w-md bg-white p-6 rounded-lg shadow-lg">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="w-full border rounded-md p-2"
            disabled={isUploading}
          />

          <button
            onClick={uploadResume}
            disabled={isUploading}
            className={`mt-4 w-full px-4 py-2 rounded-md text-white transition ${
              isUploading ? "bg-gray-400" : "bg-[#190A28] hover:bg-[#2B1C43]"
            }`}
          >
            {isUploading ? "Uploading..." : "Upload Resume"}
          </button>

          {isUploading && (
            <div className="mt-4 w-full bg-gray-300 rounded-md">
              <div
                className="bg-[#190A28] text-xs font-medium text-center p-1 leading-none text-white rounded-md"
                style={{ width: `${uploadProgress}%` }}
              >
                {uploadProgress}%
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 w-full max-w-md bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold text-[#190A28] mb-4">Answer the Questions</h3>
          {questions.map((q, index) => (
            <div key={index} className="mb-4">
              <p className="text-gray-700">{q.question}</p>
              <input
                type="text"
                className="w-full border rounded-md p-2 mt-2"
                placeholder="Your Answer..."
                onChange={(e) => handleAnswerChange(q.question, e.target.value)}
              />
            </div>
          ))}

          <button
            onClick={submitTest}
            className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
          >
            Submit Test & Verify
          </button>
        </div>
      )}

      {profileStatus && (
        <p
          className={`mt-4 text-lg font-bold ${
            profileStatus === "Verified" ? "text-green-600" : "text-red-600"
          }`}
        >
          Profile Status: {profileStatus}
        </p>
      )}
    </div>
  );
}
