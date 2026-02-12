import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { User, ArrowRight, Plus, Sparkles, Mail } from "lucide-react";
import { API_CONFIG } from "../config/api";
import { setAuthToken } from "../utils/auth";

// ============================================================================
// TEMPORARY BYPASS - Set to false to show the real login screen
// ============================================================================
export default function UserIdEntry() {
  const [mode, setMode] = useState<"enter" | "create">("enter");
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
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

  const handleContinue = (e?: React.MouseEvent) => {
    // Prevent form submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Clear any existing errors first
    setError("");
    
    // Validate email first
    if (!email.trim()) {
      setError("Please enter your work email");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    // If password field is not shown yet, show it
    if (!showPasswordField) {
      setShowPasswordField(true);
      setError(""); // Clear error again to be sure
      return;
    }
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

    if (mode === "create" && !password.trim()) {
      setError("Please enter a password");
      return;
    }

    // For login mode, check if password field should be shown first
    if (mode === "enter" && !showPasswordField) {
      setShowPasswordField(true);
      return;
    }

    setIsSubmitting(true);

    try {
      // For now, only login is supported (signup requires admin privileges)
      // According to API docs, signup is done via /api/users endpoint by admins
      if (mode === "create") {
        setError("User creation requires admin privileges. Please contact an administrator or use login if you have an account.");
        setIsSubmitting(false);
        return;
      }

      // For login, require password
      if (!password.trim()) {
        setError("Please enter your password");
        setIsSubmitting(false);
        return;
      }

      // Call backend API for login
      const endpoint = `${API_CONFIG.BASE_URL}${API_CONFIG.LOGIN_ENDPOINT}`;
      
      // Log the endpoint for debugging
      console.log('🔐 Attempting login to:', endpoint);
      
      const requestBody = {
        email: email.trim(),
        password: password,
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        // Add credentials for CORS if needed
        credentials: "include",
      }).catch((fetchError) => {
        // Handle network errors (like "Failed to fetch")
        console.error('❌ Fetch error details:', fetchError);
        console.error('❌ Endpoint attempted:', endpoint);
        console.error('❌ Error type:', fetchError instanceof TypeError ? 'Network/CORS error' : 'Unknown error');
        
        // Provide more specific error messages
        if (fetchError instanceof TypeError) {
          if (fetchError.message.includes('Failed to fetch')) {
            throw new Error(
              `Network error: Cannot reach ${endpoint}. ` +
              `Possible causes: CORS issue, server down, or wrong URL. ` +
              `Check browser console Network tab for details.`
            );
          }
          throw new Error(`Network error: ${fetchError.message}`);
        }
        throw new Error(fetchError instanceof Error ? fetchError.message : "Network error: Unable to reach the server. Please check your connection.");
      });

      if (!response.ok) {
        // Read response body only once - get text first, then try to parse as JSON
        let errorMessage = `Authentication failed: ${response.status} ${response.statusText}`;
        
        try {
          // Read as text first (can only read once)
          const errorText = await response.text();
          
          // Try to parse as JSON
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.detail || errorData.message || errorData.error || errorText;
            console.error('❌ Backend Error Response:', errorData);
          } catch {
            // Not JSON, use text as-is
            errorMessage = errorText || errorMessage;
            console.error('❌ Backend Error (text):', errorText);
          }
        } catch (readError) {
          // If reading fails, use status text
          console.error('❌ Backend Error Status:', response.status, response.statusText);
          console.error('❌ Could not read response body:', readError);
        }
        
        // Provide more specific error messages based on status
        if (response.status === 500) {
          console.error('🔴 Backend 500 Error Details:', {
            status: response.status,
            statusText: response.statusText,
            errorMessage: errorMessage,
            endpoint: endpoint,
            requestBody: { email: email.trim(), password: '***' }
          });
          
          throw new Error(
            `Backend server error (500). ` +
            `The backend is having issues processing your login. ` +
            `Possible causes: database connection issue, user not found, or backend code error. ` +
            `Error: ${errorMessage}. ` +
            `Please check backend logs or contact support.`
          );
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Extract JWT token from response
      // Backend returns: { access_token, token_type, user }
      const token = data.access_token;
      
      if (!token) {
        throw new Error("No token received from server");
      }

      // Debug: Log token info (without exposing full token)
      console.log('✅ Login successful:', {
        hasToken: !!token,
        tokenLength: token.length,
        tokenPreview: `${token.substring(0, 20)}...`,
        tokenType: data.token_type || 'unknown',
        user: data.user ? { email: data.user.email, user_id: data.user.user_id } : 'none',
      });

      // Store JWT token
      setAuthToken(token);

      // Store user information from response
      if (data.user) {
        localStorage.setItem("userId", data.user.user_id || email.trim());
        localStorage.setItem("userEmail", data.user.email || email.trim());
        if (data.user.name) {
          localStorage.setItem("userName", data.user.name);
        }
        if (data.user.last_name) {
          localStorage.setItem("userLastName", data.user.last_name);
        }
        localStorage.setItem("isAdmin", data.user.admin ? "true" : "false");
      } else {
        // Fallback if user object not in response
        localStorage.setItem("userId", email.trim());
        localStorage.setItem("userEmail", email.trim());
      }
      
      sessionStorage.setItem("isLoggedIn", "true");

      // Smooth transition with animation
      setTimeout(() => {
        setLocation("/llm-chat");
      }, 300);
    } catch (error) {
      setIsSubmitting(false);
      setError(error instanceof Error ? error.message : "Authentication failed. Please try again.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#1F2227",
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
          backgroundColor: "#32373F",
          borderRadius: "16px",
          padding: "48px 40px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Aragon Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "40px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
              <path
                d="M32 8L32 56"
                stroke="#5ca2f9"
                strokeWidth="8"
                strokeLinecap="square"
              />
              <path
                d="M52.78 20L11.22 44"
                stroke="#5ca2f9"
                strokeWidth="8"
                strokeLinecap="square"
              />
              <path
                d="M11.22 20L52.78 44"
                stroke="#5ca2f9"
                strokeWidth="8"
                strokeLinecap="square"
              />
            </svg>
            <span
              style={{
                fontSize: "32px",
                fontWeight: 600,
                color: "#5ca2f9",
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
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              style={{ marginBottom: "16px", overflow: "hidden" }}
            >
              <label
                htmlFor="userName"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#757C8A",
                  marginBottom: "8px",
                }}
              >
                Name
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
                  border: "1px solid #5F6672",
                  borderRadius: "8px",
                  color: "rgba(255, 255, 255, 0.7)",
                  fontSize: "15px",
                  fontFamily: '"Inter", sans-serif',
                  outline: "none",
                  transition: "all 0.2s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#5F6672";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#5F6672";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              />
              <style>{`
                #userName::placeholder {
                  color: rgba(255, 255, 255, 0.3);
                  opacity: 1;
                }
                #userName:-webkit-autofill,
                #userName:-webkit-autofill:hover,
                #userName:-webkit-autofill:focus,
                #userName:-webkit-autofill:active,
                #userName:autofill,
                #userName:autofill:hover,
                #userName:autofill:focus,
                #userName:autofill:active {
                  -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
                  box-shadow: 0 0 0 1000px transparent inset !important;
                  -webkit-text-fill-color: rgba(255, 255, 255, 0.7) !important;
                  color: rgba(255, 255, 255, 0.7) !important;
                  background-color: transparent !important;
                  background: transparent !important;
                  caret-color: rgba(255, 255, 255, 0.7) !important;
                }
                #userName:hover,
                #userName:focus {
                  background-color: transparent !important;
                  background: transparent !important;
                }
              `}</style>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ marginBottom: mode === "create" ? "16px" : showPasswordField ? "16px" : "24px" }}
          >
            <label
              htmlFor="email"
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 500,
                color: "#757C8A",
                marginBottom: "8px",
              }}
            >
              {mode === "enter" ? "Username or Email" : "Work Email"}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setUserId(e.target.value); // Use email as userId for now
                setError("");
                // Reset password field visibility when email changes
                if (showPasswordField) {
                  setShowPasswordField(false);
                }
                // Force transparent background after change
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isSubmitting) {
                  handleSubmit(e);
                }
              }}
              placeholder="name@company.com"
              disabled={isSubmitting}
              autoFocus
              autoComplete="email"
              style={{
                width: "100%",
                padding: "12px 14px",
                backgroundColor: "transparent !important",
                border: error
                  ? "1px solid rgba(248, 113, 113, 0.5)"
                  : "1px solid #5F6672",
                borderRadius: "8px",
                color: "rgba(255, 255, 255, 0.7)",
                fontSize: "15px",
                fontFamily: '"Inter", sans-serif',
                outline: "none",
                transition: "all 0.2s ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#5F6672";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = error
                  ? "rgba(248, 113, 113, 0.5)"
                  : "#5F6672";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              onInput={(e) => {
                // Force transparent background on input
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            />
            <style>{`
              #email::placeholder {
                color: rgba(255, 255, 255, 0.3);
                opacity: 1;
              }
              #email {
                background-color: transparent !important;
                background: transparent !important;
              }
              #email:-webkit-autofill,
              #email:-webkit-autofill:hover,
              #email:-webkit-autofill:focus,
              #email:-webkit-autofill:active,
              #email:-webkit-autofill:visited,
              #email:autofill,
              #email:autofill:hover,
              #email:autofill:focus,
              #email:autofill:active {
                -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
                box-shadow: 0 0 0 1000px transparent inset !important;
                -webkit-text-fill-color: rgba(255, 255, 255, 0.7) !important;
                color: rgba(255, 255, 255, 0.7) !important;
                background-color: transparent !important;
                background: transparent !important;
                background-image: none !important;
                caret-color: rgba(255, 255, 255, 0.7) !important;
                transition: background-color 5000s ease-in-out 0s !important;
              }
              #email:hover,
              #email:focus,
              #email:active,
              #email:visited {
                background-color: transparent !important;
                background: transparent !important;
                background-image: none !important;
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

          {/* Password Field - For login mode, appears after email is entered and continue is clicked */}
          {mode === "enter" && showPasswordField && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: 8 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: 8 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              style={{ marginBottom: "16px", overflow: "hidden" }}
            >
              <label
                htmlFor="password"
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#757C8A",
                  marginBottom: "8px",
                }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isSubmitting) {
                    handleSubmit(e);
                  }
                }}
                placeholder="Enter your password"
                disabled={isSubmitting}
                autoFocus
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  backgroundColor: "transparent",
                  border: error
                    ? "1px solid rgba(248, 113, 113, 0.5)"
                    : "1px solid #5F6672",
                  borderRadius: "8px",
                  color: "rgba(255, 255, 255, 0.7)",
                  fontSize: "15px",
                  fontFamily: '"Inter", sans-serif',
                  outline: "none",
                  transition: "all 0.2s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#5F6672";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = error
                    ? "rgba(248, 113, 113, 0.5)"
                    : "#5F6672";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              />
              <style>{`
                #password::placeholder {
                  color: rgba(255, 255, 255, 0.3);
                  opacity: 1;
                }
                #password:-webkit-autofill,
                #password:-webkit-autofill:hover,
                #password:-webkit-autofill:focus,
                #password:-webkit-autofill:active,
                #password:autofill,
                #password:autofill:hover,
                #password:autofill:focus,
                #password:autofill:active {
                  -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
                  box-shadow: 0 0 0 1000px transparent inset !important;
                  -webkit-text-fill-color: rgba(255, 255, 255, 0.7) !important;
                  color: rgba(255, 255, 255, 0.7) !important;
                  background-color: transparent !important;
                  background: transparent !important;
                  caret-color: rgba(255, 255, 255, 0.7) !important;
                }
                #password:hover,
                #password:focus {
                  background-color: transparent !important;
                  background: transparent !important;
                }
              `}</style>
            </motion.div>
          )}

          {/* Password Field - Only for create mode, appears below email */}
          {mode === "create" && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: 8 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: 8 }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              style={{ marginBottom: "48px", overflow: "hidden" }}
            >
              <label
                htmlFor="password"
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#757C8A",
                  marginBottom: "8px",
                }}
              >
                Create Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isSubmitting) {
                    handleSubmit(e);
                  }
                }}
                placeholder="Enter your password"
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  backgroundColor: "transparent",
                  border: error
                    ? "1px solid rgba(248, 113, 113, 0.5)"
                    : "1px solid #5F6672",
                  borderRadius: "8px",
                  color: "rgba(255, 255, 255, 0.7)",
                  fontSize: "15px",
                  fontFamily: '"Inter", sans-serif',
                  outline: "none",
                  transition: "all 0.2s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#5F6672";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = error
                    ? "rgba(248, 113, 113, 0.5)"
                    : "#5F6672";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              />
              <style>{`
                #password::placeholder {
                  color: rgba(255, 255, 255, 0.3);
                  opacity: 1;
                }
                #password:-webkit-autofill,
                #password:-webkit-autofill:hover,
                #password:-webkit-autofill:focus,
                #password:-webkit-autofill:active,
                #password:autofill,
                #password:autofill:hover,
                #password:autofill:focus,
                #password:autofill:active {
                  -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
                  box-shadow: 0 0 0 1000px transparent inset !important;
                  -webkit-text-fill-color: rgba(255, 255, 255, 0.7) !important;
                  color: rgba(255, 255, 255, 0.7) !important;
                  background-color: transparent !important;
                  background: transparent !important;
                  caret-color: rgba(255, 255, 255, 0.7) !important;
                }
                #password:hover,
                #password:focus {
                  background-color: transparent !important;
                  background: transparent !important;
                }
              `}</style>
            </motion.div>
          )}

          {/* Login Button */}
          <motion.div style={{ marginTop: "8px" }}>
          <motion.button
            type={mode === "enter" && !showPasswordField ? "button" : "submit"}
            onClick={mode === "enter" && !showPasswordField ? handleContinue : undefined}
            disabled={isSubmitting || !email.trim()}
            whileTap={!isSubmitting && email.trim() ? { scale: 0.98 } : {}}
            style={{
              width: "100%",
              padding: "10px 14px",
              backgroundColor: email.trim() && !isSubmitting ? "#5ca2f9" : "#9CA5B5",
              border: "none",
              borderRadius: "24px",
              color: "#FFFFFF",
              fontSize: "15px",
              fontWeight: 500,
              cursor: email.trim() && !isSubmitting ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
              fontFamily: '"Inter", sans-serif',
              opacity: email.trim() && !isSubmitting ? 1 : 0.6,
            }}
            onMouseEnter={(e) => {
              if (email.trim() && !isSubmitting) {
                e.currentTarget.style.backgroundColor = "#5ca2f9";
                e.currentTarget.style.transform = "scale(1.02)";
              }
            }}
            onMouseLeave={(e) => {
              if (email.trim() && !isSubmitting) {
                e.currentTarget.style.backgroundColor = "#5ca2f9";
                e.currentTarget.style.transform = "scale(1)";
              }
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
                <span style={{ marginLeft: "8px" }}>
                  {mode === "create" ? "Signing up..." : "Logging in..."}
                </span>
              </>
            ) : (
              mode === "create" ? "Sign up" : (showPasswordField ? "Login" : "Continue")
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

        {/* Switch between login and sign up */}
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
            {mode === "enter" ? (
              <>
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
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("enter");
                    setPassword("");
                    setShowPasswordField(false);
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
                  Sign in
                </button>
              </>
            )}
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
            backgroundColor: "#2F343B",
            border: "1px solid #5F6672",
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
            e.currentTarget.style.backgroundColor = "#32373F";
            e.currentTarget.style.borderColor = "#5F6672";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#2F343B";
            e.currentTarget.style.borderColor = "#5F6672";
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
