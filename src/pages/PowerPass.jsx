import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const PLANS = [
  { id: "daily", label: "Daily Pass", price: 29, rides: 3, saving: "Save ₹40/day", color: "from-blue-500 to-blue-600" },
  { id: "weekly", label: "Weekly Pass", price: 149, rides: 21, saving: "Save ₹200/week", color: "from-yellow-500 to-orange-500", popular: true },
  { id: "monthly", label: "Monthly Pass", price: 499, rides: 90, saving: "Save ₹800/month", color: "from-green-500 to-green-600" },
];

export default function PowerPass() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("weekly");
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(null);

  const buyPass = async () => {
    setLoading(true);
    try {
      const res = await API.post("/user/pass/buy", { plan: selected });
      setActive(res.data);
      alert("Power Pass activated ✅");
    } catch { alert("Purchase failed"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-yellow-500 px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-white text-xl font-bold">←</button>
        <h1 className="text-white font-black text-xl">⚡ Power Pass</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Hero */}
        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-3xl p-5 text-white text-center shadow-xl">
          <p className="text-4xl mb-2">⚡</p>
          <h2 className="font-black text-2xl">Ride More, Pay Less</h2>
          <p className="text-yellow-100 text-sm mt-1">Subscribe to Power Pass and save on every ride</p>
        </div>

        {/* Active Pass */}
        {active && (
          <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <span className="text-green-500 text-xl">✅</span>
              <div>
                <p className="font-black text-green-700">Active Pass: {active.plan}</p>
                <p className="text-green-600 text-xs">Expires: {new Date(active.expiry).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Plans */}
        <p className="font-black text-gray-800 text-lg">Choose Your Plan</p>
        <div className="space-y-3">
          {PLANS.map((p) => (
            <button key={p.id} onClick={() => setSelected(p.id)}
              className={`w-full rounded-2xl border-2 overflow-hidden transition-all ${selected === p.id ? "border-yellow-500 shadow-lg" : "border-gray-100"}`}>
              <div className={`bg-gradient-to-r ${p.color} p-3 flex items-center justify-between`}>
                <div className="text-left">
                  <p className="font-black text-white text-base">{p.label}</p>
                  <p className="text-white/80 text-xs">{p.rides} rides included</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-white text-2xl">₹{p.price}</p>
                  {p.popular && <span className="bg-white text-orange-500 text-xs font-black px-2 py-0.5 rounded-full">POPULAR</span>}
                </div>
              </div>
              <div className="bg-white px-4 py-2 flex items-center justify-between">
                <span className="text-green-600 font-bold text-sm">🎉 {p.saving}</span>
                {selected === p.id && <span className="text-yellow-500 font-black">✓ Selected</span>}
              </div>
            </button>
          ))}
        </div>

        {/* Benefits */}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
          <p className="font-bold text-gray-700">What's Included</p>
          {["Unlimited rides up to plan limit", "Priority captain matching", "No surge pricing", "Free cancellations"].map((b) => (
            <div key={b} className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-600 text-sm">{b}</span>
            </div>
          ))}
        </div>

        <button onClick={buyPass} disabled={loading}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-black py-4 rounded-2xl text-lg shadow-lg disabled:opacity-60">
          {loading ? "Processing..." : `Buy ${PLANS.find(p => p.id === selected)?.label} →`}
        </button>
      </div>
    </div>
  );
}
