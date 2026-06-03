import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, ArrowLeft, Loader2, Calendar, Edit2, Save, X } from "lucide-react";
import API from "../utils/api";
import { safeApiCall } from "../utils/asyncHandler";
import "./Profile.css";

const Profile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ age: "", role: "" });
  const [roleOpen, setRoleOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const [res, err] = await safeApiCall(API.get("/auth/me"));
      if (err) {
        console.error("Profile fetch error:", err);
        setError("Failed to fetch user profile. Please try logging in again.");
      } else if (res) {
        setUserData(res.data);
        setEditForm({
          age: res.data.age || "",
          role: res.data.role || "user"
        });
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleEditToggle = () => {
    if (!isEditing && userData) {
      setEditForm({
        age: userData.age || "",
        role: userData.role || "user"
      });
    }
    setIsEditing(!isEditing);
    setSuccessMsg("");
    setError("");
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccessMsg("");

    const parsedAge = editForm.age ? parseInt(editForm.age, 10) : null;
    if (parsedAge !== null && (isNaN(parsedAge) || parsedAge < 15 || parsedAge > 80)) {
      setError("Please enter a valid age between 15 and 80.");
      setSaving(false);
      return;
    }

    if (!editForm.role || (editForm.role !== "student" && editForm.role !== "professional")) {
      setError("Please select a valid role.");
      setSaving(false);
      return;
    }

    const payload = {
      age: parsedAge,
      role: editForm.role
    };
    const [res, err] = await safeApiCall(API.put("/auth/me", payload));
    if (err) {
      console.error("Profile update error:", err);
      setError("Failed to update profile.");
    } else if (res) {
      setUserData(res.data);
      setIsEditing(false);
      setSuccessMsg("Profile updated successfully!");
    }
    setSaving(false);
  };

  return (
    <div className="profile-container page-enter">
      <div className="profile-header-section flex justify-between items-start">
        <div>
          <button type="button" className="back-btn clickable" onClick={() => navigate("/dashboard")}>
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </button>
          <div className="profile-title-section mt-4">
            <h1>My Profile</h1>
            <p>View and manage your account information</p>
          </div>
        </div>
        {userData && (
          <button
            type="button"
            className="action-btn mt-6"
            onClick={handleEditToggle}
          >
            {isEditing ? (
              <>
                <X size={16} className="text-red-400" />
                <span className="ml-2">Cancel</span>
              </>
            ) : (
              <>
                <Edit2 size={16} className="text-accent-cyan" />
                <span className="ml-2">Edit Profile</span>
              </>
            )}
          </button>
        )}
      </div>

      {error && <div className="dashboard-alert error-bg">{error}</div>}
      {successMsg && <div className="dashboard-alert success-bg">{successMsg}</div>}

      <div className="profile-card glass-panel mt-6">
        {loading ? (
          <div className="loading-state">
            <Loader2 className="animate-spin loading-icon" size={32} />
            <span>Loading Profile…</span>
          </div>
        ) : userData ? (
          <div className="profile-details-grid">
            <div className="profile-avatar-section">
               <div className="size-24 rounded-full bg-border-glow border border-border-focus flex items-center justify-center text-accent-cyan shadow-[0_0_20px_var(--color-border-glow)] mb-4">
                 <User size={48} />
               </div>
               <h2>{userData.username}</h2>
               <span className="role-badge">
                 {userData.role ? userData.role.replace('_', ' ').toUpperCase() : "USER"}
               </span>
            </div>
            
            <div className="profile-info-section">
              <h3>Account Details</h3>
              
              <div className="info-row">
                <div className="info-icon">
                  <User size={18} />
                </div>
                <div className="info-content w-full">
                  <span className="info-label">Username</span>
                  <span className="info-value text-white/50 cursor-not-allowed">{userData.username}</span>
                </div>
              </div>

              <div className="info-row">
                <div className="info-icon">
                  <Mail size={18} />
                </div>
                <div className="info-content w-full">
                  <span className="info-label">Email Address</span>
                  <span className="info-value text-white/50 cursor-not-allowed">{userData.email}</span>
                </div>
              </div>

              <div className={`info-row ${isEditing ? 'border-accent-cyan bg-accent-cyan/5' : ''}`}>
                <div className="info-icon">
                  <User size={18} />
                </div>
                <div className="info-content w-full">
                  <span className="info-label">Role</span>
                  {isEditing ? (
                    <div 
                      className="relative cursor-pointer bg-bg-inset border border-white/10 rounded mt-1 w-full max-w-[250px]"
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
                      <div className="px-3 py-1.5 text-white text-sm flex items-center h-[34px]">
                        <span className={editForm.role ? "text-white" : "text-white/50"}>
                          {editForm.role ? editForm.role.charAt(0).toUpperCase() + editForm.role.slice(1) : "Select a role"}
                        </span>
                      </div>
                      
                      {roleOpen && (
                        <div className="absolute top-full left-0 w-full mt-1 bg-bg-card-solid border border-white/10 rounded-md shadow-[0_4px_20px_rgba(0,0,0,0.5)] z-50 overflow-hidden flex flex-col" role="menu">
                          <div 
                            className="px-4 py-2 hover:bg-accent-cyan/15 cursor-pointer text-sm text-white transition-colors"
                            onClick={() => { setEditForm({...editForm, role: "student"}); setRoleOpen(false); }}
                            role="menuitem"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setEditForm({...editForm, role: "student"});
                                setRoleOpen(false);
                              }
                            }}
                          >
                            Student
                          </div>
                          <div 
                            className="px-4 py-2 hover:bg-accent-cyan/15 cursor-pointer text-sm text-white transition-colors"
                            onClick={() => { setEditForm({...editForm, role: "professional"}); setRoleOpen(false); }}
                            role="menuitem"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setEditForm({...editForm, role: "professional"});
                                setRoleOpen(false);
                              }
                            }}
                          >
                            Professional
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="info-value">{userData.role ? userData.role.replace('_', ' ') : 'User'}</span>
                  )}
                </div>
              </div>

              <div className={`info-row ${isEditing ? 'border-accent-cyan bg-accent-cyan/5' : ''}`}>
                <div className="info-icon">
                  <Calendar size={18} />
                </div>
                <div className="info-content w-full">
                  <span className="info-label">Age</span>
                  {isEditing ? (
                    <input
                      type="number"
                      className="bg-bg-inset border border-white/10 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-accent-cyan w-full max-w-[150px] mt-1"
                      value={editForm.age}
                      onChange={(e) => setEditForm({...editForm, age: e.target.value})}
                      placeholder="e.g. 25"
                      aria-label="Age"
                    />
                  ) : (
                    (userData.age !== null && userData.age !== undefined) ? (
                      <span className="info-value">{userData.age} years</span>
                    ) : (
                      <span className="info-value text-white/40 italic">Not specified</span>
                    )
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="upload-btn"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <User size={48} className="empty-icon" />
            <h3>No Profile Data Found</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
