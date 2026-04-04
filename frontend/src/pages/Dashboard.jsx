import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeMenu, setActiveMenu] = useState('overview');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getUserInitial = () => {
    return user?.fullName?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <span style={{ fontSize: '24px' }}>📚</span>
          <h1>SkillBridge</h1>
        </div>
        <ul className="sidebar-menu">
          <li>
            <a 
              href="#overview" 
              className={activeMenu === 'overview' ? 'active' : ''}
              onClick={() => setActiveMenu('overview')}
            >
              📊 Overview
            </a>
          </li>
          <li>
            <a 
              href="#courses" 
              className={activeMenu === 'courses' ? 'active' : ''}
              onClick={() => setActiveMenu('courses')}
            >
              📖 My Courses
            </a>
          </li>
          <li>
            <a 
              href="#progress" 
              className={activeMenu === 'progress' ? 'active' : ''}
              onClick={() => setActiveMenu('progress')}
            >
              📈 Progress
            </a>
          </li>
          <li>
            <a 
              href="#certificates" 
              className={activeMenu === 'certificates' ? 'active' : ''}
              onClick={() => setActiveMenu('certificates')}
            >
              🎓 Certificates
            </a>
          </li>
          <li>
            <a 
              href="#settings" 
              className={activeMenu === 'settings' ? 'active' : ''}
              onClick={() => setActiveMenu('settings')}
            >
              ⚙️ Settings
            </a>
          </li>
        </ul>
      </div>

      <div className="main-content">
        <div className="top-bar">
          <h2>Welcome, {user?.fullName}!</h2>
          <div className="user-menu">
            <div className="user-avatar">{getUserInitial()}</div>
            <button className="logout-button" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {activeMenu === 'overview' && (
          <>
            <div className="dashboard-grid">
              <div className="card">
                <div className="card-title">📚 Courses Enrolled</div>
                <div className="card-value">8</div>
                <div className="card-description">Active courses in progress</div>
              </div>
              <div className="card">
                <div className="card-title">⏱️ Learning Hours</div>
                <div className="card-value">156</div>
                <div className="card-description">Total hours completed</div>
              </div>
              <div className="card">
                <div className="card-title">🎯 Completion Rate</div>
                <div className="card-value">72%</div>
                <div className="card-description">Average across all courses</div>
              </div>
              <div className="card">
                <div className="card-title">🏆 Certificates</div>
                <div className="card-value">5</div>
                <div className="card-description">Earned certifications</div>
              </div>
            </div>

            <div className="recent-activity">
              <h3>Recent Activity</h3>
              <div className="activity-item">
                <div className="activity-icon">✅</div>
                <div className="activity-content">
                  <h4>Completed Module: React Basics</h4>
                  <p>2 hours ago</p>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">📝</div>
                <div className="activity-content">
                  <h4>Quiz Submitted: JavaScript Fundamentals</h4>
                  <p>4 hours ago</p>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">🎓</div>
                <div className="activity-content">
                  <h4>Certificate Earned: Web Development Basics</h4>
                  <p>1 day ago</p>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">💬</div>
                <div className="activity-content">
                  <h4>Instructor replied to your question</h4>
                  <p>2 days ago</p>
                </div>
              </div>
            </div>
          </>
        )}

        {activeMenu === 'courses' && (
          <div className="card">
            <h3>My Courses</h3>
            <p style={{ marginTop: '20px', color: '#666' }}>Course management coming soon...</p>
          </div>
        )}

        {activeMenu === 'progress' && (
          <div className="card">
            <h3>Progress Tracking</h3>
            <p style={{ marginTop: '20px', color: '#666' }}>Progress analytics coming soon...</p>
          </div>
        )}

        {activeMenu === 'certificates' && (
          <div className="card">
            <h3>Certificates</h3>
            <p style={{ marginTop: '20px', color: '#666' }}>Your certificates will appear here...</p>
          </div>
        )}

        {activeMenu === 'settings' && (
          <div className="card">
            <h3>Settings</h3>
            <p style={{ marginTop: '20px', color: '#666' }}>Settings coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
