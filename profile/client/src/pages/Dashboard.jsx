import React from "react";
import Navbar from "../components/Navbar";

const Dashboard = () => {
  return (
    <div className="min-h-screen text-white">
      <Navbar />

      <div className="p-8">
        <h2 className="text-3xl font-bold">Welcome to Dashboard</h2>
      </div>
    </div>
  );
};

export default Dashboard;