import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function CaptainEarnings() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("today");
  const [data, setData] = useState({ today: 0, weekly: 0, monthly: 0, cash: 0, online: 0, trips: 0 });
  const [upi, setUpi] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get("/rides/history").then((r) => {
      const rides = r.data || [];
      const today = new Date().toDateString();
      const todayEarnings = rides.filter(r => new Date(r.createdAt).toDateString() === today).reduce((s, r) => s + (r.fare || 0), 0);
      const weeklyEarnings = rides.filter(r => (Date.now() - new Date(r.createdAt)) < 7 * 86400000).reduce((s, r) => s + (r.fare || 0), 0);
      const monthlyEarnings = rides.filter(r => (Date.now() - new Date(r.createdAt)) < 30 * 86400000).reduce((s, r) => s + (r.fare || 0), 0);
      const cash = rides.filter(r => r.paymentMethod === "cash").reduce((s, r) => s + (r.fare || 0), 0);
      const online = rides.filter(r => r.paymentMethod !== "cash").reduce((s, r) => s + (r.fare || 0), 0);
      setData({ today: todayEarnings, weekly: weeklyEarnings, monthly: monthlyEarnings, cash, online, trips: rides.length });
    }).catch(() => {});
  }, []);

  const redeem = async () => {
    if (!upi) return alert("Enter UPI ID");
    setLoading(true);
    try {
      await API.post("/captain/redeem", { upi, amount: data.online });
      alert("Redemption request submitted ✅");
      setUpi("");
    } catch { alert("Failed to submit"); }
    setLoading(false);
  };

  const TABS = ["today", "weekly", "monthly", "redeem"];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-900 px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-white text-xl font-bold">←</button>
        <h1 className="text-white font-black text-xl">💰 Earnings</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 p-4">
        {[
          { label: "Today", value: `₹${data.today}`, color: "bg-yellow-500" },
          { label: "Weekly", value: `₹${data.weekly}`, color: "bg-green-500" },
          { label: "Trips", value: data.trips, color: "bg-blue-500" },
        ].map((s) => (
          <div key={s.label} className={`${s.color} rounded-2xl p-3 text-center text-white shadow`}>
            <p className="font-black text-xl">{s.value}</p>
            <p className="text-white/80 text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mx-4 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${tab === t ? "bg-gray-900 text-white" : "bg-white text-gray-500"}`}>
            {t === "today" ? "📅 Today" : t === "weekly" ? "📊 Weekly" : t === "monthly" ? "📈 Monthly" : "💸 Redeem"}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3">
        {/* Today / Weekly / Monthly */}
        {["today", "weekly", "monthly"].includes(tab) && (
          <>
            <div className="bg-gray-900 rounded-2xl p-5 text-center">
              <p className="text-gray-400 text-xs uppercase">{tab} Earnings</p>
              <p className="font-black text-4xl text-yellow-400 mt-1">₹{data[tab]}</p>
            </div>
            <div className="space-y-2">
              {[
                { label: "Cash Collected", value: `₹${data.cash}`, icon: "💵", note: "Collected from riders" },
                { label: "Online Earned", value: `₹${data.online}`, icon: "📱", note: "In Rapido wallet" },
                { label: "Base Fare", value: `₹${Math.round(data[tab] * 0.75)}`, icon: "🏍️", note: "" },
                { label: "Incentives", value: `₹${Math.round(data[tab] * 0.15)}`, icon: "🎁", note: "" },
                { label: "Commission (10%)", value: `-₹${Math.round(data[tab] * 0.1)}`, icon: "📋", note: "" },
              ].map((r) => (
                <div key={r.label} className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{r.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{r.label}</p>
                      {r.note && <p className="text-gray-400 text-xs">{r.note}</p>}
                    </div>
                  </div>
                  <span className={`font-black text-sm ${r.value.startsWith("-") ? "text-red-500" : "text-gray-800"}`}>{r.value}</span>
                </div>
              ))}
            </div>
            <div className="bg-yellow-500 rounded-2xl p-4 flex justify-between items-center">
              <span className="text-white font-bold">Net Payout</span>
              <span className="text-white font-black text-2xl">₹{Math.round(data[tab] * 0.9)}</span>
            </div>
          </>
        )}

        {/* Redeem */}
        {tab === "redeem" && (
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
              <p className="text-gray-500 text-sm">Available to Redeem</p>
              <p className="font-black text-3xl text-green-600">₹{data.online}</p>
              <p className="text-gray-400 text-xs mt-1">Online payments in your Rapido wallet</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <p className="font-bold text-gray-700">Withdraw to UPI / Bank</p>
              <input value={upi} onChange={(e) => setUpi(e.target.value)}
                className="w-full border-2 border-gray-200 focus:border-yellow-400 rounded-xl p-3 outline-none text-sm"
                placeholder="Enter UPI ID (e.g. name@upi)" />
              <button onClick={redeem} disabled={loading}
                className="w-full bg-green-500 text-white font-black py-4 rounded-2xl text-lg disabled:opacity-60">
                {loading ? "Processing..." : "Withdraw Now →"}
              </button>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="font-bold text-gray-700 text-sm mb-2">Cash Due to Rapido</p>
              <div className="flex justify-between items-center">
                <p className="text-gray-500 text-sm">Cash collected from riders</p>
                <p className="font-black text-red-500">₹{Math.round(data.cash * 0.1)}</p>
              </div>
              <p className="text-gray-400 text-xs mt-2">Pay this amount at the nearest Rapido collection point.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
