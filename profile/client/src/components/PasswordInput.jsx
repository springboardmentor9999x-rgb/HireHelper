import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const PasswordInput = ({ value = "", onChange }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative w-full">
      <input
        type={showPassword ? "text" : "password"}
        placeholder="Enter Password"
        className="glass-input w-full pr-10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="new-password"
      />

      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50"
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
};

export default PasswordInput;
