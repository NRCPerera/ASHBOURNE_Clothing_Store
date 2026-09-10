import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = 'Passwords do not match';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;
    setLoading(true);

    try {
      await register(
        form.name.trim(),
        form.email.trim(),
        form.password,
        form.phone.trim()
      );
      navigate('/');
    } catch (err) {
      if (err.response?.data?.errors) {
        const errs = {};
        err.response.data.errors.forEach((e) => {
          errs[e.field] = e.message;
        });
        setFieldErrors(errs);
        setError('Please correct the highlighted errors.');
      } else {
        setError(err.response?.data?.message || 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in-up">
        <h1>Create Account</h1>
        <p>Join ASHBOURNE for an elevated shopping experience</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="reg-name">Full Name</label>
            <input
              id="reg-name"
              name="name"
              type="text"
              placeholder="Your full name"
              value={form.name}
              onChange={handleChange}
              required
            />
            {fieldErrors.name && (
              <div className="form-error">{fieldErrors.name}</div>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
            {fieldErrors.email && (
              <div className="form-error">{fieldErrors.email}</div>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="reg-phone">Phone (optional)</label>
            <input
              id="reg-phone"
              name="phone"
              type="tel"
              placeholder="+94 7X XXX XXXX"
              value={form.phone}
              onChange={handleChange}
            />
            {fieldErrors.phone && (
              <div className="form-error">{fieldErrors.phone}</div>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              name="password"
              type="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={handleChange}
              required
            />
            {fieldErrors.password && (
              <div className="form-error">{fieldErrors.password}</div>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="reg-confirm">Confirm Password</label>
            <input
              id="reg-confirm"
              name="confirmPassword"
              type="password"
              placeholder="Repeat your password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
            {fieldErrors.confirmPassword && (
              <div className="form-error">{fieldErrors.confirmPassword}</div>
            )}
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
