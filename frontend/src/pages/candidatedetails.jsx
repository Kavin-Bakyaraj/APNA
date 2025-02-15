import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const CandidateDetails = () => {
  const { candidateEmail } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentDateTime = "2025-02-15 21:02:51"; // As per requirement
  const userLogin = localStorage.getItem("email"); // As per requirement

  useEffect(() => {
    fetchCandidateDetails();
  }, [candidateEmail]);

  const fetchCandidateDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8000/apna/candidate/${candidateEmail}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok) {
        setCandidate(data);
      } else {
        toast.error(data.message || "Failed to fetch candidate details");
        navigate(-1);
      }
    } catch (error) {
      toast.error("Error fetching candidate details");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Navigation Bar */}
      <div style={styles.navbar}>
        <div style={styles.navLeft}>
          <h2 style={styles.logo}>Candidate Profile</h2>
          <div style={styles.dateTimeContainer}>
            <span style={styles.dateTime}>{currentDateTime} UTC</span>
          </div>
        </div>
        <div style={styles.navRight}>
          <button style={styles.backButton} onClick={() => navigate(-1)}>
            Back
          </button>
          <div style={styles.profileContainer}>
            <span style={styles.profileEmail}>{userLogin}</span>
          
          </div>
        </div>
      </div>

      {/* Candidate Details Content */}
      {candidate && (
        <div style={styles.content}>
          {/* Basic Info Card */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Basic Information</h3>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.label}>Name</span>
                <span style={styles.value}>{candidate.name}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.label}>Email</span>
                <span style={styles.value}>{candidate.email}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.label}>Status</span>
                <span style={styles.statusBadge}>{candidate.profile_status}</span>
              </div>
            </div>
          </div>

          {/* Skills Card */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Skills</h3>
            <div style={styles.skillsContainer}>
              {candidate.resume_skills.map((skill, index) => (
                <span key={index} style={styles.skillBadge}>{skill}</span>
              ))}
            </div>
          </div>

          {/* Projects Card */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Projects</h3>
            <div style={styles.projectsGrid}>
              {candidate.projects.map((project, index) => (
                <div key={index} style={styles.projectCard}>
                  {project}
                </div>
              ))}
            </div>
          </div>

          {/* Work Experience Card */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Work Experience</h3>
            <div style={styles.experienceList}>
              {candidate.work_experience.map((exp, index) => (
                <div key={index} style={styles.experienceCard}>
                  {exp}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f7fa',
  },
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 30px',
    background: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  logo: {
    margin: 0,
    color: '#2c3e50',
    fontSize: '24px',
  },
  dateTimeContainer: {
    padding: '8px 16px',
    background: '#f8f9fa',
    borderRadius: '8px',
  },
  dateTime: {
    color: '#6c757d',
    fontSize: '14px',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  backButton: {
    padding: '8px 16px',
    background: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  content: {
    padding: '30px',
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gap: '30px',
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  cardTitle: {
    margin: '0 0 20px 0',
    color: '#2c3e50',
    fontSize: '20px',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    color: '#6c757d',
    fontSize: '14px',
  },
  value: {
    fontSize: '16px',
    color: '#2c3e50',
  },
  skillsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  skillBadge: {
    padding: '8px 16px',
    background: '#e3f2fd',
    color: '#1976d2',
    borderRadius: '20px',
    fontSize: '14px',
  },
  projectsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px',
  },
  projectCard: {
    padding: '16px',
    background: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
  },
  experienceList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  experienceCard: {
    padding: '16px',
    background: '#f8f9fa',
    borderRadius: '8px',
    borderLeft: '4px solid #007bff',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '6px 12px',
    background: '#28a745',
    color: 'white',
    borderRadius: '20px',
    fontSize: '14px',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '18px',
    color: '#6c757d',
  },
};

export default CandidateDetails;