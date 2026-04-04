import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { authAPI } from '../utils/api';
import '../styles/Auth.css';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      const { token, user } = response.data;
      login(user, token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <h1>Welcome Back!</h1>
        <p>Continue your learning journey</p>
        <div className="auth-features">
          <div className="feature">
            <div className="feature-icon">📚</div>
            <p>1000+ Courses</p>
          </div>
          <div className="feature">
            <div className="feature-icon">👨‍🏫</div>
            <p>Expert Instructors</p>
          </div>
          <div className="feature">
            <div className="feature-icon">📈</div>
            <p>Track Progress</p>
          </div>
          <div className="feature">
            <div className="feature-icon">🎓</div>
            <p>Get Certified</p>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form">
          <div className="form-header">
            <h2>Login to SkillBridge</h2>
            <p>Enter your credentials to continue</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="form-checkbox">
              <input type="checkbox" id="remember" />
              <label htmlFor="remember">Remember Me</label>
            </div>

            <button type="submit" className="form-button" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="form-divider">OR</div>

          <button className="oauth-button">
            <span>🔵</span> Continue with Google
          </button>

          <div className="auth-link" style={{ marginTop: '20px' }}>
            Don't have an account? <Link to="/register">Register here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
