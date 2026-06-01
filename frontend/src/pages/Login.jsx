import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Database, Lock, Mail, ArrowRight } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import API from "../utils/api";
import Silk from "../components/Silk";
import "./Login.css";

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.44 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await API.post("/auth/login", {
        email,
        password,
      });
      localStorage.setItem("token", response.data.access_token);
      setSuccess("Sign in successful! Redirecting...");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((d) => d.msg).join(". "));
      } else {
        setError(detail || "Invalid credentials. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setError("");
      setSuccess("");
      try {
        const res = await API.post("/auth/google-login", {
          token: tokenResponse.access_token,
        });
        localStorage.setItem("token", res.data.access_token);
        setSuccess("Google sign-in successful! Redirecting...");
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } catch (err) {
        setError(
          err.response?.data?.detail || "Google sign-in failed. Please try again."
        );
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      setError("Google sign-in was cancelled or failed.");
    },
  });

  return (
    <div className="login-container page-enter">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
        <Silk speed={3} scale={1} color="#00f0ff" noiseIntensity={1.2} rotation={0} />
      </div>
      
      <div className="login-card glass-panel">
        <div className="login-header">
          <div className="login-logo">
            <Database size={32} />
          </div>
          <h1>Welcome Back</h1>
          <p>Sign in to manage datasets &amp; run machine learning models</p>
        </div>

        {error && <div className="error-alert">{error}</div>}
        {success && <div className="success-alert">{success}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-label="Email Address"
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-label="Password"
              />
            </div>
          </div>

          <button type="submit" className="submit-btn clickable" disabled={loading}>
            {loading ? "Signing In…" : "Sign In"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="login-divider">
          <span className="login-divider-line" />
          <span className="login-divider-text">or</span>
          <span className="login-divider-line" />
        </div>

        <button
          type="button"
          className="google-btn clickable"
          onClick={() => googleLogin()}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <div className="google-btn-spinner" />
          ) : (
            <GoogleIcon />
          )}
          {googleLoading ? "Connecting…" : "Continue with Google"}
        </button>

        <div className="login-footer">
          <p>
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
