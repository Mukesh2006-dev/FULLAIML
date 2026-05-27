import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Sparkles,
  SearchCode,
  LineChart,
  BrainCircuit,
  LogOut,
  Database,
  User,
  Settings,
  Moon
} from "lucide-react";
import "./Navbar.css";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/preprocessing", label: "Preprocessing" },
  { path: "/eda", label: "Automated EDA" },
  { path: "/visualizations", label: "Visualizations" },
  { path: "/ml-model", label: "Model Training" },
];

const Navbar = () => {
  const navigate = useNavigate();
  const currentLocation = useLocation();
  const token = localStorage.getItem("token");

  // Scroll state
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    // Trigger once on mount to set initial state
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Sliding pill refs & state
  const linksContainerRef = useRef(null);
  const linkRefs = useRef([]);
  const [pillStyle, setPillStyle] = useState({ width: 0, x: 0, opacity: 0 });

  // Profile dropdown state
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Calculate pill position based on active link
  const updatePill = useCallback(() => {
    const activeIndex = NAV_ITEMS.findIndex((item) => item.path === currentLocation.pathname);
    if (activeIndex === -1 || !linkRefs.current[activeIndex] || !linksContainerRef.current) {
      setPillStyle((prev) => ({ ...prev, opacity: 0 }));
      return;
    }

    const linkEl = linkRefs.current[activeIndex];
    const containerEl = linksContainerRef.current;
    const linkRect = linkEl.getBoundingClientRect();
    const containerRect = containerEl.getBoundingClientRect();

    setPillStyle({
      width: linkRect.width,
      x: linkRect.left - containerRect.left,
      opacity: 1,
    });
  }, [currentLocation.pathname]);

  // Recalculate on route change
  useEffect(() => {
    const raf = requestAnimationFrame(updatePill);
    return () => cancelAnimationFrame(raf);
  }, [updatePill]);

  // Recalculate on resize
  useEffect(() => {
    window.addEventListener("resize", updatePill);
    return () => window.removeEventListener("resize", updatePill);
  }, [updatePill]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setProfileOpen(false);
  }, [currentLocation.pathname]);

  if (!token) return null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className={`navbar-container ${isScrolled ? "scrolled" : "at-top"}`}>
      <div className="navbar-left">
        <button type="button" className="navbar-brand clickable" onClick={() => navigate("/dashboard")}>
          <Database className="brand-icon" size={20} />
          <span className="brand-text">FullAIML</span>
        </button>
      </div>

      <ul className="navbar-links" ref={linksContainerRef}>
        {/* The sliding pill indicator */}
        <div
          className="navbar-pill"
          style={{
            width: `${pillStyle.width}px`,
            transform: `translateX(${pillStyle.x}px)`,
            opacity: pillStyle.opacity,
          }}
        />

        {NAV_ITEMS.map((item, index) => {
          const isActive = currentLocation.pathname === item.path;
          return (
            <li key={item.path}>
              <Link
                to={item.path}
                ref={(el) => (linkRefs.current[index] = el)}
                className={`navbar-link ${isActive ? "active" : ""}`}
              >
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="navbar-right">
        {/* ── Additional Action Icons ── */}
      <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginRight: '0.5rem', marginLeft: '0.2rem' }}>
        <button type="button" className="icon-btn clickable" style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
          <Moon size={18} />
        </button>
      </div>

      {/* ── Profile Avatar with Dropdown ── */}
      <div className="profile-wrapper" ref={profileRef}>
        <button type="button"
          className={`profile-avatar-btn clickable ${profileOpen ? "open" : ""}`}
          onClick={() => setProfileOpen((prev) => !prev)}
          title="Profile"
          aria-expanded={profileOpen}
          aria-haspopup="true"
        >
          <User size={16} />
        </button>

        {/* Dropdown Menu */}
        <div className={`profile-dropdown ${profileOpen ? "visible" : ""}`}>
          {/* User Info Header */}
          <div className="profile-dropdown-header">
            <div className="profile-dropdown-avatar">
              <User size={18} />
            </div>
            <div className="profile-dropdown-info">
              <span className="profile-dropdown-name">User</span>
              <span className="profile-dropdown-role">ML Engineer</span>
            </div>
          </div>

          <div className="profile-dropdown-divider" />

          {/* Menu Items */}
          <button type="button" className="profile-dropdown-item clickable">
            <Settings size={14} />
            <span>Settings</span>
          </button>

          <div className="profile-dropdown-divider" />

          {/* Logout */}
          <button type="button" className="profile-dropdown-item danger clickable" onClick={handleLogout}>
            <LogOut size={14} />
            <span>Log Out</span>
          </button>
        </div>
      </div>
      </div>
    </nav>
  );
};

export default Navbar;
