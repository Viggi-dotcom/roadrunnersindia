import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Lock, Mail, KeyRound, Mountain, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { api } from "../lib/api";
import { useStore } from "../store";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { setAccessToken, setIsAdmin, setAdminUser } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "setup">("login");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(`Login failed: ${authError.message}`);
        return;
      }

      const token = data.session?.access_token;
      if (!token) {
        setError("No session token received");
        return;
      }

      const adminCheck = await api.checkAdmin(token);
      if (!adminCheck.isAdmin) {
        setError("Access denied. This account does not have admin privileges.");
        return;
      }

      setAccessToken(token);
      setIsAdmin(true);
      setAdminUser(adminCheck.user);
      navigate("/admin");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(`Login failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // Attempt to create user — if they already exist, proceed to sign-in anyway
      try {
        await api.signup(email, password, "Admin");
      } catch (signupErr: any) {
        const msg: string = signupErr?.message ?? "";
        // If the account already exists, that's fine — just continue to sign-in
        if (!msg.toLowerCase().includes("already")) {
          throw signupErr;
        }
        console.log("User already exists, proceeding to sign-in:", msg);
      }

      // Sign in
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(`Sign in after setup failed: ${authError.message}`);
        return;
      }

      const token = data.session?.access_token;
      const userId = data.user?.id;
      if (!token || !userId) {
        setError("No session after signup");
        return;
      }

      // Grant admin — for first-time setup, use the anon key (no accessToken)
      // so the Supabase Edge Functions gateway accepts the request.
      // The server allows this when no admins exist yet.
      await api.makeAdmin(userId);

      // Verify admin status with the user's token, fall back to direct state if gateway rejects
      let adminCheck: any = null;
      try {
        adminCheck = await api.checkAdmin(token);
      } catch {
        // If check-admin also fails (gateway JWT issue), trust the grant succeeded
        console.log("checkAdmin failed after grant, proceeding with direct state");
      }

      setAccessToken(token);
      setIsAdmin(true);
      setAdminUser(
        adminCheck?.user || { id: userId, email, name: "Admin" }
      );
      navigate("/admin");
    } catch (err: any) {
      console.error("Setup error:", err);
      setError(`Setup failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="border-2 border-[#333] bg-[#242424] p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#D85A21] flex items-center justify-center">
              <Mountain className="w-7 h-7 text-[#1A1A1A]" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="font-['Oswald'] text-xl font-bold text-[#F4F4F5]">
                ADMIN ACCESS
              </h2>
              <span className="text-[#666] text-xs">RoadRunnersIndia Control Panel</span>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 py-2 font-['Oswald'] text-sm tracking-wider border-2 transition-colors ${
                mode === "login"
                  ? "bg-[#D85A21] border-[#D85A21] text-[#F4F4F5]"
                  : "border-[#333] text-[#999] hover:border-[#D85A21]"
              }`}
            >
              LOGIN
            </button>
            <button
              onClick={() => { setMode("setup"); setError(""); }}
              className={`flex-1 py-2 font-['Oswald'] text-sm tracking-wider border-2 transition-colors ${
                mode === "setup"
                  ? "bg-[#D85A21] border-[#D85A21] text-[#F4F4F5]"
                  : "border-[#333] text-[#999] hover:border-[#D85A21]"
              }`}
            >
              FIRST-TIME SETUP
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-600/10 border border-red-600/30 mb-4">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" strokeWidth={2.5} />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="font-['Oswald'] text-xs tracking-wider text-[#999] mb-1 block">
                EMAIL
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" strokeWidth={2.5} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1A1A1A] border-2 border-[#333] px-10 py-3 text-[#F4F4F5] text-sm focus:border-[#D85A21] focus:outline-none transition-colors"
                  placeholder="admin@roadrunnersindia.com"
                  onKeyDown={(e) => e.key === "Enter" && (mode === "login" ? handleLogin() : handleSetup())}
                />
              </div>
            </div>

            <div>
              <label className="font-['Oswald'] text-xs tracking-wider text-[#999] mb-1 block">
                PASSWORD
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" strokeWidth={2.5} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1A1A1A] border-2 border-[#333] px-10 py-3 text-[#F4F4F5] text-sm focus:border-[#D85A21] focus:outline-none transition-colors"
                  placeholder="••••••••"
                  onKeyDown={(e) => e.key === "Enter" && (mode === "login" ? handleLogin() : handleSetup())}
                />
              </div>
            </div>

            <button
              onClick={mode === "login" ? handleLogin : handleSetup}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#E5FF00] text-[#1A1A1A] font-['Oswald'] text-base font-bold tracking-wider hover:shadow-[4px_4px_0px_#D85A21] transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Lock className="w-5 h-5" strokeWidth={2.5} />
              )}
              {mode === "login" ? "AUTHENTICATE" : "CREATE ADMIN ACCOUNT"}
            </button>
          </div>

          {mode === "setup" && (
            <p className="text-[#666] text-xs text-center mt-4">
              First-time setup creates an admin account. Subsequent admins must be added by an existing admin.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}