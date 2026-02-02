import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { User, ArrowRight, Plus, Sparkles, Mail } from "lucide-react";

export default function UserIdEntry() {
  const [mode, setMode] = useState<"enter" | "create">("enter");
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();

  const generateUserId = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `user_${timestamp}_${random}`;
  };

  const handleGenerateId = () => {
    const newId = generateUserId();
    setUserId(newId);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "create" && !userId.trim()) {
      // Auto-generate if creating and no ID provided
      setUserId(generateUserId());
    }

    if (!email.trim()) {
      setError("Please enter your work email");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    // Use email as userId
    const finalUserId = email.trim();

    setIsSubmitting(true);

    // Store user ID (email) in localStorage
    localStorage.setItem("userId", finalUserId);
    if (userName.trim()) {
      localStorage.setItem("userName", userName.trim());
    }
    sessionStorage.setItem("isLoggedIn", "true");

    // Smooth transition with animation
    setTimeout(() => {
      setLocation("/llm-chat");
    }, 300);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(to br, #141A24 0%, #1A222D 50%, #141A24 100%)",
        padding: "20px",
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        style={{
          width: "100%",
          maxWidth: "440px",
          backgroundColor: "#19212C",
          borderRadius: "16px",
          padding: "48px 40px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Aragon Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "40px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
              <path
                d="M32 8L32 56"
                stroke="#FFFFFF"
                strokeWidth="8"
                strokeLinecap="square"
              />
              <path
                d="M52.78 20L11.22 44"
                stroke="#FFFFFF"
                strokeWidth="8"
                strokeLinecap="square"
              />
              <path
                d="M11.22 20L52.78 44"
                stroke="#FFFFFF"
                strokeWidth="8"
                strokeLinecap="square"
              />
            </svg>
            <span
              style={{
                fontSize: "32px",
                fontWeight: 600,
                color: "#FFFFFF",
                letterSpacing: "0.5px",
              }}
            >
              Aragon
            </span>
          </div>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {mode === "create" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              style={{ marginBottom: "16px" }}
            >
              <label
                htmlFor="userName"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#9CA5B5",
                  marginBottom: "8px",
                }}
              >
                Name (Optional)
              </label>
              <input
                id="userName"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Your name"
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  backgroundColor: "transparent",
                  border: "0.8px solid rgba(153, 168, 198, 0.4)",
                  borderRadius: "8px",
                  color: "#FFFFFF",
                  fontSize: "15px",
                  fontFamily: '"Inter", sans-serif',
                  outline: "none",
                  transition: "all 0.2s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(153, 168, 198, 0.4)";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(153, 168, 198, 0.4)";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              />
              <style>{`
                #userName::placeholder {
                  color: rgba(255, 255, 255, 0.3);
                  opacity: 1;
                }
              `}</style>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: mode === "create" ? 0.35 : 0.3 }}
            style={{ marginBottom: "48px" }}
          >
            <label
              htmlFor="email"
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 500,
                color: "#9CA5B5",
                marginBottom: "8px",
              }}
            >
              Work Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setUserId(e.target.value); // Use email as userId for now
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isSubmitting) {
                  handleSubmit(e);
                }
              }}
              placeholder="name@company.com"
              disabled={isSubmitting}
              autoFocus
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  backgroundColor: "transparent",
                  border: error
                    ? "0.8px solid rgba(248, 113, 113, 0.5)"
                    : "0.8px solid rgba(153, 168, 198, 0.4)",
                  borderRadius: "8px",
                  color: "#FFFFFF",
                  fontSize: "15px",
                  fontFamily: '"Inter", sans-serif',
                  outline: "none",
                  transition: "all 0.2s ease",
                }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(153, 168, 198, 0.4)";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = error
                  ? "rgba(248, 113, 113, 0.5)"
                  : "rgba(153, 168, 198, 0.4)";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            />
            <style>{`
              #email::placeholder {
                color: rgba(255, 255, 255, 0.3);
                opacity: 1;
              }
            `}</style>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  fontSize: "12px",
                  color: "#F87171",
                  marginTop: "8px",
                  marginBottom: 0,
                }}
              >
                {error}
              </motion.p>
            )}
          </motion.div>

          {/* Login Button */}
          <motion.div style={{ marginTop: "8px" }}>
          <motion.button
            type="submit"
            disabled={isSubmitting || !email.trim()}
            whileTap={!isSubmitting && email.trim() ? { scale: 0.98 } : {}}
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor: "#5B9EFF",
              border: "none",
              borderRadius: "24px",
              color: "#19212C",
              fontSize: "15px",
              fontWeight: 500,
              cursor: email.trim() && !isSubmitting ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.15s ease",
              fontFamily: '"Inter", sans-serif',
              opacity: email.trim() && !isSubmitting ? 1 : 0.6,
            }}
          >
            {isSubmitting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid rgba(255, 255, 255, 0.3)",
                    borderTopColor: "#FFFFFF",
                    borderRadius: "50%",
                  }}
                />
                <span style={{ marginLeft: "8px" }}>Logging in...</span>
              </>
            ) : (
              "Login"
            )}
          </motion.button>
          </motion.div>
        </form>

        {/* Separator Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          style={{
            height: "1px",
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            marginTop: "24px",
            marginBottom: "16px",
          }}
        />

        {/* Still not signed up */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.45 }}
          style={{
            textAlign: "center",
            marginBottom: "16px",
          }}
        >
          <p
            style={{
              fontSize: "14px",
              color: "#FFFFFF",
              marginBottom: 0,
              marginTop: 0,
            }}
          >
            Still not signed up?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("create");
                setEmail("");
                setUserId("");
                setUserName("");
                setError("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                textDecoration: "none",
                fontFamily: '"Inter", sans-serif',
                padding: 0,
                margin: 0,
                transition: "opacity 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.8";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              Sign up
            </button>
          </p>
        </motion.div>

        {/* Sign in with Microsoft */}
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          onClick={() => {
            // Placeholder for Microsoft sign in
            console.log("Sign in with Microsoft");
          }}
          style={{
            width: "100%",
            padding: "12px 14px",
            backgroundColor: "#19212C",
            border: "0.8px solid rgba(153, 168, 198, 0.4)",
            borderRadius: "8px",
            color: "#FFFFFF",
            fontSize: "15px",
            fontWeight: 500,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            transition: "all 0.2s ease",
            fontFamily: '"Inter", sans-serif',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#1F2835";
            e.currentTarget.style.borderColor = "rgba(153, 168, 198, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#19212C";
            e.currentTarget.style.borderColor = "rgba(153, 168, 198, 0.4)";
          }}
        >
          <svg width="20" height="20" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="11" height="11" fill="#F25022"/>
            <rect x="12" y="0" width="11" height="11" fill="#7FBA00"/>
            <rect x="0" y="12" width="11" height="11" fill="#00A4EF"/>
            <rect x="12" y="12" width="11" height="11" fill="#FFB900"/>
          </svg>
          <span>Sign in with Microsoft</span>
        </motion.button>
      </motion.div>
    </div>
  );
}
