import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOTP from "./pages/VerifyOTP";
import ForgotPassword from "./pages/ForgotPassword";
import DashboardLayout from "./components/DashboardLayout";
import PrivateRoute from "./components/PrivateRoute";

// Dashboard Pages
import Feed from "./pages/Feed";
import MyTasks from "./pages/MyTasks";
import Requests from "./pages/Requests";
import MyRequests from "./pages/MyRequests";
import AddTask from "./pages/AddTask";
import Settings from "./pages/Settings";

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/" element={<Login />} />
<Route path="/forgot-password" element={<ForgotPassword />} />
        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Feed />} />
          <Route path="mytasks" element={<MyTasks />} />
          <Route path="requests" element={<Requests />} />
          <Route path="myrequests" element={<MyRequests />} />
          <Route path="addtask" element={<AddTask />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;