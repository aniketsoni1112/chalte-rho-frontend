import { useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";

export default function Payment() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { state } = useLocation(); // { ride }
  const ride = state?.ride;
  const [method, setMethod] = useState("cash");
  const [loading, setLoading] = useState(false);

  const methods = [
    { id: "cash", label: "Cash", icon: "💵", desc: "Pay directly to captain" },
    { id: "wallet", label: "Wallet", icon: "👛", desc: `Balance: ₹${user?.wallet || 0}` },
    { id: "upi", label: "UPI", icon: "📱", desc: "Pay via UPI app" },
  ];

  const handlePay = async () => {
    if (!ride) return navigate("/");
    setLoading(true);
    try {
      await API.post(`/rides/complete/${ride._id}`, { paymentMethod: method });
      alert("Payment successful ✅");
      navigate("/history");
    } catch (err) {
      alert(err.response?.data?.msg || "Payment failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-yellow-500 px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-white text-xl">←</button>
        <h1 className="text-white font-black text-xl">Payment</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Fare summary */}
        <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
          <p className="text-gray-500 text-sm">Total Fare</p>
          <p className="font-black text-4xl text-yellow-600 mt-1">₹{ride?.fare || 0}</p>
          <p className="text-gray-400 text-xs mt-1">{ride?.vehicle} • {new Date(ride?.createdAt).toLocaleString()}</p>
        </div>

        {/* Payment methods */}
        <div className="space-y-2">
          <p className="font-bold text-gray-700 px-1">Choose Payment Method</p>
          {methods.map((m) => (
            <button key={m.id} onClick={() => setMethod(m.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${method === m.id ? "border-yellow-500 bg-yellow-50" : "border-gray-100 bg-white"}`}>
              <span className="text-3xl">{m.icon}</span>
              <div className="text-left">
                <p className="font-bold text-gray-800">{m.label}</p>
                <p className="text-gray-500 text-sm">{m.desc}</p>
              </div>
              {method === m.id && <span className="ml-auto text-yellow-500 text-xl">✓</span>}
            </button>
          ))}
        </div>

        <button onClick={handlePay} disabled={loading}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-black py-4 rounded-2xl text-lg shadow-lg shadow-yellow-200 disabled:opacity-60">
          {loading ? "Processing..." : `Pay ₹${ride?.fare || 0} →`}
        </button>
      </div>
    </div>
  );
}
