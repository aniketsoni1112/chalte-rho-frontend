import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";

export default function Wallet() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tab, setTab] = useState("wallet");
  const [amount, setAmount] = useState("");
  const [upi, setUpi] = useState("");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(user?.wallet || 0);

  const addMoney = async () => {
    if (!amount || amount < 1) return alert("Enter valid amount");
    setLoading(true);
    try {
      const res = await API.post("/user/wallet/add", { amount: Number(amount) });
      setBalance(res.data.wallet);
      setAmount("");
      alert("₹" + amount + " added to wallet ✅");
    } catch { alert("Failed to add money"); }
    setLoading(false);
  };

  const addUpi = async () => {
    if (!upi) return alert("Enter UPI ID");
    setLoading(true);
    try {
      await API.post("/user/payment/upi", { upi });
      setUpi("");
      alert("UPI ID saved ✅");
    } catch { alert("Failed to save UPI"); }
    setLoading(false);
  };

  const QUICK = [50, 100, 200, 500];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-yellow-500 px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-white text-xl font-bold">←</button>
        <h1 className="text-white font-black text-xl">Payment & Wallet</h1>
      </div>

      {/* Balance Card */}
      <div className="mx-4 mt-4 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-3xl p-5 text-white shadow-xl">
        <p className="text-yellow-100 text-sm">Rapido Wallet Balance</p>
        <p className="font-black text-4xl mt-1">₹{balance}</p>
        <p className="text-yellow-100 text-xs mt-2">Use for rides, passes & more</p>
      </div>

      {/* Tabs */}
      <div className="flex mx-4 mt-4 bg-white rounded-2xl p-1 shadow-sm">
        {["wallet", "upi", "cards"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-bold capitalize transition-all ${tab === t ? "bg-yellow-500 text-white shadow" : "text-gray-400"}`}>
            {t === "wallet" ? "💰 Wallet" : t === "upi" ? "📱 UPI" : "💳 Cards"}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3">
        {/* Wallet Tab */}
        {tab === "wallet" && (
          <>
            <p className="font-bold text-gray-700">Add Money</p>
            <div className="flex gap-2">
              {QUICK.map((q) => (
                <button key={q} onClick={() => setAmount(String(q))}
                  className={`flex-1 py-2 rounded-xl border-2 text-sm font-bold transition-all ${amount === String(q) ? "border-yellow-500 bg-yellow-50 text-yellow-700" : "border-gray-100 text-gray-500 bg-white"}`}>
                  ₹{q}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                className="flex-1 border-2 border-gray-200 focus:border-yellow-400 rounded-xl p-3 outline-none font-semibold"
                placeholder="Enter amount" />
              <button onClick={addMoney} disabled={loading}
                className="bg-yellow-500 text-white font-black px-5 rounded-xl disabled:opacity-60">
                {loading ? "..." : "Add"}
              </button>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
              <p className="font-bold text-gray-700 text-sm">Transaction History</p>
              {[
                { label: "Ride Payment", amount: "-₹65", date: "Today", color: "text-red-500" },
                { label: "Wallet Recharge", amount: "+₹200", date: "Yesterday", color: "text-green-600" },
                { label: "Ride Payment", amount: "-₹45", date: "2 days ago", color: "text-red-500" },
              ].map((t, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{t.label}</p>
                    <p className="text-gray-400 text-xs">{t.date}</p>
                  </div>
                  <span className={`font-black text-sm ${t.color}`}>{t.amount}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* UPI Tab */}
        {tab === "upi" && (
          <>
            <p className="font-bold text-gray-700">Add UPI ID</p>
            <div className="flex gap-2">
              <input value={upi} onChange={(e) => setUpi(e.target.value)}
                className="flex-1 border-2 border-gray-200 focus:border-yellow-400 rounded-xl p-3 outline-none font-semibold"
                placeholder="yourname@upi" />
              <button onClick={addUpi} disabled={loading}
                className="bg-yellow-500 text-white font-black px-5 rounded-xl disabled:opacity-60">
                {loading ? "..." : "Save"}
              </button>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="font-bold text-gray-700 text-sm mb-3">Saved UPI IDs</p>
              {["user@okaxis", "user@paytm"].map((u, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📱</span>
                    <span className="font-semibold text-gray-700 text-sm">{u}</span>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-1 rounded-full">Active</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Cards Tab */}
        {tab === "cards" && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center py-8">
              <p className="text-4xl mb-2">💳</p>
              <p className="font-bold text-gray-700">No cards linked yet</p>
              <p className="text-gray-400 text-sm mt-1">Add a debit/credit card for faster payments</p>
              <button className="mt-4 bg-yellow-500 text-white font-bold px-6 py-2 rounded-xl">+ Add Card</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
