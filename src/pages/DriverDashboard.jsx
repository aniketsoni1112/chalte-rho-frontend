import { useState, useEffect, useContext, useRef } from "react";
import API from "../services/api";
import socket from "../context/SocketContext";
import { AuthContext } from "../context/AuthContext";
import LiveMap from "../components/LiveMap";
import { useNavigate } from "react-router-dom";

const getUserId = (user) => {
  if (!user) return null;
  const raw = user._id || user.id;
  if (!raw) return null;
  if (typeof raw === "object" && raw.$oid) return raw.$oid;
  return String(raw);
};

const PHASES = { IDLE: "idle", REQUEST: "request", ACCEPTED: "accepted", TRANSIT: "transit", DONE: "done" };

export default function DriverDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [online, setOnline] = useState(false);
  const [location, setLocation] = useState({ lat: 22.719, lng: 75.857 });
  const [phase, setPhase] = useState(PHASES.IDLE);
  const [activeRide, setActiveRide] = useState(null);
  const [otp, setOtp] = useState("");
  const [earnings, setEarnings] = useState({ today: 0, wallet: 0, trips: 0, weekly: 0 });
  const [rating, setRating] = useState(0);
  const [timer, setTimer] = useState(20);
  const [drawer, setDrawer] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [tab, setTab] = useState("home");
  const [cancelPopup, setCancelPopup] = useState(false); // home | earnings

  // GPS ping when online
  useEffect(() => {
    if (!online) return;
    const id = setInterval(() => {
      navigator.geolocation.getCurrentPosition((pos) => {
        const loc = { id: getUserId(user), lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        socket.emit("location_update", loc);
      }, () => {});
    }, 5000);
    return () => clearInterval(id);
  }, [online, user]);

  const onlineRef = useRef(online);
  useEffect(() => { onlineRef.current = online; }, [online]);

  // Socket events — registered ONCE per userId, never torn down on online toggle
  useEffect(() => {
    const captainId = getUserId(user);
    if (!captainId) return;

    // Re-register on every reconnect
    const registerRoom = () =>
      socket.emit("register", { userId: captainId, role: "driver" });
    socket.on("connect", registerRoom);

    const onNewRide = (ride) => {
      if (!onlineRef.current) return;
      setActiveRide(ride);
      setPhase(PHASES.REQUEST);
      setTimer(20);
    };
    const onRideAssigned = (data) => {
      setActiveRide((prev) => ({ ...prev, ...data }));
      setPhase(PHASES.ACCEPTED);
    };
    const onRideStartedConfirm = () => setPhase(PHASES.TRANSIT);
    const onRideCompleted = (ride) => {
      const uid = getUserId(user);
      if (ride.driver === uid || ride.driver?._id === uid) {
        setEarnings((p) => ({ ...p, today: p.today + ride.fare, wallet: p.wallet + ride.fare, trips: p.trips + 1, weekly: p.weekly + ride.fare }));
        setPhase(PHASES.DONE);
        setActiveRide((prev) => ({ ...prev, ...ride }));
      }
    };
    const onRideCancelled = () => {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "square";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(440, ctx.currentTime + 0.2);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.6);
      } catch {}
      setCancelPopup(true);
      setTimeout(() => { setCancelPopup(false); setPhase(PHASES.IDLE); setActiveRide(null); setOtp(""); setTimer(20); }, 4000);
    };

    socket.on("new_ride", onNewRide);
    socket.on("ride_assigned", onRideAssigned);
    socket.on("ride_started_confirm", onRideStartedConfirm);
    socket.on("ride_completed", onRideCompleted);
    socket.on("ride_cancelled", onRideCancelled);

    return () => {
      socket.off("connect", registerRoom);
      socket.off("new_ride", onNewRide);
      socket.off("ride_assigned", onRideAssigned);
      socket.off("ride_started_confirm", onRideStartedConfirm);
      socket.off("ride_completed", onRideCompleted);
      socket.off("ride_cancelled", onRideCancelled);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getUserId(user)]);

  // Auto-decline countdown
  useEffect(() => {
    if (phase !== PHASES.REQUEST) return;
    if (timer === 0) { setPhase(PHASES.IDLE); setActiveRide(null); return; }
    const t = setTimeout(() => setTimer((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timer]);

  const acceptRide = async () => {
    try {
      const res = await API.post(`/rides/accept/${activeRide._id}`);
      setActiveRide(res.data);
      setPhase(PHASES.ACCEPTED);
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to accept ride");
    }
  };

  const markArrived = async () => {
    try { await API.post(`/rides/arrived/${activeRide._id}`); } catch {}
    // notify user captain has arrived
  };

  const startRide = async () => {
    if (!otp || otp.length < 4) return alert("Enter 4-digit OTP");
    try {
      const res = await API.post(`/rides/verify-otp/${activeRide._id}`, { otp });
      if (res.data) {
        setActiveRide((prev) => ({ ...prev, ...res.data }));
        setPhase(PHASES.TRANSIT);
      }
    } catch (err) {
      alert(err.response?.data?.msg || "Invalid OTP ❌ Try again");
    }
  };

  const completeRide = async () => {
    try { const res = await API.post(`/rides/complete/${activeRide._id}`); setActiveRide(res.data); } catch {}
    setPhase(PHASES.DONE);
    setEarnings((p) => ({ ...p, today: p.today + (activeRide?.fare || 0), wallet: p.wallet + (activeRide?.fare || 0), trips: p.trips + 1 }));
  };

  const submitRating = async () => {
    try { await API.post(`/rides/${activeRide?._id}/rate`, { rating, by: "driver" }); } catch {}
    setPhase(PHASES.IDLE); setActiveRide(null); setOtp(""); setRating(0);
  };

  const timerPct = (timer / 20) * 100;
  const timerColor = timer <= 5 ? "#ef4444" : timer <= 10 ? "#f97316" : "#22c55e";

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-900 relative">

      {/* ── RIDE CANCELLED POPUP ── */}
      {cancelPopup && (
        <div className="fixed inset-0 z-[1002] flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-3xl p-6 mx-6 shadow-2xl text-center space-y-4 animate-bounce">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-4xl">🚫</span>
            </div>
            <h2 className="font-black text-xl text-gray-800">Ride Cancelled!</h2>
            <p className="text-gray-500 text-sm">The rider has cancelled this trip.</p>
            <div className="bg-gray-50 rounded-2xl p-3">
              <p className="text-gray-400 text-xs">Navigation stopped</p>
              <p className="font-bold text-gray-700 text-sm mt-1">Returning to Online status...</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-red-500 h-1.5 rounded-full animate-[shrink_4s_linear_forwards]"
                style={{ animation: "width 4s linear forwards", width: "100%" }} />
            </div>
            <button onClick={() => {
                setCancelPopup(false);
                setPhase(PHASES.IDLE);
                setActiveRide(null);
                setOtp("");
              }}
              className="w-full bg-yellow-500 text-white font-black py-3 rounded-2xl">
              OK, Find Next Ride
            </button>
          </div>
        </div>
      )}

      {/* ── NAVIGATION DRAWER ── */}
      {drawer && (
        <div className="fixed inset-0 z-[1001] flex">
          <div className="bg-white w-72 h-full shadow-2xl flex flex-col overflow-y-auto">
            {/* Profile Header */}
            <div className="bg-gray-900 p-6 pt-10">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-lg">
                  {user?.name?.[0] || "C"}
                </div>
                <div>
                  <p className="font-black text-white text-lg">{user?.name || "Captain"}</p>
                  <p className="text-gray-400 text-xs">{user?.email || user?.phone}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[1,2,3,4,5].map((s) => (
                      <span key={s} className="text-yellow-400 text-xs">★</span>
                    ))}
                    <span className="text-gray-400 text-xs ml-1">4.8 • 312 trips</span>
                  </div>
                </div>
              </div>
              {/* Status badge */}
              <div className={`mt-4 flex items-center gap-2 px-3 py-2 rounded-xl ${online ? "bg-green-900" : "bg-gray-800"}`}>
                <div className={`w-2 h-2 rounded-full ${online ? "bg-green-400 animate-pulse" : "bg-gray-500"}`} />
                <span className={`text-sm font-bold ${online ? "text-green-400" : "text-gray-400"}`}>
                  {online ? "You are Online" : "You are Offline"}
                </span>
              </div>
            </div>

            {/* Wallet */}
            <div className="mx-4 mt-4 bg-yellow-50 rounded-2xl p-3 flex items-center justify-between border border-yellow-200">
              <div>
                <p className="text-xs text-gray-500">Rapido Wallet</p>
                <p className="font-black text-yellow-600 text-xl">₹{earnings.wallet}</p>
              </div>
              <button className="bg-yellow-500 text-white text-xs font-bold px-3 py-2 rounded-xl">Withdraw</button>
            </div>

            {/* Menu */}
            <div className="flex-1 p-4 space-y-1">
              {[
                { icon: "💰", label: "Earnings", action: () => { navigate("/captain/earnings"); setDrawer(false); } },
                { icon: "🕒", label: "Ride History", action: () => { navigate("/history"); setDrawer(false); } },
                { icon: "⭐", label: "Performance & Ratings", action: () => { navigate("/captain/performance"); setDrawer(false); } },
                { icon: "🎁", label: "Rewards & Incentives", action: () => { navigate("/captain/rewards"); setDrawer(false); } },
                { icon: "🛡️", label: "Insurance & Safety", action: () => setDrawer(false) },
                { icon: "❓", label: "Help & Support", action: () => { navigate("/captain/support"); setDrawer(false); } },
                { icon: "⚙️", label: "Settings", action: () => { navigate("/captain/settings"); setDrawer(false); } },
              ].map((item) => (
                <button key={item.label} onClick={item.action}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-all text-left">
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-semibold text-gray-700">{item.label}</span>
                  <span className="ml-auto text-gray-300">›</span>
                </button>
              ))}
            </div>
            <div className="p-4 border-t">
              <button onClick={logout} className="w-full text-red-500 font-bold py-2 text-sm">🚪 Logout</button>
            </div>
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setDrawer(false)} />
        </div>
      )}

      {/* ── TOP HEADER ── */}
      <div className={`flex items-center justify-between px-4 py-3 z-10 transition-all ${online ? "bg-green-600" : "bg-gray-900"}`}>
        <div className="flex items-center gap-3">
          <button onClick={() => setDrawer(true)} className="flex flex-col gap-1 p-1">
            <div className="w-5 h-0.5 bg-white rounded" />
            <div className="w-5 h-0.5 bg-white rounded" />
            <div className="w-5 h-0.5 bg-white rounded" />
          </button>
          <div>
            <p className="font-black text-white text-base">🏍️ {user?.name || "Captain"}</p>
            <p className={`text-xs font-semibold ${online ? "text-green-200" : "text-gray-400"}`}>
              {online ? "● Online — Ready for rides" : "○ Offline"}
            </p>
          </div>
        </div>
        {/* Online Toggle */}
        <button onClick={() => {
            const captainId = user?._id || user?.id;
            const newOnline = !online;
            setOnline(newOnline);
            if (newOnline) {
              navigator.geolocation.getCurrentPosition((pos) => {
                socket.emit("captain_online", { captainId, lat: pos.coords.latitude, lng: pos.coords.longitude, vehicle: user?.vehicle || "bike" });
              }, () => socket.emit("captain_online", { captainId, lat: location.lat, lng: location.lng, vehicle: "bike" }));
            } else {
              socket.emit("captain_offline", { captainId });
            }
          }}
          className={`relative w-14 h-7 rounded-full transition-all duration-300 ${online ? "bg-white" : "bg-gray-600"}`}>
          <div className={`absolute top-0.5 w-6 h-6 rounded-full shadow-md transition-all duration-300 ${online ? "left-7 bg-green-500" : "left-0.5 bg-gray-400"}`} />
        </button>
      </div>

      {/* ── QUICK STATS BAR ── */}
      <div className={`flex items-center justify-around px-4 py-2 ${online ? "bg-green-700" : "bg-gray-800"}`}>
        {[
          { label: "Today", value: `₹${earnings.today}`, icon: "💰" },
          { label: "Trips", value: earnings.trips, icon: "🚀" },
          { label: "Rating", value: "4.8 ⭐", icon: "" },
          { label: "Weekly", value: `₹${earnings.weekly}`, icon: "📈" },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-white font-black text-sm">{s.value}</p>
            <p className="text-gray-300 text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── MAP ── */}
      <div className="flex-1 relative">
        <div className={`absolute inset-0 transition-all duration-500 ${online ? "opacity-100" : "opacity-70 grayscale"}`} style={{ zIndex: 0 }}>
          <LiveMap position={location} showHeatmap={showHeatmap} online={online} />
        </div>

        {/* Heatmap toggle */}
        <button onClick={() => setShowHeatmap((p) => !p)}
          className={`absolute top-3 left-3 z-[999] px-3 py-1.5 rounded-full text-xs font-bold shadow-lg transition-all ${showHeatmap ? "bg-orange-500 text-white" : "bg-white text-gray-600"}`}>
          🔥 {showHeatmap ? "Heatmap ON" : "Heatmap OFF"}
        </button>

        {/* SOS Button */}
        <button className="absolute top-3 right-3 z-[999] bg-red-500 text-white font-black text-xs px-3 py-2 rounded-full shadow-xl animate-pulse">
          🆘 SOS
        </button>

        {/* Go Online/Offline floating button — only in IDLE */}
        {phase === PHASES.IDLE && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[999]">
            <button onClick={() => {
                const captainId = user?._id || user?.id;
                const newOnline = !online;
                setOnline(newOnline);
                if (newOnline) {
                  navigator.geolocation.getCurrentPosition((pos) => {
                    socket.emit("captain_online", { captainId, lat: pos.coords.latitude, lng: pos.coords.longitude, vehicle: "bike" });
                  }, () => socket.emit("captain_online", { captainId, lat: location.lat, lng: location.lng, vehicle: "bike" }));
                } else {
                  socket.emit("captain_offline", { captainId });
                }
              }}
              className={`px-8 py-3 rounded-full font-black text-base shadow-2xl transition-all ${
                online ? "bg-red-500 text-white shadow-red-400" : "bg-green-500 text-white shadow-green-400"
              }`}>
              {online ? "⏸ Go Offline" : "▶ Go Online"}
            </button>
          </div>
        )}

        {/* Geofence alert */}
        {online && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-[999] bg-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
            🔥 High demand zone nearby!
          </div>
        )}
      </div>

      {/* ── BOTTOM SHEET ── */}
      <div className="bg-white rounded-t-3xl shadow-2xl z-10">
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Tab switcher */}
        {phase === PHASES.IDLE && (
          <div className="flex mx-4 mb-3 bg-gray-100 rounded-xl p-1">
            {["home", "earnings"].map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize transition-all ${tab === t ? "bg-white shadow text-gray-800" : "text-gray-400"}`}>
                {t === "home" ? "🏠 Dashboard" : "💰 Earnings"}
              </button>
            ))}
          </div>
        )}

        {/* ── IDLE / HOME ── */}
        {phase === PHASES.IDLE && tab === "home" && (
          <div className="px-4 pb-5 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Earned", value: `₹${earnings.today}`, icon: "💰", color: "bg-yellow-50 border-yellow-200" },
                { label: "Trips", value: earnings.trips, icon: "🚀", color: "bg-blue-50 border-blue-200" },
                { label: "Wallet", value: `₹${earnings.wallet}`, icon: "👛", color: "bg-green-50 border-green-200" },
              ].map((e) => (
                <div key={e.label} className={`${e.color} border rounded-2xl p-3 text-center`}>
                  <div className="text-2xl">{e.icon}</div>
                  <div className="font-black text-gray-800 text-base">{e.value}</div>
                  <div className="text-gray-500 text-xs">{e.label}</div>
                </div>
              ))}
            </div>
            {!online
              ? <p className="text-center text-gray-400 text-sm py-2">Toggle switch to go online & receive rides</p>
              : <p className="text-center text-green-600 font-semibold text-sm py-2 animate-pulse">✅ Waiting for ride requests...</p>
            }
          </div>
        )}

        {/* ── IDLE / EARNINGS ── */}
        {phase === PHASES.IDLE && tab === "earnings" && (
          <div className="px-4 pb-5 space-y-3">
            <div className="bg-gray-900 rounded-2xl p-4 text-center">
              <p className="text-gray-400 text-xs">Weekly Earnings</p>
              <p className="font-black text-3xl text-yellow-400">₹{earnings.weekly}</p>
            </div>
            <div className="space-y-2">
              {[
                { label: "Base Fare", value: `₹${Math.round(earnings.today * 0.7)}` },
                { label: "Incentives", value: `₹${Math.round(earnings.today * 0.2)}` },
                { label: "Tips", value: `₹${Math.round(earnings.today * 0.1)}` },
                { label: "Commission (10%)", value: `-₹${Math.round(earnings.today * 0.1)}` },
              ].map((r) => (
                <div key={r.label} className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-3">
                  <span className="text-gray-600 text-sm font-semibold">{r.label}</span>
                  <span className={`font-black text-sm ${r.value.startsWith("-") ? "text-red-500" : "text-gray-800"}`}>{r.value}</span>
                </div>
              ))}
            </div>
            <div className="bg-yellow-500 rounded-2xl p-3 flex justify-between items-center">
              <span className="text-white font-bold">Net Payout</span>
              <span className="text-white font-black text-xl">₹{Math.round(earnings.today * 0.9)}</span>
            </div>
          </div>
        )}

        {/* ── RIDE REQUEST ── */}
        {phase === PHASES.REQUEST && activeRide && (
          <div className="px-4 pb-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-black text-gray-800 text-lg">🔔 New Ride Request!</h2>
                <p className="text-gray-400 text-xs">Respond quickly</p>
              </div>
              {/* Circular timer */}
              <div className="relative w-12 h-12">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                  <circle cx="24" cy="24" r="20" fill="none" stroke={timerColor} strokeWidth="4"
                    strokeDasharray={`${2 * Math.PI * 20}`}
                    strokeDashoffset={`${2 * Math.PI * 20 * (1 - timerPct / 100)}`}
                    strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s linear" }} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-black text-sm" style={{ color: timerColor }}>
                  {timer}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-1 mt-1">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <div className="w-0.5 h-6 bg-gray-300" />
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">PICKUP • 1.2 km away</p>
                    <p className="font-semibold text-gray-800 text-sm">
                      {activeRide.pickup?.lat?.toFixed(4)}, {activeRide.pickup?.lng?.toFixed(4)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">DROP</p>
                    <p className="font-semibold text-gray-800 text-sm">
                      {activeRide.destination?.address || `${activeRide.destination?.lat?.toFixed(4)}, ${activeRide.destination?.lng?.toFixed(4)}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between bg-yellow-50 rounded-2xl px-4 py-3 border border-yellow-200">
              <div>
                <p className="text-gray-500 text-xs">Estimated Fare</p>
                <p className="font-black text-yellow-600 text-2xl">₹{activeRide.fare || 80}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-xs">Vehicle</p>
                <p className="font-bold text-gray-700 capitalize">{activeRide.vehicle || "bike"}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setPhase(PHASES.IDLE); setActiveRide(null); }}
                className="flex-1 border-2 border-red-300 text-red-500 font-black py-4 rounded-2xl text-base">
                ✕ Decline
              </button>
              <button onClick={acceptRide}
                className="flex-1 bg-green-500 text-white font-black py-4 rounded-2xl text-base shadow-lg">
                ✓ Accept
              </button>
            </div>
          </div>
        )}

        {/* ── ACCEPTED: Navigate + Arrived + OTP ── */}
        {phase === PHASES.ACCEPTED && activeRide && (
          <div className="px-4 pb-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p className="font-bold text-green-600">Navigate to pickup point</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Pickup</p>
                <p className="font-semibold text-sm">
                  {activeRide.pickup?.address || `${activeRide.pickup?.lat?.toFixed(4)}, ${activeRide.pickup?.lng?.toFixed(4)}`}
                </p>
              </div>
              <button className="bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-xl">🗺️ Navigate</button>
            </div>
            {/* I've Arrived button — triggers proximity alert to user */}
            <button onClick={markArrived}
              className="w-full bg-green-500 text-white font-bold py-3 rounded-2xl text-sm">
              📍 I've Arrived at Pickup
            </button>
            <div>
              <label className="text-sm font-semibold text-gray-600">Enter Rider's OTP to start</label>
              <input type="text" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)}
                className="w-full mt-1 border-2 border-gray-200 focus:border-yellow-400 rounded-xl p-3 text-center text-2xl font-black tracking-widest outline-none"
                placeholder="• • • •" />
            </div>
            <button onClick={startRide}
              className="w-full bg-yellow-500 text-white font-black py-4 rounded-2xl text-lg shadow-lg">
              🚀 Verify OTP & Start Ride
            </button>
          </div>
        )}

        {/* ── TRANSIT ── */}
        {phase === PHASES.TRANSIT && activeRide && (
          <div className="px-4 pb-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <p className="font-bold text-blue-600">Ride in progress</p>
            </div>
            <div className="bg-blue-50 rounded-2xl p-4 space-y-2 border border-blue-100">
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Drop</span>
                <span className="font-semibold text-sm text-gray-800">
                  {activeRide.destination?.address || `${activeRide.destination?.lat?.toFixed(4)}, ${activeRide.destination?.lng?.toFixed(4)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Fare</span>
                <span className="font-black text-yellow-600 text-lg">₹{activeRide.fare || 80}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 bg-blue-500 text-white font-bold py-3 rounded-2xl text-sm">🗺️ Navigate</button>
              <button onClick={completeRide} className="flex-1 bg-green-500 text-white font-black py-3 rounded-2xl text-sm">✓ Complete Ride</button>
            </div>
          </div>
        )}

        {/* ── DONE ── */}
        {phase === PHASES.DONE && activeRide && (
          <div className="px-4 pb-5 space-y-3 text-center">
            <div className="text-4xl">💰</div>
            <h2 className="font-black text-xl text-gray-800">Ride Complete!</h2>
            <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
              <p className="text-gray-500 text-xs">Fare Earned</p>
              <p className="font-black text-3xl text-green-600">₹{activeRide.fare || 80}</p>
            </div>
            <div>
              <p className="text-gray-600 font-semibold mb-2 text-sm">Rate your Rider</p>
              <div className="flex justify-center gap-2">
                {[1,2,3,4,5].map((s) => (
                  <button key={s} onClick={() => setRating(s)}
                    className={`text-3xl transition-all ${s <= rating ? "scale-110" : "opacity-30"}`}>⭐</button>
                ))}
              </div>
            </div>
            <button onClick={submitRating}
              className="w-full bg-yellow-500 text-white font-black py-3 rounded-2xl">
              Done & Next Ride →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
