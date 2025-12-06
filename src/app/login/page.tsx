"use client";
import { useState, useEffect } from "react";
import { signIn, signUp, resetPassword, signInWithGoogle } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Link from "next/link";
import { motion, AnimatePresence } from "@/lib/motion";
import { SpinnerGap, Envelope, Lock, User, ArrowLeft, CheckCircle } from "@phosphor-icons/react";

// Google Icon SVG
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

type AuthMode = "login" | "register" | "forgot";

export default function Login() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/");
    }
  }, [user, authLoading, router]);

  const resetForm = () => {
    setError("");
    setSuccess("");
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    resetForm();

    const result = await signInWithGoogle();
    
    if (result.success) {
      toast.success("Welcome to CIPHER!");
      // Use replace instead of push and add a small delay
      setTimeout(() => {
        router.replace("/");
      }, 100);
    } else if (result.error !== "Sign-in cancelled") {
      setError(result.error || "Google sign-in failed. Please try again.");
      setGoogleLoading(false);
    } else {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    resetForm();

    const result = await signIn(email, password);
    
    if (result.success) {
      toast.success("Welcome back!");
      setTimeout(() => {
        router.replace("/");
      }, 100);
    } else {
      setError(result.error || "Login failed. Please try again.");
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    resetForm();

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    const result = await signUp(email, password, displayName);
    
    if (result.success) {
      toast.success("Account created successfully!");
      setTimeout(() => {
        router.replace("/");
      }, 100);
    } else {
      setError(result.error || "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    resetForm();

    const result = await resetPassword(email);
    
    if (result.success) {
      setSuccess("Password reset email sent! Check your inbox.");
    } else {
      setError(result.error || "Failed to send reset email.");
    }
    
    setLoading(false);
  };

  const switchMode = (newMode: AuthMode) => {
    resetForm();
    setMode(newMode);
  };

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <SpinnerGap className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Don't render if already logged in (will redirect)
  if (user) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <SpinnerGap className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
          <AnimatePresence mode="wait">
            {/* Login Form */}
            {mode === "login" && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="text-center mb-8">
                  <h1 className="text-4xl font-black tracking-tighter mb-2">WELCOME BACK</h1>
                  <p className="text-gray-500">Sign in to access your account</p>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold mb-2 text-gray-700">Email Address</label>
                    <div className="relative">
                      <Envelope className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-bold text-gray-700">Password</label>
                      <button 
                        type="button"
                        onClick={() => switchMode("forgot")}
                        className="text-xs text-gray-500 hover:text-black transition"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <SpinnerGap className="w-5 h-5 animate-spin" /> Signing In...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">or continue with</span>
                  </div>
                </div>

                {/* Google Sign In */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="w-full bg-white border border-gray-200 py-4 rounded-xl font-medium hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {googleLoading ? (
                    <SpinnerGap className="w-5 h-5 animate-spin" />
                  ) : (
                    <GoogleIcon className="w-5 h-5" />
                  )}
                  Continue with Google
                </button>

                <div className="mt-8 text-center text-sm text-gray-500">
                  Don't have an account?{" "}
                  <button 
                    onClick={() => switchMode("register")}
                    className="font-bold text-black hover:underline"
                  >
                    Create Account
                  </button>
                </div>
              </motion.div>
            )}

            {/* Register Form */}
            {mode === "register" && (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-8">
                  <h1 className="text-4xl font-black tracking-tighter mb-2">JOIN CIPHER</h1>
                  <p className="text-gray-500">Create your account to get started</p>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleRegister} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold mb-2 text-gray-700">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2 text-gray-700">Email Address</label>
                    <div className="relative">
                      <Envelope className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2 text-gray-700">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition"
                        placeholder="Min. 6 characters"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <SpinnerGap className="w-5 h-5 animate-spin" /> Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">or continue with</span>
                  </div>
                </div>

                {/* Google Sign In */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="w-full bg-white border border-gray-200 py-4 rounded-xl font-medium hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {googleLoading ? (
                    <SpinnerGap className="w-5 h-5 animate-spin" />
                  ) : (
                    <GoogleIcon className="w-5 h-5" />
                  )}
                  Continue with Google
                </button>

                <div className="mt-8 text-center text-sm text-gray-500">
                  Already have an account?{" "}
                  <button 
                    onClick={() => switchMode("login")}
                    className="font-bold text-black hover:underline"
                  >
                    Sign In
                  </button>
                </div>
              </motion.div>
            )}

            {/* Forgot Password Form */}
            {mode === "forgot" && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <button 
                  onClick={() => switchMode("login")}
                  className="flex items-center gap-2 text-gray-500 hover:text-black mb-6 transition"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Sign In
                </button>

                <div className="text-center mb-8">
                  <h1 className="text-4xl font-black tracking-tighter mb-2">RESET PASSWORD</h1>
                  <p className="text-gray-500">Enter your email to receive a reset link</p>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {success && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 text-green-600 p-4 rounded-xl mb-6 text-sm flex items-center gap-3"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {success}
                  </motion.div>
                )}

                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold mb-2 text-gray-700">Email Address</label>
                    <div className="relative">
                      <Envelope className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !!success}
                    className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <SpinnerGap className="w-5 h-5 animate-spin" /> Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          By continuing, you agree to Cipher's Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
