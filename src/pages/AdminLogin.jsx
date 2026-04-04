import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", secretKey: "" });
  const [showPass, setShowPass] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleLogin = async () => {
    if (!form.email || !form.password || !form.secretKey) {
      setError("All fields are required"); return;
    }
    if (attempts >= 5) {
      setError("Too many failed attempts. Try again later."); return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await API.post("/admin/auth/login", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/admin");
    } catch (err) {
      setAttempts(p => p + 1);
      setError(err.response?.data?.msg || "Login failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "30px 30px" }} />

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-yellow-500 rounded-2xl flex items-center justify-center text-white text-3xl font-black mx-auto shadow-2xl shadow-yellow-500/30">
            ⚙️
          </div>
          <h1 className="text-white font-black text-2xl mt-4">Admin Portal</h1>
          <p className="text-gray-500 text-sm mt-1">chalte rho • Internal Access Only</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
            <span className="text-red-400 text-xs font-semibold">RESTRICTED ACCESS</span>
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
          </div>
        </div>

        {/* Card */}
        <div className="bg-gray-900 rounded-3xl p-6 shadow-2xl border border-gray-800 space-y-4">

          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-xl px-4 py-3 flex items-center gap-2">
              <span className="text-red-400 text-lg">⚠️</span>
              <p className="text-red-300 text-sm font-semibold">{error}</p>
            </div>
          )}

          {attempts >= 3 && attempts < 5 && (
            <div className="bg-orange-900/50 border border-orange-700 rounded-xl px-4 py-2">
              <p className="text-orange-300 text-xs font-semibold">⚠️ {5 - attempts} attempts remaining before lockout</p>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="text-gray-400 text-xs font-bold">Admin Email</label>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
              className="w-full mt-1 bg-gray-800 border-2 border-gray-700 focus:border-yellow-500 rounded-xl px-4 py-3 text-white outline-none text-sm"
              placeholder="admin@chalterho.com" autoComplete="off" />
          </div>

          {/* Password */}
          <div>
            <label className="text-gray-400 text-xs font-bold">Password</label>
            <div className="relative mt-1">
              <input type={showPass ? "text" : "password"} value={form.password} onChange={(e) => set("password", e.target.value)}
                className="w-full bg-gray-800 border-2 border-gray-700 focus:border-yellow-500 rounded-xl px-4 py-3 text-white outline-none text-sm pr-10"
                placeholder="••••••••" autoComplete="new-password" />
              <button onClick={() => setShowPass(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Secret Key */}
          <div>
            <label className="text-gray-400 text-xs font-bold">🔑 Admin Secret Key</label>
            <div className="relative mt-1">
              <input type={showKey ? "text" : "password"} value={form.secretKey} onChange={(e) => set("secretKey", e.target.value)}
                className="w-full bg-gray-800 border-2 border-gray-700 focus:border-yellow-500 rounded-xl px-4 py-3 text-white outline-none text-sm pr-10"
                placeholder="Enter secret key" autoComplete="off" />
              <button onClick={() => setShowKey(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                {showKey ? "🙈" : "👁️"}
              </button>
            </div>
            <p className="text-gray-600 text-xs mt-1">Contact your system administrator for the secret key.</p>
          </div>

          <button onClick={handleLogin} disabled={loading || attempts >= 5}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-black py-4 rounded-2xl text-base transition-all disabled:opacity-40 shadow-lg shadow-yellow-500/20">
            {loading ? "Authenticating..." : "🔐 Secure Login"}
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-1">
          <p className="text-gray-600 text-xs">This page is not indexed by search engines.</p>
          <p className="text-gray-700 text-xs">Unauthorized access is prohibited and monitored.</p>
        </div>
      </div>
    </div>
  );
}
