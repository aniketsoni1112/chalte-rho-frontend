import { useNavigate } from "react-router-dom";

const REWARDS = [
  { title: "Complete 10 rides today", bonus: "₹200", progress: 8, target: 10, expires: "Today 11:59 PM", color: "bg-yellow-500" },
  { title: "Complete 50 rides this week", bonus: "₹500", progress: 32, target: 50, expires: "Sun 11:59 PM", color: "bg-green-500" },
  { title: "Maintain 4.5+ rating for 7 days", bonus: "₹300", progress: 5, target: 7, expires: "Ongoing", color: "bg-blue-500" },
];

export default function CaptainRewards() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-900 px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-white text-xl font-bold">←</button>
        <h1 className="text-white font-black text-xl">🎁 Rewards & Incentives</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Total Earned */}
        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-3xl p-5 text-white text-center shadow-xl">
          <p className="text-yellow-100 text-sm">Total Incentives Earned</p>
          <p className="font-black text-4xl mt-1">₹1,250</p>
          <p className="text-yellow-100 text-xs mt-1">This month</p>
        </div>

        {/* Active Challenges */}
        <p className="font-black text-gray-800">Active Challenges</p>
        {REWARDS.map((r, i) => {
          const pct = Math.min((r.progress / r.target) * 100, 100);
          return (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-bold text-gray-800 text-sm">{r.title}</p>
                  <p className="text-gray-400 text-xs mt-0.5">Expires: {r.expires}</p>
                </div>
                <div className={`${r.color} text-white font-black text-sm px-3 py-1 rounded-full ml-2`}>{r.bonus}</div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{r.progress}/{r.target} completed</span>
                  <span>{Math.round(pct)}%</span>
                </div>
                <div className="bg-gray-100 rounded-full h-3">
                  <div className={`${r.color} h-3 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
              {pct >= 100
                ? <div className="bg-green-50 text-green-700 font-bold text-sm text-center py-2 rounded-xl">✅ Completed! Bonus credited.</div>
                : <p className="text-gray-500 text-xs">{r.target - r.progress} more rides to unlock bonus</p>
              }
            </div>
          );
        })}

        {/* Completed */}
        <p className="font-black text-gray-800">Completed Rewards</p>
        {[
          { title: "5 rides in a day", bonus: "₹100", date: "Yesterday" },
          { title: "Weekend special bonus", bonus: "₹250", date: "Last week" },
        ].map((r, i) => (
          <div key={i} className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-700 text-sm">{r.title}</p>
              <p className="text-gray-400 text-xs">{r.date}</p>
            </div>
            <span className="text-green-600 font-black text-sm">+{r.bonus} ✅</span>
          </div>
        ))}
      </div>
    </div>
  );
}
