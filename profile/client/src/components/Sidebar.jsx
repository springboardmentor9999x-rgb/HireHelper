import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Rss,
  ClipboardList,
  Inbox,
  Send,
  PlusCircle,
  Settings,
  Briefcase,
  User,
} from "lucide-react";
import api from "../utils/api";

const links = [
  { to: "/dashboard", label: "Feed", icon: Rss, end: true },
  { to: "/dashboard/mytasks", label: "My Tasks", icon: ClipboardList },
  { to: "/dashboard/requests", label: "Requests", icon: Inbox, badge: true },
  { to: "/dashboard/myrequests", label: "My Requests", icon: Send },
  { to: "/dashboard/addtask", label: "Add Task", icon: PlusCircle },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

const Sidebar = () => {
  const user =
    JSON.parse(localStorage.getItem("user")) ||
    JSON.parse(sessionStorage.getItem("user"));

  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingCount = async () => {
    try {
      const res = await api.get("/requests/incoming");
      const pending = res.data.filter((r) => r.status === "pending").length;
      setPendingCount(pending);
    } catch {
      // silently fail
    }
  };

  const linkStyle = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      isActive
        ? "bg-indigo-500/20 text-white font-semibold border border-indigo-400/20"
        : "text-white/60 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <div className="w-64 flex flex-col border-r border-white/10 bg-white/5 backdrop-blur-xl">
      {/* Logo */}
      <div className="px-6 pt-6 pb-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center">
          <Briefcase size={18} className="text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight text-white">
          Hire-a-Helper
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {links.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink key={to} to={to} end={end} className={linkStyle}>
            <Icon size={18} />
            <span className="text-sm flex-1">{label}</span>
            {badge && pendingCount > 0 && (
              <span className="min-w-[22px] h-[22px] bg-indigo-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1">
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Profile at Bottom */}
      {user && (
        <div className="px-4 py-5 border-t border-white/10">
          <div className="flex items-center gap-3">
            {user.profile_picture ? (
              <img
                src={`http://localhost:5000/${user.profile_picture}`}
                alt="avatar"
                className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-500/30 flex items-center justify-center border-2 border-white/20">
                <User size={18} className="text-indigo-300" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-xs text-white/40 truncate">{user.email_id}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;