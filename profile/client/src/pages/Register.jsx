import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Mail, User, Phone } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import PasswordInput from "../components/PasswordInput";

const Register = () => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    mobile_number: "",
    email_id: "",
    password: "",
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/auth/register", formData);
      toast.success("Registration successful! OTP sent to your email");
      navigate("/verify-otp", { state: { email: formData.email_id } });
    } catch (err) {
      toast.error(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <Toaster position="top-right" />
      <div className="glass-card text-white w-full max-w-md">
        <div className="text-center">
          <h2 className="text-4xl font-black tracking-tight">CREATE ACCOUNT</h2>
          <p className="text-white/50 mt-2 text-xs tracking-[0.2em] uppercase">
            Join HireHelper
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 mt-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative group">
              <input
                type="text"
                placeholder="First Name"
                required
                className="glass-input"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
              />
              <User className="absolute right-0 top-4 text-white/30" size={18} />
            </div>
            <div className="relative group">
              <input
                type="text"
                placeholder="Last Name"
                required
                className="glass-input"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
              />
              <User className="absolute right-0 top-4 text-white/30" size={18} />
            </div>
          </div>

          <div className="relative group">
            <input
              type="tel"
              placeholder="Mobile Number"
              required
              pattern="[0-9]{10}"
              title="Enter a valid 10-digit number"
              className="glass-input"
              value={formData.mobile_number}
              onChange={(e) =>
                setFormData({ ...formData, mobile_number: e.target.value })
              }
            />
            <Phone className="absolute right-0 top-4 text-white/30" size={18} />
          </div>

          <div className="relative group">
            <input
              type="email"
              placeholder="Email Address"
              required
              className="glass-input"
              value={formData.email_id}
              onChange={(e) =>
                setFormData({ ...formData, email_id: e.target.value })
              }
            />
            <Mail className="absolute right-0 top-4 text-white/30" size={18} />
          </div>

          {/* Password Field */}
          <PasswordInput
            value={formData.password}
            onChange={(val) => setFormData({ ...formData, password: val })}
          />

          <button
            type="submit"
            className="w-full bg-white text-indigo-900 font-black py-4 rounded-xl hover:bg-blue-50 transition-all active:scale-95 shadow-2xl"
          >
            SIGN UP
          </button>
        </form>

        <p className="text-center mt-6 text-white/50 text-sm font-medium">
          Already have an account?{" "}
          <Link to="/login" className="text-white font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
