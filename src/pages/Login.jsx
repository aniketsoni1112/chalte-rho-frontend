import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleLogin = async () => {
    if (!form.email || !form.password) return alert("Fill all fields");
    setLoading(true);
    try {
      const res = await API.post("/auth/login", form);
      login(res.data);
      const role = res.data.user?.role;
      if (role === "driver") navigate("/driver");
      else navigate("/");
    } catch (err) {
      console.error(err);
      alert("Login failed ❌ Check email/password");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-400 to-yellow-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-yellow-500 px-6 py-8 text-center">
          <div className="text-5xl mb-2">🏍️</div>
          <h1 className="text-2xl font-black text-white">chalte rho</h1>
          <p className="text-yellow-100 text-sm mt-1">Your ride, your way</p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-600">Email</label>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
              className="w-full mt-1 border-2 border-gray-200 focus:border-yellow-400 rounded-xl p-3 outline-none"
              placeholder="you@example.com" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-600">Password</label>
            <input type="password" value={form.password} onChange={(e) => set("password", e.target.value)}
              className="w-full mt-1 border-2 border-gray-200 focus:border-yellow-400 rounded-xl p-3 outline-none"
              placeholder="••••••••" />
          </div>
          <button onClick={handleLogin} disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-xl text-lg transition-all disabled:opacity-60">
            {loading ? "Logging in..." : "Login →"}
          </button>
          <p className="text-center text-sm text-gray-500">
            New here? <Link to="/register" className="text-yellow-600 font-semibold">Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
