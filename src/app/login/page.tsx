"use client";
import { useState } from "react";
import { signIn, signUp, resetPassword } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Mail, Lock, User, ArrowLeft, CheckCircle } from "lucide-react";

type AuthMode = "login" | "register" | "forgot";

export default function Login() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const resetForm = () => {
    setError("");
    setSuccess("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    resetForm();

    const result = await signIn(email, password);
    
    if (result.success) {
      router.push("/");
    } else {
      setError(result.error || "Login failed. Please try again.");
    }
    
    setLoading(false);
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
      router.push("/");
    } else {
      setError(result.error || "Registration failed. Please try again.");
    }
    
    setLoading(false);
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
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                        <Loader2 className="w-5 h-5 animate-spin" /> Signing In...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </form>

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
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                        <Loader2 className="w-5 h-5 animate-spin" /> Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </form>

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
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                        <Loader2 className="w-5 h-5 animate-spin" /> Sending...
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
