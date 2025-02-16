import { useState } from "react";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import { FiAlertCircle, FiInfo } from "react-icons/fi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

export default function PostJob() {
  const [formData, setFormData] = useState({
    job_title: "",
    company_name: "",
    job_description: "",
    contact_email: "",
    application_deadline: "",
    selectedWorkType: "",
    job_location: "",
    selectedCategory: "",
    skills_required: "",
    salary: "",
    experience: "",
    pass_percentage: "",
    hr_questions: [{ question: "", keyword: "" }],
  });

  const [charCount, setCharCount] = useState({
    job_title: 0,
    job_description: 0,
    skills_required: 0,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Update character count
    setCharCount({ ...charCount, [name]: value.length });
  };

  const handleQuestionChange = (index, e) => {
    const updatedQuestions = [...formData.hr_questions];
    updatedQuestions[index][e.target.name] = e.target.value;
    setFormData({ ...formData, hr_questions: updatedQuestions });
  };

  const addQuestion = () => {
    if (formData.hr_questions.length < 5) {
      setFormData({
        ...formData,
        hr_questions: [...formData.hr_questions, { question: "", keyword: "" }],
      });
    } else {
      toast.error("You must add at least 5 HR questions.");
    }
  };

  const handleRemoveQuestion = (index) => {
    if (formData.hr_questions.length > 2) {
      const updatedQuestions = formData.hr_questions.filter((_, i) => i !== index);
      setFormData({ ...formData, hr_questions: updatedQuestions });
    } else {
      toast.error("At least 2 HR questions are required.");
    }
  };

  const validateFields = () => {
    let newErrors = {};

    if (!formData.job_title || formData.job_title.length > 50) newErrors.job_title = "Job Title is required (Max 50 chars)";
    if (!formData.company_name) newErrors.company_name = "Company Name is required";
    if (!formData.job_description || formData.job_description.length > 500) newErrors.job_description = "Job Description is required (Max 500 chars)";
    if (!formData.contact_email) newErrors.contact_email = "Contact Email is required";
    if (!formData.application_deadline) newErrors.application_deadline = "Application Deadline is required";
    if (!formData.selectedWorkType) newErrors.selectedWorkType = "Work Type is required";
    if (!formData.job_location) newErrors.job_location = "Job Location is required";
    if (!formData.selectedCategory) newErrors.selectedCategory = "Category is required";
    if (!formData.skills_required || formData.skills_required.length > 200) newErrors.skills_required = "Skills are required (Max 200 chars)";
    if (!formData.salary) newErrors.salary = "Salary is required";
    if (!formData.experience) newErrors.experience = "Experience is required";
    if (!formData.pass_percentage || formData.pass_percentage < 0 || formData.pass_percentage > 100)
        newErrors.pass_percentage = "Pass percentage must be between 0-100%";

    if (formData.hr_questions.length < 2 || formData.hr_questions.length > 5)
        newErrors.hr_questions = "Between 2 and 5 HR questions are required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
};

const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateFields()) return;

    setLoading(true);

    // Ensure HR Questions are filled and filter out empty ones
    const validQuestions = formData.hr_questions.filter(
        (q) => q.question.trim() !== "" && q.keyword.trim() !== ""
    );

    if (validQuestions.length < 2 || validQuestions.length > 5) {
        toast.error("You must provide between 2 and 5 complete HR questions.");
        setLoading(false);
        return;
    }

    const updatedFormData = { ...formData, hr_questions: validQuestions };

    const token = Cookies.get("jwt");
    if (!token) {
        toast.error("Authorization token missing.");
        setLoading(false);
        return;
    }

    try {
        const response = await fetch("http://localhost:8000/apna/post_job/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(updatedFormData),
        });

        const data = await response.json();
        if (response.ok) {
            toast.success("Job posted successfully!");
            setFormData({
                job_title: "",
                company_name: "",
                job_description: "",
                contact_email: "",
                application_deadline: "",
                selectedWorkType: "",
                job_location: "",
                selectedCategory: "",
                skills_required: "",
                salary: "",
                experience: "",
                pass_percentage: "",
                hr_questions: [{ question: "", keyword: "" }, { question: "", keyword: "" }],
            });
        } else {
            toast.error(data.message || "Failed to post job.");
        }
    } catch (error) {
        toast.error("Error posting job.");
    }

    setLoading(false);
};

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex justify-center py-6 px-4">
        <div className="w-full max-w-3xl bg-white shadow-lg rounded-xl p-4">
          <h2 className="text-2xl font-bold text-[#190A28] text-center mb-4">Post a Job</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { name: "job_title", title: "Job Title", example: "Software Engineer", placeholder: "Enter Job Title", maxLength: 50, },
            { name: "company_name", title: "Company Name", example: "OneDot Communications.", placeholder: "Enter Company Name", maxLength: 100 },
            { name: "job_description", title: "Job Description", example: "Develop and maintain software applications...", placeholder: "Enter Job Description", maxLength: 500, type: "textarea" },
            { name: "contact_email", title: "Contact Email", example: "hr@onedotcommunication.com", placeholder: "Enter Contact Email", type: "email" },
            { name: "application_deadline", title: "Application Deadline", example: "28-12-2025", placeholder: "Enter Application Deadline", type: "date" },
            { name: "skills_required", title: "Skills Required", example: "JavaScript, React, Node.js", placeholder: "Enter Required Skills (comma-separated)", maxLength: 200 },
            ].map(({ name, title, example, placeholder, maxLength, type = "text" }) => (
            <div key={name} className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {title}
                  <FiInfo
                    className="inline-block ml-1 text-gray-400 cursor-pointer"
                    title={`Example: ${example}`}
                  />
                </label>
                {type === "textarea" ? (
                <textarea
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    className="pl-3 pr-10 py-2 input-field h-24"
                ></textarea>
                ) : (
                <input
                    type={type}
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    className="pl-3 pr-10 py-2 input-field"
                />
                )}
                {maxLength && (
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                    {charCount[name]}/{maxLength}
                  </span>
                )}
                {errors[name] && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                    <FiAlertCircle className="mr-1" /> {errors[name]}
                </p>
                )}
            </div>
            ))}

            {/* Work Type (Dropdown) */}
            <div key="selectedWorkType" className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Work Type
                <FiInfo
                  className="inline-block ml-1 text-gray-400 cursor-pointer"
                  title="Example: Full-Time"
                />
              </label>
              <select
                name="selectedWorkType"
                value={formData.selectedWorkType}
                onChange={handleChange}
                className="pl-3 input-field py-2"
              >
                <option value="" disabled>Select Work Type</option>
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
              {errors.selectedWorkType && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <FiAlertCircle className="mr-1" /> {errors.selectedWorkType}
                </p>
              )}
            </div>

            {/* Job Location (Text Input) */}
            <div key="job_location" className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Location
                <FiInfo
                  className="inline-block ml-1 text-gray-400 cursor-pointer"
                  title="Example: New York, NY"
                />
              </label>
              <input
                type="text"
                name="job_location"
                value={formData.job_location}
                onChange={handleChange}
                placeholder="Enter Job Location"
                className="pl-3 input-field py-2"
              />
              {errors.job_location && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <FiAlertCircle className="mr-1" /> {errors.job_location}
                </p>
              )}
            </div>

            {/* Category (Dropdown) */}
            <div key="selectedCategory" className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
                <FiInfo
                  className="inline-block ml-1 text-gray-400 cursor-pointer"
                  title="Example: Technology"
                />
              </label>
              <select
                name="selectedCategory"
                value={formData.selectedCategory}
                onChange={handleChange}
                className="pl-3 input-field py-2"
              >
                <option value="" disabled>Select Category</option>
                <option value="Technology">Technology</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Finance">Finance</option>
                <option value="Education">Education</option>
                <option value="Marketing">Marketing</option>
              </select>
              {errors.selectedCategory && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <FiAlertCircle className="mr-1" /> {errors.selectedCategory}
                </p>
              )}
            </div>

            {/* Salary (Only Number Input) */}
            <div key="salary" className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Salary
                <FiInfo
                  className="inline-block ml-1 text-gray-400 cursor-pointer"
                  title="Example: 70000"
                />
              </label>
              <input
                type="number"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                placeholder="Enter Salary (LPA)"
                className="pl-3 input-field py-2"
                min="0"
              />
              {errors.salary && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <FiAlertCircle className="mr-1" /> {errors.salary}
                </p>
              )}
            </div>

            {/* Experience (Dropdown) */}
            <div key="experience" className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Experience
                <FiInfo
                  className="inline-block ml-1 text-gray-400 cursor-pointer"
                  title="Example: 3 years"
                />
              </label>
              <select
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                className="pl-3 input-field py-2"
              >
                <option value="" disabled>Select Experience (Years)</option>
                {[...Array(31).keys()].map((year) => (
                <option key={year} value={year}>{year} {year === 1 ? "year" : "years"}</option>
                ))}
              </select>
              {errors.experience && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <FiAlertCircle className="mr-1" /> {errors.experience}
                </p>
              )}
            </div>

            {/* Pass Percentage (Dropdown) */}
            <div key="pass_percentage" className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pass Percentage
                <FiInfo
                  className="inline-block ml-1 text-gray-400 cursor-pointer"
                  title="Example: 75%"
                />
              </label>
              <select
                name="pass_percentage"
                value={formData.pass_percentage}
                onChange={handleChange}
                className="pl-3 input-field py-2"
              >
                <option value="" disabled>Select Pass Percentage</option>
                {[...Array(101).keys()].map((percent) => (
                <option key={percent} value={percent}>{percent}%</option>
                ))}
              </select>
              {errors.pass_percentage && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <FiAlertCircle className="mr-1" /> {errors.pass_percentage}
                </p>
              )}
            </div>

            {/* HR Questions Section */}
            <h3 className="text-lg font-semibold text-[#190A28]">HR Questions (Min: 2, Max: 5)</h3>
            {formData.hr_questions.map((question, index) => (
                <div key={index} className="flex space-x-2 items-center">
                <input
                    type="text"
                    name="question"
                    value={question.question}
                    onChange={(e) => handleQuestionChange(index, e)}
                    placeholder={`Question ${index + 1}`}
                    className="input-field w-full"
                />
                <input
                    type="text"
                    name="keyword"
                    value={question.keyword}
                    onChange={(e) => handleQuestionChange(index, e)}
                    placeholder="Keyword"
                    className="input-field w-1/3"
                />
                {formData.hr_questions.length > 2 && (
                    <button
                    type="button"
                    onClick={() => handleRemoveQuestion(index)}
                    className="text-red-500 text-lg"
                    >
                    ❌
                    </button>
                )}
                </div>
            ))}

            {/* Add Question Button */}
            {formData.hr_questions.length < 5 && (
                <button
                type="button"
                onClick={addQuestion}
                className="w-full flex justify-center items-center px-4 py-2 text-white bg-[#190A28] rounded-md hover:bg-[#2B1C43] transition"
                >
                ➕ Add Question
                </button>
            )}

            {/* Post Job Button */}
            <button
            type="submit"
            onClick={handleSubmit}
            className={`w-full px-4 py-2 rounded-md flex justify-center transition ${
                loading ? "bg-gray-400 cursor-not-allowed" : "bg-[#190A28] hover:bg-[#2B1C43] text-white"
            }`}
            disabled={loading}
            >
            {loading ? <AiOutlineLoading3Quarters className="animate-spin mr-2" /> : "Post Job"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
