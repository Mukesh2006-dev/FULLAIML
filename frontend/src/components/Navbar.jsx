import { useState, useRef, useEffect, useCallback } from "react";
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
  Scale
} from "lucide-react";
import API from "../utils/api";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/preprocessing", label: "Preprocessing" },
  { path: "/eda", label: "Automated EDA" },
  { path: "/visualizations", label: "Visualizations" },
  { path: "/ml-model", label: "Model Training" },
  { path: "/ml-comparison", label: "Compare Models" },
];

const Navbar = () => {
  const navigate = useNavigate();
  const currentLocation = useLocation();
  const token = localStorage.getItem("token");

  const [isScrolled, setIsScrolled] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await API.get("/auth/me");
        setUserData(res.data);
      } catch (err) {
        console.error("Failed to fetch user data:", err);
      }
    };
    if (token) {
      fetchUser();
    }
  }, [token]);

  useEffect(() => {
    const scrollContainer = document.getElementById("main-scroll-container");
    const target = scrollContainer || window;
    
    const handleScroll = () => {
      setIsScrolled((scrollContainer ? scrollContainer.scrollTop : window.scrollY) > 20);
    };
    
    target.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => target.removeEventListener("scroll", handleScroll);
  }, []);

  const linksContainerRef = useRef(null);
  const linkRefs = useRef([]);
  const [pillStyle, setPillStyle] = useState({ width: 0, x: 0, opacity: 0 });

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

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

  useEffect(() => {
    const raf = requestAnimationFrame(updatePill);
    return () => cancelAnimationFrame(raf);
  }, [updatePill]);

  useEffect(() => {
    window.addEventListener("resize", updatePill);
    return () => window.removeEventListener("resize", updatePill);
  }, [updatePill]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfileOpen(false);
  }, [currentLocation.pathname]);

  if (!token) return null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav
      className={`relative mx-auto z-50 flex items-center justify-between backdrop-blur-2xl backdrop-saturate-[1.6] transition-all duration-700 ease-out w-full ${
        isScrolled
          ? "mt-5 max-w-[1000px] px-2.5 py-1.5 gap-3 rounded-full bg-transparent border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.5),0_0_0_1px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_0_1px_rgba(0,0,0,0.9),0_0_20px_rgba(255,255,255,0.03),inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-white/5"
          : "mt-0 max-w-full px-8 py-3 rounded-none bg-transparent border border-transparent border-b-white/5 shadow-none"
      } max-sm:px-1.5 max-sm:gap-1 max-sm:rounded-full max-sm:border-white/10 max-sm:bg-bg-root/80 max-sm:w-[95%]`}
    >
      <div className="flex items-center max-sm:hidden">
        <button
          type="button"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-all duration-300 relative bg-transparent hover:bg-white/5 active:scale-95"
          onClick={() => navigate("/dashboard")}
        >
          <Database className="text-text-primary shrink-0" size={20} />
          <span className="font-sans text-[1.05rem] font-bold text-text-primary tracking-tight whitespace-nowrap">
            FullAIML
          </span>
        </button>
      </div>

      <ul className="flex list-none gap-1 items-center relative p-0 m-0 w-full sm:w-auto justify-center" ref={linksContainerRef}>
        {/* Sliding Pill */}
        <div
          className="absolute top-0 left-0 h-full rounded-full bg-white/5 pointer-events-none z-0 transition-all duration-500 ease-out will-change-[transform,width]"
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
                className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-full font-sans text-sm font-medium transition-colors duration-300 whitespace-nowrap no-underline border-none bg-transparent z-10 ${
                  isActive ? "text-text-primary" : "text-white/60 hover:text-text-primary"
                } max-lg:px-2.5 max-sm:px-2 max-sm:text-xs`}
              >
                <span className="max-sm:hidden max-lg:hidden">{item.label}</span>
                {/* Fallback icons for mobile since text is hidden */}
                <span className="lg:hidden">
                  {index === 0 && <LayoutDashboard size={18} />}
                  {index === 1 && <Sparkles size={18} />}
                  {index === 2 && <SearchCode size={18} />}
                  {index === 3 && <LineChart size={18} />}
                  {index === 4 && <BrainCircuit size={18} />}
                  {index === 5 && <Scale size={18} />}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center">

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            className={`size-[34px] rounded-full border-[1.5px] border-white/15 bg-white/5 flex items-center justify-center cursor-pointer transition-all duration-300 shrink-0 relative active:scale-95 max-sm:size-8 ${
              profileOpen
                ? "border-border-focus bg-border-glow text-accent-cyan shadow-[0_0_18px_var(--color-border-glow)]"
                : "text-white/60 hover:border-border-focus hover:bg-border-glow hover:text-accent-cyan hover:shadow-[0_0_14px_var(--color-border-glow)]"
            }`}
            onClick={() => setProfileOpen((prev) => !prev)}
          >
            <User size={16} />
            {profileOpen && (
              <span className="absolute -inset-[3px] rounded-full border-[1.5px] border-border-focus animate-[profileRingPulse_1.5s_ease-in-out_infinite]" />
            )}
          </button>

          {/* Dropdown */}
          <div
            className={`absolute top-[calc(100%+12px)] right-[-8px] min-w-[220px] p-2 rounded-md bg-bg-card-solid/90 backdrop-blur-2xl backdrop-saturate-[1.6] border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.5),0_0_0_1px_rgba(0,0,0,0.15),0_0_30px_var(--color-border-glow)] z-50 origin-top-right transition-all duration-300 max-sm:right-[-4px] max-sm:min-w-[200px] ${
              profileOpen ? "opacity-100 visible translate-y-0 scale-100" : "opacity-0 invisible -translate-y-2 scale-95"
            }`}
          >
            {/* Arrow */}
            <div className="absolute -top-[6px] right-4 size-3 bg-bg-card-solid border-t border-l border-white/10 rotate-45 -z-10" />

            <div className="flex items-center gap-3 px-3 py-2.5 rounded-sm">
              <div className="size-9 rounded-full bg-border-glow border border-border-focus flex items-center justify-center text-accent-cyan shrink-0 shadow-[0_0_10px_var(--color-border-glow)]">
                <User size={18} />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-display text-[0.85rem] font-bold text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">
                  {userData ? userData.username : "Loading..."}
                </span>
                <span className="font-mono text-[0.65rem] text-text-muted tracking-wide overflow-hidden text-ellipsis">
                  {userData ? userData.email : "Loading..."}
                </span>
              </div>
            </div>

            <div className="h-px bg-white/5 my-1.5 mx-2" />
            
            <button
              type="button"
              onClick={() => {
                setProfileOpen(false);
                navigate("/profile");
              }}
              className="flex items-center gap-2.5 w-full px-3 py-2 border-none rounded-sm bg-transparent text-white/60 font-mono text-[0.75rem] font-medium cursor-pointer transition-colors text-left tracking-wide hover:bg-white/5 hover:text-white active:scale-95"
            >
              <Settings size={14} className="shrink-0 transition-all" />
              <span>Profile</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2.5 w-full px-3 py-2 border-none rounded-sm bg-transparent text-white/60 font-mono text-[0.75rem] font-medium cursor-pointer transition-colors text-left tracking-wide hover:bg-red-500/10 hover:text-red-400 hover:[&>svg]:text-red-400 hover:[&>svg]:drop-shadow-[0_0_6px_rgba(239,68,68,0.3)] active:scale-95"
            >
              <LogOut size={14} className="shrink-0 transition-all" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
