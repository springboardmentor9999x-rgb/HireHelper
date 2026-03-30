import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const navigate = useNavigate();

  // Auto-redirect if already logged in
  useEffect(() => {
    const user =
      JSON.parse(localStorage.getItem("user")) ||
      JSON.parse(sessionStorage.getItem("user"));
    if (user) {
      toast.success(`Welcome back, ${user.first_name}!`);
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email_id: email,
        password,
      });

      // Store user AND token in localStorage or sessionStorage
      if (remember) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
        localStorage.setItem("token", res.data.token);
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("token");
      } else {
        sessionStorage.setItem("user", JSON.stringify(res.data.user));
        sessionStorage.setItem("token", res.data.token);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }

      toast.success(`Login successful! Welcome ${res.data.user.first_name}`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Toaster position="top-right" reverseOrder={false} />
      <div className="glass-card text-white">
        <div className="text-center">
          <h2 className="text-4xl font-black tracking-tight">SIGN IN</h2>
          <p className="text-white/50 mt-2 text-xs tracking-[0.2em] uppercase">
            Welcome Back
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-8 mt-10">
          <div className="relative group">
            <input
              type="email"
              placeholder="Email Address"
              required
              className="glass-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Mail className="absolute right-0 top-4 text-white/30" size={18} />
          </div>

          <div className="relative group">
            <input
              type="password"
              placeholder="Password"
              required
              className="glass-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Lock className="absolute right-0 top-4 text-white/30" size={18} />
          </div>

          <div className="flex justify-between items-center text-sm text-white/70">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={() => setRemember(!remember)}
              />
              Remember me
            </label>

            <Link
              to="/forgot-password"
              className="hover:underline text-indigo-200"
            >
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full bg-white text-indigo-900 font-black py-4 rounded-xl hover:bg-blue-50 transition-all active:scale-95 shadow-2xl"
          >
            SIGN IN
          </button>
        </form>

        <p className="text-center mt-8 text-white/50 text-sm font-medium">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-white font-bold hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
