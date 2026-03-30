import React, { useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

const VerifyOTP = () => {
    const [otp, setOtp] = useState("");
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email || "your email";

    const handleVerify = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/auth/verify-otp', { email_id: email, otp });
            toast.success("OTP verified! Account activated.");
            navigate('/login');
        } catch (err) {
            toast.error("Code incorrect. Please check your email.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 animate-in slide-in-from-bottom duration-700 relative">
            {/* Toast container */}
            <Toaster position="top-right" reverseOrder={false} />

            <div className="glass-card w-full max-w-[420px] p-12 text-center text-white rounded-[3rem]">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl border border-white/20">
                    <ShieldCheck size={42} className="text-white" />
                </div>
                <h2 className="text-3xl font-black mb-2 tracking-tight uppercase underline decoration-white/20 decoration-4">Verify</h2>
                <p className="text-white/50 text-sm mb-10 leading-relaxed font-medium">
                    Check your inbox for <br/>
                    <span className="text-white font-bold">{email}</span>
                </p>
                <form onSubmit={handleVerify} className="space-y-10">
                    <input
                        type="text"
                        maxLength="6"
                        placeholder="000000"
                        className="w-full text-center text-5xl tracking-[0.4em] font-mono font-black bg-white/5 border-none p-6 rounded-2xl outline-none focus:bg-white/10 transition-all placeholder:text-white/10"
                        onChange={(e) => setOtp(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="w-full bg-white text-blue-900 font-black py-5 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-50 transition-all shadow-xl"
                    >
                        ACTIVATE ACCOUNT <ArrowRight size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default VerifyOTP;
