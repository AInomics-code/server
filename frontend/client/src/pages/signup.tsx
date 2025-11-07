import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    // TEMP: Replace with real auth logic
    // For now, just redirect to onboarding
    setLocation("/onboarding");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e] flex items-center justify-center px-4">
      <motion.div 
        className="w-full max-w-md p-8 rounded-2xl shadow-xl border border-blue-500/20 bg-gradient-to-br from-[#1c2340] to-[#2a3b5c]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-semibold text-white mb-6 text-center">
          Sign up for <span className="text-blue-400 font-bold">VORTA</span>
        </h1>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm text-blue-200 mb-1">Email</label>
            <input 
              type="email"
              className="w-full px-4 py-2 border border-blue-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#1a1a2e]/50 text-white placeholder-blue-200/50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-blue-200 mb-1">Password</label>
            <input 
              type="password"
              className="w-full px-4 py-2 border border-blue-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#1a1a2e]/50 text-white placeholder-blue-200/50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-blue-200 mb-1">Confirm Password</label>
            <input 
              type="password"
              className="w-full px-4 py-2 border border-blue-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#1a1a2e]/50 text-white placeholder-blue-200/50"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 rounded-xl hover:from-blue-500 hover:to-blue-600 transition"
          >
            Sign up
          </button>
        </form>

        <p className="text-sm text-blue-200 mt-4 text-center">
          Already have an account?{" "}
          <a href="/login" className="text-blue-400 font-medium underline hover:text-blue-300">
            Log in
          </a>
        </p>
      </motion.div>
    </div>
  );
}