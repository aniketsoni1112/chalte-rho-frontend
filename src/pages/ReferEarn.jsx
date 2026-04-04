import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ReferEarn() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const code = "RIDE" + (user?.name?.slice(0, 4).toUpperCase() || "USER");

  const copy = () => { navigator.clipboard.writeText(code); alert("Code copied! ✅"); };
  const share = () => { if (navigator.share) navigator.share({ title: "Join chalte rho!", text: `Use my code ${code} and get ₹50 off your first ride!` }); };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-yellow-500 px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-white text-xl font-bold">←</button>
        <h1 className="text-white font-black text-xl">Refer & Earn</h1>
      </div>
      <div className="p-4 space-y-4">
        {/* Hero */}
        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-3xl p-6 text-center text-white shadow-xl">
          <p className="text-5xl mb-2">🎁</p>
          <h2 className="font-black text-2xl">Invite Friends</h2>
          <p className="text-yellow-100 text-sm mt-1">You earn ₹50 • Friend gets ₹50 off first ride</p>
        </div>

        {/* Referral Code */}
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center space-y-3">
          <p className="text-gray-500 text-sm font-semibold">Your Referral Code</p>
          <div className="bg-yellow-50 border-2 border-dashed border-yellow-400 rounded-2xl py-4">
            <p className="font-black text-3xl text-yellow-600 tracking-widest">{code}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={copy} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl text-sm">📋 Copy Code</button>
            <button onClick={share} className="flex-1 bg-yellow-500 text-white font-bold py-3 rounded-xl text-sm">📤 Share</button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Referred", value: "3", icon: "👥" },
            { label: "Earned", value: "₹150", icon: "💰" },
            { label: "Pending", value: "₹50", icon: "⏳" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-3 text-center shadow-sm">
              <p className="text-2xl">{s.icon}</p>
              <p className="font-black text-gray-800 text-lg">{s.value}</p>
              <p className="text-gray-400 text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <p className="font-bold text-gray-700">How it works</p>
          {[
            { step: "1", text: "Share your referral code with friends" },
            { step: "2", text: "Friend signs up & completes first ride" },
            { step: "3", text: "Both of you get ₹50 in wallet" },
          ].map((s) => (
            <div key={s.step} className="flex items-center gap-3">
              <div className="w-7 h-7 bg-yellow-500 rounded-full flex items-center justify-center text-white font-black text-sm">{s.step}</div>
              <p className="text-gray-600 text-sm">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
