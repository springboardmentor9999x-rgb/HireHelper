import React, { useState } from "react";
import PasswordInput from "../components/PasswordInput";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react"; // for back arrow

const ForgotPassword = () => {
  const [email_id, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [new_password, setNewPassword] = useState("");
  const [step, setStep] = useState(1); 
  const navigate = useNavigate();

  // SEND OTP
  const handleSendOtp = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/forgot-password",
        { email_id }
      );
      toast.success(res.data.message);
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error sending OTP");
    }
  };

  // VERIFY OTP
  const handleVerifyOtp = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/verify-reset-otp",
        { email_id, otp }
      );
      toast.success(res.data.message);
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    }
  };

  // RESET PASSWORD
  const handleResetPassword = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/reset-password",
        { email_id, otp, new_password }
      );
      toast.success(res.data.message);

      // Navigate to login page after reset
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error resetting password");
    }
  };

  // BACK BUTTON
  const handleGoBack = () => {
    if (step === 1) {
      navigate("/login"); // from first page, go back to login
    } else if (step > 1) {
      setStep(step - 1); // go to previous step
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Toaster position="top-right" />

      <div className="glass-card p-8 w-full max-w-md text-white relative">
        {/* Back Arrow */}
        <button
          onClick={handleGoBack}
          className="absolute top-4 left-4 text-white/70 hover:text-white"
        >
          <ArrowLeft size={24} />
        </button>

        <h2 className="text-2xl font-bold text-center mb-6">
          Forgot Password
        </h2>

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <input
              type="email"
              placeholder="Enter Email"
              className="glass-input w-full mb-4"
              value={email_id}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              onClick={handleSendOtp}
              className="w-full bg-white text-blue-900 py-3 rounded-xl font-bold"
            >
              Send OTP
            </button>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <input
              type="text"
              placeholder="Enter OTP"
              className="glass-input w-full mb-4"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <button
              onClick={handleVerifyOtp}
              className="w-full bg-white text-blue-900 py-3 rounded-xl font-bold"
            >
              Verify OTP
            </button>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <>
            <PasswordInput
              value={new_password}
              onChange={setNewPassword}
            />
            <button
              onClick={handleResetPassword}
              className="w-full mt-4 bg-white text-blue-900 py-3 rounded-xl font-bold"
            >
              Reset Password
            </button>
          </>
        )}

        {/* Link to Login (optional) */}
        {step !== 3 && (
          <p className="text-center mt-4 text-white/50 text-sm cursor-pointer hover:underline"
             onClick={() => navigate("/login")}>
            Back to Login
          </p>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
