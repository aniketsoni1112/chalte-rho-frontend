import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function RideHistory() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/rides/history").then((r) => { setRides(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const statusColor = { completed: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-700", ongoing: "bg-blue-100 text-blue-700" };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-yellow-500 px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-white text-xl">←</button>
        <h1 className="text-white font-black text-xl">Ride History</h1>
      </div>

      <div className="p-4 space-y-3">
        {loading && <p className="text-center text-gray-400 py-10">Loading...</p>}
        {!loading && rides.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🏍️</div>
            <p className="text-gray-500 font-semibold">No rides yet</p>
          </div>
        )}
        {rides.map((r) => (
          <div key={r._id} className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="text-green-500">●</span>
                  <span>{r.pickup?.lat?.toFixed(3)}, {r.pickup?.lng?.toFixed(3)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="text-red-500">●</span>
                  <span>{r.destination?.address || `${r.destination?.lat?.toFixed(3)}, ${r.destination?.lng?.toFixed(3)}`}</span>
                </div>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColor[r.status] || "bg-gray-100 text-gray-600"}`}>
                {r.status}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>{r.vehicle === "bike" ? "🏍️" : r.vehicle === "auto" ? "🛺" : "🚗"} {r.vehicle}</span>
                <span>💳 {r.paymentMethod}</span>
                {r.userRating && <span>⭐ {r.userRating}</span>}
              </div>
              <span className="font-black text-yellow-600 text-lg">₹{r.fare}</span>
            </div>
            <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
