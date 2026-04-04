import { useNavigate } from "react-router-dom";

const NOTIFICATIONS = [
  { icon: "🎉", title: "50% Off on your next ride!", desc: "Use code RIDE50 before midnight.", time: "2 min ago", unread: true },
  { icon: "✅", title: "Ride Completed", desc: "Your ride to Palasia Square is complete. Fare: ₹65", time: "1 hr ago", unread: true },
  { icon: "⚡", title: "Power Pass Available", desc: "Save up to ₹800/month with Power Pass.", time: "3 hrs ago", unread: false },
  { icon: "🔔", title: "App Update Available", desc: "New features added. Update now for best experience.", time: "Yesterday", unread: false },
  { icon: "🎁", title: "Refer & Earn", desc: "Invite friends and earn ₹50 per referral.", time: "2 days ago", unread: false },
];

export default function Notifications() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-yellow-500 px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-white text-xl font-bold">←</button>
        <h1 className="text-white font-black text-xl">Notifications</h1>
      </div>
      <div className="p-4 space-y-2">
        {NOTIFICATIONS.map((n, i) => (
          <div key={i} className={`bg-white rounded-2xl p-4 shadow-sm flex items-start gap-3 ${n.unread ? "border-l-4 border-yellow-500" : ""}`}>
            <span className="text-2xl">{n.icon}</span>
            <div className="flex-1">
              <p className="font-bold text-gray-800 text-sm">{n.title}</p>
              <p className="text-gray-500 text-xs mt-0.5">{n.desc}</p>
              <p className="text-gray-400 text-xs mt-1">{n.time}</p>
            </div>
            {n.unread && <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1" />}
          </div>
        ))}
      </div>
    </div>
  );
}
