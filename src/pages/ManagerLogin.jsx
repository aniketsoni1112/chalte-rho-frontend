import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";

export default function ManagerLogin() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const { data } = await API.post("/manager/login", form);
      login(data);
      navigate("/manager");
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">🛡️</span>
          </div>
          <h1 className="font-black text-2xl text-gray-900">Manager Login</h1>
          <p className="text-gray-400 text-sm">Captain Approval Portal</p>
        </div>

        {error && <p className="bg-red-50 text-red-600 text-sm font-semibold px-3 py-2 rounded-xl mb-4">{error}</p>}

        <form onSubmit={submit} className="space-y-3">
          <input type="email" placeholder="Manager Email" value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-900" required />
          <input type="password" placeholder="Password" value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-900" required />
          <button type="submit" disabled={loading}
            className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl text-base disabled:opacity-50">
            {loading ? "Logging in..." : "Login →"}
          </button>
        </form>
      </div>
    </div>
  );
}
