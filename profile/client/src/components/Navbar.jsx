import React, { useEffect, useState, useRef } from "react";
import { Bell, UserCircle, LogOut, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";
import api from "../utils/api";

const Navbar = () => {
  const user =
    JSON.parse(localStorage.getItem("user")) ||
    JSON.parse(sessionStorage.getItem("user"));
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000); // poll every 15s
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get("/notifications/unread-count");
      setUnreadCount(res.data.count);
    } catch (err) {
      // silently fail
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data);
    } catch (err) {
      // silently fail
    }
  };

  const handleBellClick = () => {
    if (!showDropdown) {
      fetchNotifications();
    }
    setShowDropdown(!showDropdown);
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      // silently fail
    }
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    toast.success("Logged out successfully!");
    navigate("/login");
  };

  return (
    <div className="relative z-50">
      <Toaster position="top-right" reverseOrder={false} />
      <div className="w-full h-16 flex items-center justify-between px-8
                      bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-blue-500/20
                      backdrop-blur-xl border-b border-white/10 shadow-lg">

        {/* Logo */}
        <h1 className="text-2xl font-black text-white tracking-wide">
          Hire-a-Helper
        </h1>

        {/* Right Side */}
        <div className="flex items-center gap-6">

          {/* Notification Bell */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={handleBellClick}
              className="relative cursor-pointer hover:scale-110 transition"
            >
              <Bell className="text-white" size={22} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute right-0 top-10 w-80 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                  <span className="font-bold text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      <Check size={12} /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-white/30 text-sm">
                      No notifications
                    </div>
                  ) : (
                    notifications.slice(0, 20).map((n) => (
                      <div
                        key={n._id}
                        className={`px-4 py-3 border-b border-white/5 text-sm ${
                          n.is_read
                            ? "text-white/40"
                            : "text-white bg-white/5"
                        }`}
                      >
                        <p className="leading-snug">{n.body}</p>
                        <span className="text-xs text-white/20 mt-1 block">
                          {formatTime(n.createdAt)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex items-center gap-2">
            <UserCircle className="text-white" size={28} />
            <span className="text-white text-sm font-semibold">
              {user?.first_name || "User"}
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500/80 hover:bg-red-500 
                       px-3 py-1 rounded-lg text-sm font-semibold transition"
          >
            <LogOut size={16} />
            Logout
          </button>

        </div>
      </div>
    </div>
  );
};

export default Navbar;
