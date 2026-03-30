import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const DashboardLayout = () => {
  return (
    <div className="min-h-screen flex flex-col text-white">

      {/* Top Navbar */}
      <Navbar />

      {/* Body */}
      <div className="flex flex-1">

        {/* Sidebar */}
        <Sidebar />

        {/* Content Area */}
        <div className="flex-1 p-8 bg-white/5 backdrop-blur-md">
          <Outlet />
        </div>

      </div>

    </div>
  );
};

export default DashboardLayout;