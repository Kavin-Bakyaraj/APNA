import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const CreateJob = () => {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const currentDateTime = "2025-02-15 20:35:51"; // Hardcoded as per requirement
  const userLogin = "Kavin-Bakyaraj"; // Hardcoded as per requirement
  const hrEmail = localStorage.getItem("email") || "user@example.com";

  const [formData, setFormData] = useState({
    job_title: "",
    job_description: "",
    skills_required: "",
    salary: "",
    hr_questions: Array(5).fill().map(() => ({ question: "", keyword: "" }))
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle numeric fields
    if (name === 'experience' || name === 'pass_percentage') {
        setFormData(prev => ({
          ...prev,
          [name]: value === '' ? 0 : Number(value)
        }));
      } else if (name === 'salary') {
        // Remove "LPA" if it exists and clean the input
        const numericValue = value.replace(/[^0-9.]/g, '');
        setFormData(prev => ({
          ...prev,
          [name]: numericValue ? `${numericValue} LPA` : ''
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...formData.hr_questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      hr_questions: updatedQuestions
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate and prepare data
    const submitData = {
      ...formData,
      experience: Number(formData.experience), // Ensure it's a number
      pass_percentage: Number(formData.pass_percentage), // Ensure it's a number
    };

    // Validate numeric fields
    if (submitData.pass_percentage < 0 || submitData.pass_percentage > 100) {
      toast.error("Pass percentage must be between 0 and 100");
      return;
    }

    if (submitData.experience < 0) {
      toast.error("Experience cannot be negative");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/apna/post_job/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success("Job created successfully!");
        navigate("/hr-jobs");
      } else {
        toast.error(data.message || "Failed to create job");
      }
    } catch (error) {
      toast.error("Error creating job: " + error.message);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
    toast.success("Logged out successfully");
  };

  return (
    <div style={styles.dashboardContainer}>
      {/* Navigation Bar */}
      <div style={styles.navbar}>
        <div style={styles.navLeft}>
          <h2 style={styles.logo}>Create New Job</h2>
          <div style={styles.dateTimeContainer}>
            <span style={styles.dateTime}>{currentDateTime}</span>
          </div>
        </div>
        <div style={styles.navRight}>
          <button 
            style={styles.backButton} 
            onClick={() => navigate("/hr-jobs")}
          >
            Back to Jobs
          </button>
          <div style={styles.profileContainer}>
            <div 
              style={styles.profileTrigger} 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div style={styles.avatar}>{userLogin[0]}</div>
              <div style={styles.profileInfo}>
                <span style={styles.profileEmail}>{hrEmail}</span>
              </div>
            </div>
            {showProfileMenu && (
              <div style={styles.profileMenu}>
                <div style={styles.profileHeader}>
                  <div style={styles.profileAvatar}>{userLogin[0]}</div>
                  <div>
                    <div style={styles.menuProfileName}>{userLogin}</div>
                    <div style={styles.menuProfileEmail}>{hrEmail}</div>
                  </div>
                </div>
                <div style={styles.menuDivider} />
                <button style={styles.logoutButton} onClick={handleLogout}>
                  <span style={styles.logoutIcon}>↪</span> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div style={styles.mainContent}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Job Title *</label>
            <input
              type="text"
              name="job_title"
              value={formData.job_title}
              onChange={handleInputChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Job Description *</label>
            <textarea
              name="job_description"
              value={formData.job_description}
              onChange={handleInputChange}
              style={styles.textarea}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Skills Required *</label>
            <input
              type="text"
              name="skills_required"
              value={formData.skills_required}
              onChange={handleInputChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.row}>
      <div style={styles.formGroup}>
        <label style={styles.label}>Salary (LPA) *</label>
        <div style={styles.inputWithSuffix}>
          <input
            type="text"
            name="salary"
            value={formData.salary.replace(' LPA', '')} // Remove LPA for input
            onChange={handleInputChange}
            style={styles.salaryInput}
            placeholder="e.g., 12"
            required
          />
          <span style={styles.inputSuffix}>LPA</span>
        </div>
      </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Experience (years) *</label>
              <input
                type="number"
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                style={styles.input}
                min="0"
                required
              />
            </div>

            <div style={styles.formGroup}>
        <label style={styles.label}>Pass Percentage *</label>
        <div style={styles.inputWithSuffix}>
          <input
            type="number"
            name="pass_percentage"
            value={formData.pass_percentage}
            onChange={handleInputChange}
            style={styles.percentageInput}
            min="0"
            max="100"
            required
          />
          <span style={styles.inputSuffix}>%</span>
        </div>
      </div>
    </div>

          {/* HR Questions */}
          <div style={styles.questionsSection}>
            <h3 style={styles.questionSectionTitle}>HR Questions (5 Required)</h3>
            {formData.hr_questions.map((question, index) => (
              <div key={index} style={styles.questionBox}>
                <h4 style={styles.questionTitle}>Question {index + 1}</h4>
                <div style={styles.questionContent}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Question *</label>
                    <textarea
                      value={question.question}
                      onChange={(e) => handleQuestionChange(index, "question", e.target.value)}
                      style={styles.textarea}
                      required
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Expected Keyword *</label>
                    <input
                      type="text"
                      value={question.keyword}
                      onChange={(e) => handleQuestionChange(index, "keyword", e.target.value)}
                      style={styles.input}
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.buttonContainer}>
            <button type="submit" style={styles.submitButton}>
              Create Job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
// Use the same styles as HRDashboard and add form-specific styles
const styles = {
   
        dashboardContainer: {
          minHeight: "100vh",
          background: "#f5f7fa",
          width: "100%",
        },
        navbar: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "15px 30px",
          background: "white",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        },
        navLeft: {
          display: "flex",
          alignItems: "center",
          gap: "20px",
        },
        logo: {
          margin: 0,
          color: "#2c3e50",
          fontSize: "24px",
        },
        dateTimeContainer: {
          padding: "8px 16px",
          background: "#f8f9fa",
          borderRadius: "8px",
        },
        dateTime: {
          color: "#6c757d",
          fontSize: "14px",
        },
        navRight: {
          display: "flex",
          alignItems: "center",
          gap: "20px",
        },
        mainContent: {
          padding: "20px 40px",
        },
        createJobButton: {
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 20px",
          background: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "500",
          transition: "background-color 0.3s",
        },
        plusIcon: {
          fontSize: "18px",
          fontWeight: "bold",
        },
        profileContainer: {
          position: "relative",
        },
        profileTrigger: {
          display: "flex",
          alignItems: "center",
          gap: "12px",
          cursor: "pointer",
          padding: "8px",
          borderRadius: "8px",
          transition: "background-color 0.3s",
        },
        avatar: {
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          background: "#007bff",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
          fontWeight: "bold",
        },
        profileInfo: {
          display: "flex",
          flexDirection: "column",
        },
        profileName: {
          fontSize: "14px",
          fontWeight: "500",
          color: "#2c3e50",
        },
        profileEmail: {
          fontSize: "12px",
          color: "#6c757d",
        },
        profileMenu: {
          position: "absolute",
          top: "100%",
          right: 0,
          marginTop: "10px",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          width: "280px",
          padding: "16px",
        },
        profileHeader: {
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "8px",
        },
        profileAvatar: {
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          background: "#007bff",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
          fontWeight: "bold",
        },
        menuProfileName: {
          fontSize: "16px",
          fontWeight: "500",
          color: "#2c3e50",
        },
        menuProfileEmail: {
          fontSize: "13px",
          color: "#6c757d",
          marginTop: "2px",
        },
        menuDivider: {
          height: "1px",
          background: "#e9ecef",
          margin: "12px 0",
        },
        logoutButton: {
          display: "flex",
          alignItems: "center",
          gap: "8px",
          width: "100%",
          padding: "10px",
          border: "none",
          borderRadius: "8px",
          background: "#f8f9fa",
          color: "#dc3545",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "500",
          transition: "background-color 0.3s",
        },
        logoutIcon: {
          fontSize: "16px",
        },
        statsSection: {
          marginBottom: "30px",
        },
        statsContainer: {
          display: "flex",
          gap: "20px",
        },
        statBox: {
          background: "white",
          padding: "20px 30px",
          borderRadius: "12px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          minWidth: "200px",
        },
        statNumber: {
          display: "block",
          fontSize: "28px",
          fontWeight: "bold",
          color: "#007bff",
          marginBottom: "8px",
        },
        statLabel: {
          color: "#6c757d",
          fontSize: "14px",
        },
        jobGrid: {
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "20px",
        },
        jobCard: {
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          cursor: "pointer",
          transition: "transform 0.2s, box-shadow 0.2s",
        },
        jobTitle: {
          margin: "0 0 15px 0",
          color: "#2c3e50",
          fontSize: "18px",
        },
        jobDetails: {
          color: "#666",
          fontSize: "14px",
          "& p": {
            margin: "8px 0",
          },
        },
        modalOverlay: {
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
        },
        modalContent: {
          background: "white",
          borderRadius: "12px",
          width: "90%",
          maxWidth: "700px",
          maxHeight: "90vh",
          overflow: "hidden",
        },
        modalHeader: {
          padding: "20px",
          borderBottom: "1px solid #eee",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        },
        modalBody: {
          padding: "20px",
          overflowY: "auto",
          maxHeight: "calc(90vh - 80px)",
        },
        closeButton: {
          background: "transparent",
          border: "none",
          fontSize: "24px",
          cursor: "pointer",
          color: "#666",
          padding: "5px 10px",
        },
        section: {
          marginTop: "25px",
        },
        questionsList: {
          listStyle: "none",
          padding: 0,
        },
        keyword: {
          background: "#e9ecef",
          padding: "4px 8px",
          borderRadius: "4px",
          fontSize: "12px",
          color: "#666",
        },
        candidatesList: {
          listStyle: "none",
          padding: 0,
        },
        candidateItem: {
          padding: "15px",
          borderBottom: "1px solid #eee",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        },
        score: { 
          background: "#28a745",
          color: "white",
          padding: "4px 8px",
          borderRadius: "4px",
          fontSize: "14px",
        },
  form: {
    background: "white",
    padding: "30px",
    borderRadius: "12px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    margin: "20px 0",
  },
  formSection: {
    marginBottom: "30px",
  },
  sectionTitle: {
    color: "#2c3e50",
    marginBottom: "20px",
  },
  formGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    color: "#2c3e50",
    fontSize: "14px",
    fontWeight: "500",
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ddd",
    fontSize: "14px",
  },
  textarea: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ddd",
    fontSize: "14px",
    minHeight: "100px",
    resize: "vertical",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "20px",
  },
  submitButton: {
    padding: "10px 20px",
    background: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  backButton: {
    padding: "8px 16px",
    background: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    marginRight: "20px",
  },
};

export default CreateJob;