import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const HRDashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState("");
  const navigate = useNavigate();

  const hrEmail = localStorage.getItem("email") || "user@example.com";
 

  useEffect(() => {
    fetchJobs();
    updateDateTime();
    // Update time every minute
    const timer = setInterval(updateDateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  const updateDateTime = () => {
    const now = new Date();
    const formatted = now.toISOString().slice(0, 19).replace('T', ' ');
    setCurrentDateTime(formatted);
  };

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/apna/get_jobs/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok) {
        setJobs(data.jobs);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to fetch jobs.");
    }
  };

  const handleCandidateClick = (candidate) => {
    navigate(`/candidate/${candidate.email}`);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
    toast.success("Logged out successfully");
  };

  const handleDeleteJob = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`http://localhost:8000/apna/delete_job/${jobId}/`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
  
        const data = await response.json();
        
        if (response.ok) {
          toast.success("Job deleted successfully");
          setSelectedJob(null); // Close the modal
          fetchJobs(); // Refresh the jobs list
        } else {
          toast.error(data.message || "Failed to delete job");
        }
      } catch (error) {
        toast.error("Error deleting job");
      }
    }
  };

  const handleCreateJob = () => {
    navigate("/create-job");
  };

  const formatSkills = (skills) => {
    if (Array.isArray(skills)) {
      return skills.join(", ");
    }
    return typeof skills === 'string' ? skills : '';
  };

  return (
    <div style={styles.dashboardContainer}>
      {/* Top Navigation Bar */}
      <div style={styles.navbar}>
        <div style={styles.navLeft}>
          <h2 style={styles.logo}>HR Dashboard</h2>
          <div style={styles.dateTimeContainer}>
            <span style={styles.dateTime}>{currentDateTime} UTC</span>
          </div>
        </div>
        <div style={styles.navRight}>
          <button style={styles.createJobButton} onClick={handleCreateJob}>
            <span style={styles.plusIcon}>+</span> Create New Job
          </button>
          <div style={styles.profileContainer}>
            <div 
              style={styles.profileTrigger} 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div style={styles.avatar}>{hrEmail[0]?.toUpperCase()}</div>
              <div style={styles.profileInfo}>
                <span style={styles.profileEmail}>{hrEmail}</span>
              </div>
            </div>
            {showProfileMenu && (
              <div style={styles.profileMenu}>
                <div style={styles.profileHeader}>
                  <div style={styles.profileAvatar}>{hrEmail[0]?.toUpperCase()}</div>
                  <div>
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

      {/* Dashboard Content */}
      <div style={styles.mainContent}>
        {/* Stats Section */}
        <div style={styles.statsSection}>
          <div style={styles.statsContainer}>
            <div style={styles.statBox}>
              <span style={styles.statNumber}>{jobs.length}</span>
              <span style={styles.statLabel}>Total Jobs</span>
            </div>
            <div style={styles.statBox}>
              <span style={styles.statNumber}>
                {jobs.filter(job => job.selected_candidates?.length > 0).length}
              </span>
              <span style={styles.statLabel}>candidates Passed Tests</span>
            </div>
          </div>
        </div>

        {/* Job Grid */}
        <div style={styles.jobGrid}>
          {jobs.map((job) => (
            <div
              key={job._id}
              style={styles.jobCard}
              onClick={() => setSelectedJob(job)}
            >
              <h3 style={styles.jobTitle}>{job.job_title}</h3>
              <div style={styles.jobDetails}>
                <p><strong>Salary:</strong> {job.salary}</p>
                <p><strong>Experience:</strong> {job.experience}</p>
                <p><strong>Candidates:</strong> {job.selected_candidates?.length || 0}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for job details */}
      {selectedJob && (
        <div style={styles.modalOverlay} onClick={() => setSelectedJob(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div style={styles.modalHeader}>
  <h2>{selectedJob.job_title}</h2>
  <div style={styles.modalActions}>
    <button 
      style={styles.deleteButton}
      onClick={() => handleDeleteJob(selectedJob._id)}
    >
      Delete Job
    </button>
    <button 
      style={styles.closeButton} 
      onClick={() => setSelectedJob(null)}
    >
      ×
    </button>
  </div>
</div>
            
            <div style={styles.modalBody}>
              <p><strong>Description:</strong> {selectedJob.job_description}</p>
              <p><strong>Skills Required:</strong> {formatSkills(selectedJob.skills_required)}</p>
              <p><strong>Salary:</strong> {selectedJob.salary}</p>
              <p><strong>Experience:</strong> {selectedJob.experience}</p>
              <p><strong>Pass Percentage:</strong> {selectedJob.pass_percentage}%</p>

              <div style={styles.section}>
                <h3>HR Questions:</h3>
                <ul style={styles.questionsList}>
                  {selectedJob.hr_questions.map((q, index) => (
                    <li key={index}>
                      <strong>{q.question}</strong>
                      <span style={styles.keyword}>Keyword: {q.keyword}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={styles.section}>
  <h3>Selected Candidates:</h3>
  {selectedJob.selected_candidates?.length > 0 ? (
    <ul style={styles.candidatesList}>
      {selectedJob.selected_candidates.map((candidate, index) => (
        <li 
          key={index} 
          style={styles.candidateItem}
          onClick={() => handleCandidateClick(candidate)}
        >
          <div style={styles.candidateInfo}>
            <strong>{candidate.name}</strong>
            <div style={styles.candidateEmail}>{candidate.email}</div>
          </div>
          <span style={styles.score}>Score: {candidate.score}%</span>
        </li>
      ))}
    </ul>
  ) : (
    <p>No candidates selected yet.</p>
  )}
</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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
    maxWidth: "900px",
    maxHeight: "900px",
    overflow: "hidden",
  },
  modalHeader: {
    padding: "20px",
    borderBottom: "1px solid #eee",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  deleteButton: {
    padding: "8px 16px",
    background: "#dc3545",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "background-color 0.3s",
    '&:hover': {
      background: "#c82333",
    },
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
};

export default HRDashboard;