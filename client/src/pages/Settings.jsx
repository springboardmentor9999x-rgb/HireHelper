import { useEffect, useState } from "react";
import api from "../utils/api";
import { toast } from "react-hot-toast";
import PasswordInput from "../components/PasswordInput";
import {
  User,
  Mail,
  Phone,
  Camera,
  Save,
  Lock,
  Settings as SettingsIcon,
} from "lucide-react";

const Settings = () => {
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    email_id: "",
    mobile_number: "",
  });
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/user/profile");
      setProfile(res.data);
      if (res.data.profile_picture) {
        setProfilePicPreview(
          `http://localhost:5000/${res.data.profile_picture}`
        );
      }
    } catch (err) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handlePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
      setProfilePicPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = new FormData();
      data.append("first_name", profile.first_name);
      data.append("last_name", profile.last_name);
      data.append("mobile_number", profile.mobile_number);
      if (profilePic) {
        data.append("profile_picture", profilePic);
      }

      const res = await api.put("/user/profile", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Update stored user info with all changed fields
      const stored =
        JSON.parse(localStorage.getItem("user")) ||
        JSON.parse(sessionStorage.getItem("user"));
      if (stored) {
        const updatedUser = res.data.user;
        const updated = {
          ...stored,
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
          email_id: updatedUser.email_id,
          mobile_number: updatedUser.mobile_number,
          profile_picture: updatedUser.profile_picture || stored.profile_picture,
        };
        if (localStorage.getItem("user")) {
          localStorage.setItem("user", JSON.stringify(updated));
        } else {
          sessionStorage.setItem("user", JSON.stringify(updated));
        }
      }

      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Please fill in both password fields");
      return;
    }
    setChangingPassword(true);

    try {
      await api.put("/user/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success("Password changed!");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
          <SettingsIcon size={28} className="text-indigo-400" />
          Settings
        </h1>
        <p className="text-white/50 text-sm mt-1">
          Manage your profile and account
        </p>
      </div>

      {/* Profile Section */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-[rgba(15,23,42,0.45)] backdrop-blur-xl border border-[rgba(255,255,255,0.18)] rounded-2xl p-6 space-y-5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
      >
        <h2 className="text-xl font-bold flex items-center gap-2">
          <User size={20} /> Profile Information
        </h2>

        {/* Profile Picture */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 overflow-hidden flex items-center justify-center">
              {profilePicPreview ? (
                <img
                  src={profilePicPreview}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={32} className="text-white/30" />
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-indigo-600 transition-all">
              <Camera size={14} />
              <input
                type="file"
                accept="image/*"
                onChange={handlePicChange}
                className="hidden"
              />
            </label>
          </div>
          <div>
            <p className="font-semibold">
              {profile.first_name} {profile.last_name}
            </p>
            <p className="text-sm text-white/40">{profile.email_id}</p>
          </div>
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-white/70">
              First Name
            </label>
            <input
              name="first_name"
              value={profile.first_name}
              onChange={handleProfileChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-indigo-400/50 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-white/70">
              Last Name
            </label>
            <input
              name="last_name"
              value={profile.last_name}
              onChange={handleProfileChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-indigo-400/50 transition-all"
            />
          </div>
        </div>

        {/* Email (read-only) */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-white/70 flex items-center gap-2">
            <Mail size={14} /> Email
          </label>
          <input
            value={profile.email_id}
            disabled
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white/40 outline-none cursor-not-allowed"
          />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-white/70 flex items-center gap-2">
            <Phone size={14} /> Mobile Number
          </label>
          <input
            name="mobile_number"
            value={profile.mobile_number}
            onChange={handleProfileChange}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-indigo-400/50 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>

      {/* Change Password Section */}
      <form
        onSubmit={handleChangePassword}
        className="bg-[rgba(15,23,42,0.45)] backdrop-blur-xl border border-[rgba(255,255,255,0.18)] rounded-2xl p-6 space-y-5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
      >
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Lock size={20} /> Change Password
        </h2>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-white/70">
            Current Password
          </label>
          <PasswordInput
            value={currentPassword}
            onChange={setCurrentPassword}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-white/70">
            New Password
          </label>
          <PasswordInput value={newPassword} onChange={setNewPassword} />
        </div>

        <button
          type="submit"
          disabled={changingPassword}
          className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 border border-white/10"
        >
          <Lock size={16} />
          {changingPassword ? "Changing..." : "Change Password"}
        </button>
      </form>
    </div>
  );
};

export default Settings;