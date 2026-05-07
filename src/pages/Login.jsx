import { useState, useContext, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";

// ── Modes ──
const MODE = { MAIN: "main", OTP: "otp", FORGOT_EMAIL: "forgot_email", FORGOT_OTP: "forgot_otp", RESET: "reset" };

// ── Toast ──
function Toast({ msg, type }) {
  if (!msg) return null;
  const bg = type === "success" ? "bg-green-500" : "bg-red-500";
  return (
    <div className={`${bg} text-white text-sm font-semibold px-4 py-2 rounded-xl text-center`}>
      {msg}
    </div>
  );
}

// ── OTP Input (6 boxes) ──
function OtpInput({ value, onChange }) {
  const inputs = useRef([]);
  const digits = value.split("");

  const handleChange = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const arr = digits.slice();
    arr[i] = v;
    onChange(arr.join(""));
    if (v && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKey = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center">
      {[0,1,2,3,4,5].map((i) => (
        <input key={i} ref={(el) => (inputs.current[i] = el)}
          type="text" inputMode="numeric" maxLength={1}
          value={digits[i] || ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          className="w-11 h-12 border-2 border-gray-200 focus:border-yellow-400 rounded-xl text-center text-xl font-black outline-none transition-all"
        />
      ))}
    </div>
  );
}

// ── Countdown ──
function useCountdown(initial = 60) {
  const [sec, setSec] = useState(0);
  const start = () => setSec(initial);
  useEffect(() => {
    if (sec <= 0) return;
    const t = setTimeout(() => setSec((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [sec]);
  return { sec, start, done: sec === 0 };
}

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [mode, setMode]       = useState(MODE.MAIN);
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp]         = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast]     = useState({ msg: "", type: "" });

  const countdown = useCountdown(60);

  const showToast = (msg, type = "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 4000);
  };

  const doNavigate = (userData) => {
    if (userData.role === "driver") navigate("/driver");
    else if (userData.role === "admin") navigate("/admin");
    else navigate("/");
  };

  // ── Password Login ──
  const handlePasswordLogin = async () => {
    if (!email || !password) return showToast("Fill all fields");
    setLoading(true);
    try {
      const res = await API.post("/auth/login", { email, password });
      login({ token: res.data.token, user: res.data.user });
      doNavigate(res.data.user);
    } catch (err) {
      showToast(err.response?.data?.msg || "Login failed");
    }
    setLoading(false);
  };

  // ── Send Email OTP ──
  const handleSendOtp = async (purpose = "login") => {
    if (!email) return showToast("Enter your email first");
    setLoading(true);
    try {
      await API.post("/auth/send-email-otp", { email, purpose });
      setOtp("");
      countdown.start();
      setMode(purpose === "reset" ? MODE.FORGOT_OTP : MODE.OTP);
      showToast("OTP sent to your email ✅", "success");
    } catch (err) {
      showToast(err.response?.data?.msg || "Failed to send OTP");
    }
    setLoading(false);
  };

  // ── Verify OTP (login) ──
  const handleVerifyOtp = async () => {
    if (otp.length < 6) return showToast("Enter the 6-digit OTP");
    setLoading(true);
    try {
      const res = await API.post("/auth/verify-email-otp", { email, otp });
      login({ token: res.data.token, user: res.data.user });
      doNavigate(res.data.user);
    } catch (err) {
      showToast(err.response?.data?.msg || "Invalid OTP");
    }
    setLoading(false);
  };

  // ── Forgot: verify OTP ──
  const handleForgotVerifyOtp = async () => {
    if (otp.length < 6) return showToast("Enter the 6-digit OTP");
    setLoading(true);
    try {
      await API.post("/auth/forgot-verify-otp", { email, otp });
      setMode(MODE.RESET);
      showToast("Email verified ✅", "success");
    } catch (err) {
      showToast(err.response?.data?.msg || "Invalid OTP");
    }
    setLoading(false);
  };

  // ── Reset Password ──
  const handleResetPassword = async () => {
    if (!newPass || newPass.length < 6) return showToast("Password must be at least 6 characters");
    if (newPass !== confirmPass) return showToast("Passwords do not match");
    setLoading(true);
    try {
      await API.post("/auth/reset-password", { email, newPassword: newPass });
      showToast("Password reset! Please log in.", "success");
      setTimeout(() => { setMode(MODE.MAIN); setNewPass(""); setConfirmPass(""); }, 1500);
    } catch (err) {
      showToast(err.response?.data?.msg || "Reset failed");
    }
    setLoading(false);
  };

  const back = () => { setMode(MODE.MAIN); setOtp(""); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-400 to-yellow-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Header */}
        <div className="bg-yellow-500 px-6 py-8 text-center">
          <div className="text-5xl mb-2">🏍️</div>
          <h1 className="text-2xl font-black text-white">chalte rho</h1>
          <p className="text-yellow-100 text-sm mt-1">
            {mode === MODE.FORGOT_EMAIL && "Forgot Password"}
            {mode === MODE.FORGOT_OTP  && "Verify Email"}
            {mode === MODE.RESET       && "Reset Password"}
            {(mode === MODE.MAIN || mode === MODE.OTP) && "Your ride, your way"}
          </p>
        </div>

        <div className="p-6 space-y-4">
          <Toast msg={toast.msg} type={toast.type} />

          {/* ── MAIN: email + password + OTP buttons ── */}
          {mode === MODE.MAIN && (
            <>
              <div>
                <label className="text-sm font-semibold text-gray-600">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePasswordLogin()}
                  className="w-full mt-1 border-2 border-gray-200 focus:border-yellow-400 rounded-xl p-3 outline-none"
                  placeholder="you@example.com" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePasswordLogin()}
                  className="w-full mt-1 border-2 border-gray-200 focus:border-yellow-400 rounded-xl p-3 outline-none"
                  placeholder="••••••••" />
              </div>
              <button onClick={handlePasswordLogin} disabled={loading}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-xl text-base transition-all disabled:opacity-60">
                {loading ? "Logging in..." : "Login with Password →"}
              </button>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-semibold">OR</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <button onClick={() => handleSendOtp("login")} disabled={loading}
                className="w-full border-2 border-yellow-400 text-yellow-600 font-bold py-3 rounded-xl text-base hover:bg-yellow-50 transition-all disabled:opacity-60">
                {loading ? "Sending OTP..." : "✉️ Get OTP on Email"}
              </button>
              <div className="flex justify-between text-sm">
                <button onClick={() => setMode(MODE.FORGOT_EMAIL)}
                  className="text-gray-400 hover:text-yellow-600 font-semibold">
                  Forgot Password?
                </button>
                <Link to="/register" className="text-yellow-600 font-semibold">Create Account</Link>
              </div>
            </>
          )}

          {/* ── OTP: login via email OTP ── */}
          {mode === MODE.OTP && (
            <>
              <p className="text-center text-gray-500 text-sm">
                OTP sent to <span className="font-bold text-gray-700">{email}</span>
              </p>
              <OtpInput value={otp} onChange={setOtp} />
              <button onClick={handleVerifyOtp} disabled={loading || otp.length < 6}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-xl text-base transition-all disabled:opacity-60">
                {loading ? "Verifying..." : "Verify & Login →"}
              </button>
              <div className="flex justify-between items-center text-sm">
                <button onClick={back} className="text-gray-400 hover:text-gray-600 font-semibold">← Back</button>
                {countdown.done
                  ? <button onClick={() => handleSendOtp("login")} className="text-yellow-600 font-semibold">Resend OTP</button>
                  : <span className="text-gray-400">Resend in <span className="font-bold text-yellow-600">{countdown.sec}s</span></span>
                }
              </div>
            </>
          )}

          {/* ── FORGOT: enter email ── */}
          {mode === MODE.FORGOT_EMAIL && (
            <>
              <p className="text-gray-500 text-sm text-center">Enter your registered email to receive a reset OTP.</p>
              <div>
                <label className="text-sm font-semibold text-gray-600">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-1 border-2 border-gray-200 focus:border-yellow-400 rounded-xl p-3 outline-none"
                  placeholder="you@example.com" />
              </div>
              <button onClick={() => handleSendOtp("reset")} disabled={loading}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-xl text-base transition-all disabled:opacity-60">
                {loading ? "Sending..." : "Send Reset OTP →"}
              </button>
              <button onClick={back} className="w-full text-gray-400 text-sm font-semibold">← Back to Login</button>
            </>
          )}

          {/* ── FORGOT OTP: verify ── */}
          {mode === MODE.FORGOT_OTP && (
            <>
              <p className="text-center text-gray-500 text-sm">
                OTP sent to <span className="font-bold text-gray-700">{email}</span>
              </p>
              <OtpInput value={otp} onChange={setOtp} />
              <button onClick={handleForgotVerifyOtp} disabled={loading || otp.length < 6}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-xl text-base transition-all disabled:opacity-60">
                {loading ? "Verifying..." : "Verify OTP →"}
              </button>
              <div className="flex justify-between items-center text-sm">
                <button onClick={back} className="text-gray-400 font-semibold">← Back</button>
                {countdown.done
                  ? <button onClick={() => handleSendOtp("reset")} className="text-yellow-600 font-semibold">Resend OTP</button>
                  : <span className="text-gray-400">Resend in <span className="font-bold text-yellow-600">{countdown.sec}s</span></span>
                }
              </div>
            </>
          )}

          {/* ── RESET PASSWORD ── */}
          {mode === MODE.RESET && (
            <>
              <p className="text-center text-green-600 text-sm font-semibold">✅ Email verified! Set your new password.</p>
              <div>
                <label className="text-sm font-semibold text-gray-600">New Password</label>
                <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)}
                  className="w-full mt-1 border-2 border-gray-200 focus:border-yellow-400 rounded-xl p-3 outline-none"
                  placeholder="Min. 6 characters" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Confirm Password</label>
                <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)}
                  className="w-full mt-1 border-2 border-gray-200 focus:border-yellow-400 rounded-xl p-3 outline-none"
                  placeholder="Repeat password" />
              </div>
              <button onClick={handleResetPassword} disabled={loading}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-xl text-base transition-all disabled:opacity-60">
                {loading ? "Resetting..." : "Reset Password →"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
