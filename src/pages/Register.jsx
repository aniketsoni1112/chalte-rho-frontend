import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user", vehicle: "bike", vehicleNumber: "", rcCardNumber: "", licenseNumber: "" });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) return alert("Fill all fields");
    if (form.role === "driver") {
      if (!form.vehicleNumber) return alert("Enter vehicle number");
      if (!form.licenseNumber) return alert("Enter license number");
      if (!form.rcCardNumber) return alert("Enter RC card number");
    }
    setLoading(true);
    try {
      await API.post("/auth/register", form);
      alert("Registered successfully ✅");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.msg || err.message || "Registration failed ❌");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-400 to-yellow-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-yellow-500 px-6 py-6 text-center">
          <div className="text-4xl mb-1">🚀</div>
          <h1 className="text-2xl font-black text-white">Create Account</h1>
          <p className="text-yellow-100 text-sm mt-1">Join chalte rho today</p>
        </div>

        <div className="p-6 space-y-4">
          {/* Role Toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            {["user", "driver"].map((r) => (
              <button key={r} onClick={() => set("role", r)}
                className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${form.role === r ? "bg-yellow-500 text-white shadow" : "text-gray-500"}`}>
                {r === "user" ? "👤 Rider" : "🏍️ Captain"}
              </button>
            ))}
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-600">Full Name</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)}
              className="w-full mt-1 border-2 border-gray-200 focus:border-yellow-400 rounded-xl p-3 outline-none"
              placeholder="Your full name" />
          </div>
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

          {/* Captain-only document fields */}
          {form.role === "driver" && (
            <div className="space-y-3 bg-yellow-50 rounded-2xl p-4 border border-yellow-200">
              <p className="text-sm font-black text-yellow-700">🏍️ Captain Documents</p>
              <div className="flex gap-2">
                {["bike", "auto", "cab"].map(v => (
                  <button key={v} type="button" onClick={() => set("vehicle", v)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                      form.vehicle === v ? "bg-yellow-500 text-white" : "bg-white border-2 border-gray-200 text-gray-500"
                    }`}>{v === "bike" ? "🏍️" : v === "auto" ? "🛺" : "🚗"} {v}</button>
                ))}
              </div>
              <input value={form.vehicleNumber} onChange={e => set("vehicleNumber", e.target.value)}
                className="w-full border-2 border-gray-200 focus:border-yellow-400 rounded-xl p-3 outline-none text-sm"
                placeholder="Vehicle Number (e.g. MP09AB1234)" />
              <input value={form.rcCardNumber} onChange={e => set("rcCardNumber", e.target.value)}
                className="w-full border-2 border-gray-200 focus:border-yellow-400 rounded-xl p-3 outline-none text-sm"
                placeholder="RC Card Number" />
              <input value={form.licenseNumber} onChange={e => set("licenseNumber", e.target.value)}
                className="w-full border-2 border-gray-200 focus:border-yellow-400 rounded-xl p-3 outline-none text-sm"
                placeholder="Driving License Number" />
              <p className="text-xs text-yellow-600">⏳ Your account will be reviewed by a Manager before activation.</p>
            </div>
          )}

          <button onClick={handleRegister} disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-xl text-lg transition-all disabled:opacity-60">
            {loading ? "Creating..." : "Create Account 🚀"}
          </button>
          <p className="text-center text-sm text-gray-500">
            Already have an account? <Link to="/login" className="text-yellow-600 font-semibold">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
