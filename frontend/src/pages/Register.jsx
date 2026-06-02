import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Database, Lock, Mail, User, ArrowRight, Check, X } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import API from "../utils/api";
import Silk from "../components/Silk";
import "./Register.css";

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.44 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const PASSWORD_RULES = [
  { key: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { key: "upper", label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { key: "lower", label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { key: "digit", label: "One digit", test: (v) => /\d/.test(v) },
  { key: "special", label: "One special character", test: (v) => /[!@#$%^&*(),.?":{}|<>]/.test(v) },
];

const getStrength = (passed) => {
  if (passed <= 1) return { level: "weak", label: "Weak", color: "var(--accent-red)" };
  if (passed <= 2) return { level: "weak", label: "Weak", color: "var(--accent-red)" };
  if (passed <= 3) return { level: "fair", label: "Fair", color: "var(--accent-amber)" };
  if (passed <= 4) return { level: "good", label: "Good", color: "var(--accent-cyan)" };
  return { level: "strong", label: "Strong", color: "var(--accent-green)" };
};

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [role, setRole] = useState("");
  const [roleOpen, setRoleOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const ruleResults = useMemo(
    () => PASSWORD_RULES.map((rule) => ({ ...rule, passed: rule.test(password) })),
    [password]
  );

  const passedCount = ruleResults.filter((r) => r.passed).length;
  const strength = getStrength(passedCount);
  const allPassed = passedCount === PASSWORD_RULES.length;

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
        
        const destination = res.data.is_profile_incomplete ? "/profile" : "/dashboard";
        setSuccess(res.data.is_new_user
          ? "Account created! Redirecting to complete your profile..."
          : "Google sign-in successful! Redirecting..."
        );
        setTimeout(() => {
          navigate(destination);
        }, 1500);
      } catch (err) {
        setError(
          err.response?.data?.detail || "Google sign-up failed. Please try again."
        );
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      setGoogleLoading(false);
      setError("Google sign-in was cancelled or failed.");
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!age || isNaN(age) || age < 15 || age > 80) {
      setError("Please enter a valid age between 15 and 80");
      return;
    }

    if (!role) {
      setError("Please select a role");
      return;
    }

    if (!allPassed) {
      setError("Password does not meet all requirements");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await API.post("/auth/register", {
        username,
        email,
        age: parseInt(age, 10),
        role: role || "user",
        password,
      });

      setSuccess("Registration successful! Redirecting to login…");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        // Parse Pydantic validation errors
        const messages = detail.map((d) => {
          const field = d.loc?.[d.loc.length - 1] || "";
          const msg = d.msg?.replace(/^Value error, /, "") || d.msg;
          return field ? `${field}: ${msg}` : msg;
        });
        setError(messages.join(" • "));
      } else {
        setError(detail || "Registration failed. Try a different username/email.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="register-silk-bg">
        <Silk speed={3} scale={1} color="#7c3aed" noiseIntensity={1.2} rotation={0} />
      </div>
      <div className="register-container page-enter">
        <div className="register-card glass-panel">
        <div className="register-header">
          <div className="register-logo">
            <Database size={32} />
          </div>
          <h1>Create Account</h1>
          <p>Join the AI platform to analyze data and train models</p>
        </div>

        {error && <div className="error-alert">{error}</div>}
        {success && <div className="success-alert">{success}</div>}

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <div className="input-wrapper">
              <User className="input-icon" size={18} />
              <input
                id="username"
                type="text"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                aria-label="Username"
              />
            </div>
          </div>

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
            <label htmlFor="age">Age</label>
            <div className="input-wrapper">
              <User className="input-icon" size={18} />
              <input
                id="age"
                type="number"
                placeholder="e.g. 25"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
                min="15"
                max="80"
                aria-label="Age"
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="role">Role</label>
            <div 
              className="input-wrapper relative cursor-pointer"
              onClick={() => setRoleOpen(!roleOpen)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setRoleOpen(!roleOpen);
                }
              }}
              aria-expanded={roleOpen}
            >
              <User className="input-icon" size={18} />
              <div 
                className="w-full bg-transparent border-none text-sm focus:outline-none focus:ring-0 px-3 py-2 flex items-center"
                style={{ paddingLeft: '32px' }}
              >
                <span className={role ? "text-white" : "text-white/50"}>
                  {role ? role.charAt(0).toUpperCase() + role.slice(1) : "Select your role"}
                </span>
              </div>
              
              {roleOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-bg-card-solid border border-white/10 rounded-md shadow-[0_4px_20px_rgba(0,0,0,0.5)] z-50 overflow-hidden flex flex-col" role="menu">
                  <div 
                    className="px-4 py-2.5 hover:bg-accent-cyan/15 cursor-pointer text-sm text-white transition-colors"
                    onClick={() => { setRole("student"); setRoleOpen(false); }}
                    role="menuitem"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setRole("student");
                        setRoleOpen(false);
                      }
                    }}
                  >
                    Student
                  </div>
                  <div 
                    className="px-4 py-2.5 hover:bg-accent-cyan/15 cursor-pointer text-sm text-white transition-colors"
                    onClick={() => { setRole("professional"); setRoleOpen(false); }}
                    role="menuitem"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setRole("professional");
                        setRoleOpen(false);
                      }
                    }}
                  >
                    Professional
                  </div>
                </div>
              )}
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
                onFocus={() => setPasswordFocused(true)}
                required
                aria-label="Password"
              />
            </div>

            {/* Password Strength Indicator */}
            {(passwordFocused || password.length > 0) && (
              <div className="password-strength-section">
                <div className="password-strength-bar-track">
                  <div
                    className="password-strength-bar-fill"
                    style={{
                      width: `${(passedCount / PASSWORD_RULES.length) * 100}%`,
                      background: strength.color,
                      boxShadow: `0 0 12px ${strength.color}40`,
                    }}
                  />
                </div>
                <span
                  className="password-strength-label"
                  style={{ color: strength.color }}
                >
                  {password.length > 0 ? strength.label : ""}
                </span>

                <ul className="password-rules">
                  {ruleResults.map((rule) => (
                    <li
                      key={rule.key}
                      className={`password-rule ${rule.passed ? "passed" : ""}`}
                    >
                      {rule.passed ? (
                        <Check size={13} className="rule-icon rule-icon-pass" />
                      ) : (
                        <X size={13} className="rule-icon rule-icon-fail" />
                      )}
                      <span>{rule.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                aria-label="Confirm Password"
              />
            </div>
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <span className="password-mismatch-hint">Passwords do not match</span>
            )}
          </div>

          <button type="submit" className="submit-btn clickable" disabled={loading}>
            {loading ? "Creating Account…" : "Sign Up"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="register-divider">
          <span className="register-divider-line" />
          <span className="register-divider-text">or</span>
          <span className="register-divider-line" />
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
          {googleLoading ? "Connecting…" : "Sign up with Google"}
        </button>

        <div className="register-footer">
          <p>
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
    </>
  );
};

export default Register;
