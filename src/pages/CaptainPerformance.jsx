import { useNavigate } from "react-router-dom";

export default function CaptainPerformance() {
  const navigate = useNavigate();

  const stats = {
    rating: 4.8, totalRatings: 312,
    acceptance: 87, cancellation: 4,
    onlineHours: 6.5, completedToday: 8,
  };

  const reviews = [
    { name: "Rahul S.", rating: 5, comment: "Very punctual and polite driver!", time: "Today" },
    { name: "Priya M.", rating: 4, comment: "Good ride, clean vehicle.", time: "Yesterday" },
    { name: "Amit K.", rating: 5, comment: "Excellent! Reached on time.", time: "2 days ago" },
  ];

  const ratingBar = (label, pct, color) => (
    <div key={label} className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-6">{label}★</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400 w-6">{pct}%</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-900 px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-white text-xl font-bold">←</button>
        <h1 className="text-white font-black text-xl">⭐ Performance</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Rating Card */}
        <div className="bg-gray-900 rounded-3xl p-5 text-center text-white">
          <p className="text-6xl font-black text-yellow-400">{stats.rating}</p>
          <div className="flex justify-center gap-1 mt-2">
            {[1,2,3,4,5].map((s) => (
              <span key={s} className={`text-xl ${s <= Math.round(stats.rating) ? "text-yellow-400" : "text-gray-600"}`}>★</span>
            ))}
          </div>
          <p className="text-gray-400 text-sm mt-1">Based on {stats.totalRatings} ratings</p>
        </div>

        {/* Rating Breakdown */}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
          <p className="font-bold text-gray-700 mb-3">Rating Breakdown</p>
          {ratingBar(5, 72, "bg-green-500")}
          {ratingBar(4, 18, "bg-yellow-400")}
          {ratingBar(3, 6, "bg-orange-400")}
          {ratingBar(2, 2, "bg-red-400")}
          {ratingBar(1, 2, "bg-red-600")}
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Acceptance Rate", value: `${stats.acceptance}%`, icon: "✅", color: "bg-green-50 border-green-200", textColor: "text-green-600" },
            { label: "Cancellation Rate", value: `${stats.cancellation}%`, icon: "❌", color: "bg-red-50 border-red-200", textColor: "text-red-500" },
            { label: "Online Hours", value: `${stats.onlineHours}h`, icon: "⏱️", color: "bg-blue-50 border-blue-200", textColor: "text-blue-600" },
            { label: "Trips Today", value: stats.completedToday, icon: "🚀", color: "bg-yellow-50 border-yellow-200", textColor: "text-yellow-600" },
          ].map((m) => (
            <div key={m.label} className={`${m.color} border rounded-2xl p-4 text-center`}>
              <p className="text-2xl">{m.icon}</p>
              <p className={`font-black text-2xl ${m.textColor}`}>{m.value}</p>
              <p className="text-gray-500 text-xs mt-1">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Tips */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 space-y-2">
          <p className="font-bold text-yellow-700 text-sm">💡 Tips to improve rating</p>
          {["Always greet your rider politely", "Keep your vehicle clean", "Follow the app navigation route", "Avoid phone calls while driving"].map((t) => (
            <div key={t} className="flex items-center gap-2">
              <span className="text-yellow-500 text-xs">•</span>
              <span className="text-gray-600 text-xs">{t}</span>
            </div>
          ))}
        </div>

        {/* Recent Reviews */}
        <div className="space-y-2">
          <p className="font-bold text-gray-700">Recent Reviews</p>
          {reviews.map((r, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <p className="font-bold text-gray-800 text-sm">{r.name}</p>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((s) => (
                    <span key={s} className={`text-xs ${s <= r.rating ? "text-yellow-400" : "text-gray-200"}`}>★</span>
                  ))}
                </div>
              </div>
              <p className="text-gray-500 text-sm">{r.comment}</p>
              <p className="text-gray-400 text-xs mt-1">{r.time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
