import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock } from "lucide-react";

export default function Login() {
  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() !== "") {
      setError("");
      setStep("password");
    } else {
      setError("Please enter your email");
    }
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() !== "") {
      setError("");
      // Store login state in sessionStorage (will be cleared on refresh)
      sessionStorage.setItem("isLoggedIn", "true");
      setTimeout(() => {
        setLocation("/onboarding");
      }, 300);
    } else {
      setError("Please create a password");
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e] p-4 text-white gap-2">
      {/* LEFT CARD */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full md:w-1/2 bg-gradient-to-br from-[#1c2340] to-[#2a3b5c] rounded-3xl flex flex-col justify-center px-8 md:px-12 shadow-2xl border border-blue-500/20"
      >
        <div className="max-w-md w-full mx-auto">
          {/* VORTA Atom Logo */}
          <div className="flex justify-center mb-4">
            <svg width="70" height="70" viewBox="0 0 100 100" className="text-blue-400">
              <defs>
                <radialGradient id="atomBlue" cx="30%" cy="30%" r="70%">
                  <stop offset="0%" style={{ stopColor: '#60a5fa', stopOpacity: 1 }} />
                  <stop offset="60%" style={{ stopColor: '#3b82f6', stopOpacity: 0.8 }} />
                  <stop offset="100%" style={{ stopColor: '#1e40af', stopOpacity: 0.3 }} />
                </radialGradient>
              </defs>
              
              {/* First orbital ring */}
              <ellipse cx="50" cy="50" rx="35" ry="15" 
                fill="none" stroke="url(#atomBlue)" strokeWidth="8" 
                transform="rotate(0 50 50)" opacity="0.8" />
              
              {/* Second orbital ring */}
              <ellipse cx="50" cy="50" rx="35" ry="15" 
                fill="none" stroke="url(#atomBlue)" strokeWidth="8" 
                transform="rotate(60 50 50)" opacity="0.8" />
              
              {/* Third orbital ring */}
              <ellipse cx="50" cy="50" rx="35" ry="15" 
                fill="none" stroke="url(#atomBlue)" strokeWidth="8" 
                transform="rotate(120 50 50)" opacity="0.8" />
              
              {/* Central nucleus */}
              <circle cx="50" cy="50" r="8" fill="url(#atomBlue)" opacity="0.9" />
              <circle cx="50" cy="50" r="4" fill="#60a5fa" opacity="1" />
            </svg>
          </div>
          
          <div className="mb-8">
            <div className="text-left">
              <p className="text-4xl mb-0 bg-gradient-to-r from-blue-100 via-blue-200 to-cyan-100 bg-clip-text text-transparent font-bold leading-tight" 
                 style={{ 
                   fontFamily: '"Inter", "Helvetica Neue", "Segoe UI", system-ui, sans-serif', 
                   fontWeight: '700', 
                   letterSpacing: '-0.02em',
                   textShadow: 'none'
                 }}>
                Your AI Copilot
              </p>
              <p className="text-4xl mb-6 bg-gradient-to-r from-blue-100 via-blue-200 to-cyan-100 bg-clip-text text-transparent font-bold leading-tight" 
                 style={{ 
                   fontFamily: '"Inter", "Helvetica Neue", "Segoe UI", system-ui, sans-serif', 
                   fontWeight: '700', 
                   letterSpacing: '-0.02em',
                   textShadow: 'none'
                 }}>
                For Business Intelligence
              </p>
            </div>
          </div>

          {/* Two-Step Animated Form */}
          <AnimatePresence mode="wait">
            {step === "email" && (
              <motion.div
                key="email"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="space-y-4 mb-4"
              >
                {/* Email Input */}
                <form onSubmit={handleContinue} className="space-y-3">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Email</label>
                    <div className="flex items-center bg-white/10 border border-white/20 px-4 py-3 rounded-2xl backdrop-blur-sm focus-within:ring-2 focus-within:ring-blue-300/50 focus-within:border-blue-300/50 transition-all duration-300">
                      <Mail className="w-5 h-5 text-blue-400 mr-3" />
                      <input
                        type="email"
                        placeholder="you@company.com"
                        className="bg-transparent w-full text-sm text-gray-100 placeholder:text-gray-400 focus:outline-none transition duration-200"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {error && <p className="text-red-300/80 text-sm">{error}</p>}

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-medium text-white shadow-lg hover:shadow-xl"
                  >
                    Continue
                  </button>
                </form>

                {/* Social Login Buttons - Only show in email step */}
                <div className="flex items-center mb-4">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                  <span className="px-6 text-white/60 text-sm font-light">OR</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button className="flex items-center justify-center px-6 py-2.5 bg-blue-500/10 backdrop-blur-sm rounded-lg border border-blue-300/20 hover:bg-blue-500/15 hover:border-blue-300/30 transition-all duration-300 group">
                    <svg className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </button>

                  <button className="flex items-center justify-center px-6 py-2.5 bg-blue-500/10 backdrop-blur-sm rounded-lg border border-blue-300/20 hover:bg-blue-500/15 hover:border-blue-300/30 transition-all duration-300 group">
                    <svg className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09z"/>
                      <path d="M15.53 3.83c.893-1.09 1.472-2.58 1.306-4.089-1.265.056-2.847.875-3.758 1.944-.806.942-1.526 2.486-1.34 3.938 1.421.106 2.88-.717 3.792-1.793z"/>
                    </svg>
                  </button>

                  <button className="flex items-center justify-center px-6 py-2.5 bg-blue-500/10 backdrop-blur-sm rounded-lg border border-blue-300/20 hover:bg-blue-500/15 hover:border-blue-300/30 transition-all duration-300 group">
                    <svg className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </button>

                  <button className="flex items-center justify-center px-6 py-2.5 bg-blue-500/10 backdrop-blur-sm rounded-lg border border-blue-300/20 hover:bg-blue-500/15 hover:border-blue-300/30 transition-all duration-300 group">
                    <svg className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </button>
                </div>

                {/* Skip to Dashboard Button */}
                <div className="mt-6 pt-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      sessionStorage.setItem("isLoggedIn", "true");
                      setLocation("/dashboard");
                    }}
                    className="w-full py-3 bg-transparent border border-white/20 rounded-2xl hover:bg-white/5 hover:border-white/30 transition-all duration-300 font-medium text-white/80 hover:text-white"
                  >
                    Skip to Dashboard
                  </button>
                </div>
              </motion.div>
            )}

            {step === "password" && (
              <motion.div
                key="password"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="space-y-4 mb-4"
              >
                {/* Password Input */}
                <form onSubmit={handleCreateAccount} className="space-y-3">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Create Password</label>
                    <div className="flex items-center bg-white/10 border border-white/20 px-4 py-3 rounded-2xl backdrop-blur-sm focus-within:ring-2 focus-within:ring-blue-300/50 focus-within:border-blue-300/50 transition-all duration-300">
                      <Lock className="w-5 h-5 text-blue-400 mr-3" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="bg-transparent w-full text-sm text-gray-100 placeholder:text-gray-400 focus:outline-none transition duration-200"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {error && <p className="text-red-300/80 text-sm">{error}</p>}

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-medium text-white shadow-lg hover:shadow-xl"
                  >
                    Create Account
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Terms and Privacy Policy */}
          <div className="mt-8 text-center">
            <p className="text-xs text-white/40">
              By proceeding, you agree to our{" "}
              <span className="underline cursor-pointer hover:text-white/60 transition-colors">
                Terms of use
              </span>
              .
            </p>
            <p className="text-xs text-white/40 mt-1">
              Read our{" "}
              <span className="underline cursor-pointer hover:text-white/60 transition-colors">
                Privacy Policy
              </span>
            </p>
          </div>
          
        </div>
      </motion.div>
      {/* RIGHT CARD */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="hidden md:block md:w-1/2 bg-gradient-to-br from-[#0a0a1a] to-[#1a1a2e] rounded-3xl relative overflow-hidden shadow-2xl border border-blue-500/20"
      >
        {/* Simple Flowing Blue Wave Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Dark navy to black gradient backdrop */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-black"></div>
          
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 1920 1080"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              {/* Simple blue gradient for clean wave effect */}
              <radialGradient id="blueGlow" cx="50%" cy="50%" r="70%">
                <stop offset="0%" style={{ stopColor: '#2563eb', stopOpacity: 0.9 }} />
                <stop offset="50%" style={{ stopColor: '#1e40af', stopOpacity: 0.6 }} />
                <stop offset="100%" style={{ stopColor: '#0f172a', stopOpacity: 0.2 }} />
              </radialGradient>
              
              <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#0c1e3f', stopOpacity: 0.95 }} />
                <stop offset="30%" style={{ stopColor: '#1e40af', stopOpacity: 0.8 }} />
                <stop offset="70%" style={{ stopColor: '#2563eb', stopOpacity: 0.6 }} />
                <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 0.4 }} />
              </linearGradient>
              
              {/* Simple glow filter */}
              <filter id="blueGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="8" result="glow"/>
                <feMerge> 
                  <feMergeNode in="glow"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Simple flowing wave shapes matching the reference image */}
            
            {/* Main flowing curve from top-left to bottom-right */}
            <path
              d="M-100,200 Q400,100 800,300 Q1200,500 1600,400 Q1800,350 2100,400 L2100,1200 L-100,1200 Z"
              fill="url(#waveGradient)"
              filter="url(#blueGlow)"
            />
            
            {/* Secondary curve for depth */}
            <path
              d="M-100,400 Q500,250 900,450 Q1300,650 1700,550 Q1900,500 2100,550 L2100,1200 L-100,1200 Z"
              fill="url(#waveGradient)"
              opacity="0.6"
            />
            
            {/* Subtle glow effect */}
            <ellipse cx="960" cy="540" rx="800" ry="400" fill="url(#blueGlow)" opacity="0.3" />
          </svg>
          
          {/* Enterprise finish overlay for polished look */}
          <div 
            className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent" 
            style={{ 
              backdropFilter: 'blur(0.2px)',
              background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.03) 100%)'
            }}
          ></div>
        </div>

        {/* Subtle glow effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 via-transparent to-purple-500/5"></div>
      </motion.div>
    </div>
  );
}