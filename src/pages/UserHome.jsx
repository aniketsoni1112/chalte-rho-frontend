import { useEffect, useState, useContext, useRef, useCallback } from "react";
import API from "../services/api";
import socket from "../context/SocketContext";
import LiveMap from "../components/LiveMap";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const VEHICLES = [
  { type: "bike", label: "Bike", icon: "🏍️", base: 25, per: 8, promo: "20% Off", eta: 2 },
  { type: "auto", label: "Auto", icon: "🛺", base: 35, per: 12, promo: null, eta: 4 },
  { type: "cab", label: "Cab", icon: "🚗", base: 60, per: 18, promo: "Coupon Applied", eta: 6 },
];

const PHASES = { IDLE: "idle", SEARCHING: "searching", MATCHED: "matched", PICKUP: "pickup", TRANSIT: "transit", DONE: "done" };

const SAVED = [
  { label: "Home", icon: "🏠", address: "Sector 21, Indore" },
  { label: "Work", icon: "💼", address: "Palasia Square, Indore" },
];

// Safely extract plain string userId from any user object shape
const getUserId = (user) => {
  if (!user) return null;
  const raw = user._id || user.id;
  if (!raw) return null;
  // Handle Mongoose {$oid: "..."} shape from localStorage
  if (typeof raw === "object" && raw.$oid) return raw.$oid;
  return String(raw);
};

export default function UserHome() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [phase, setPhase] = useState(PHASES.IDLE);
  const [ride, setRide] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [rating, setRating] = useState(0);
  const [eta, setEta] = useState(null);
  const [drawer, setDrawer] = useState(false);
  const [wallet, setWallet] = useState(user?.wallet || 0);
  const [payMethod, setPayMethod] = useState("cash");
  const [showShareBanner, setShowShareBanner] = useState(false);
  const [destCoords, setDestCoords] = useState(null);
  const [rideStartedFlash, setRideStartedFlash] = useState(false);
  const [transitEta, setTransitEta] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const transitTimerRef = useRef(null);

  // GPS
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setPickup({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setPickup({ lat: 22.7, lng: 75.8 })
    );
  }, []);

  const userIdRef = useRef(null);

  // Socket — attach listeners once per userId
  useEffect(() => {
    const userId = getUserId(user);
    if (!userId) return;
    userIdRef.current = userId;

    // Connect if not connected
    if (!socket.connected) socket.connect();

    // Register room immediately + on every reconnect
    const registerRoom = () => {
      socket.emit("register", { userId, role: user.role || "user" });
      console.log("✅ User socket registered:", userId);
    };
    if (socket.connected) registerRoom();
    socket.on("connect", registerRoom);

    const onDriverLocation = (loc) => {
      setDrivers((prev) => [...prev.filter((d) => d.id !== loc.id), loc]);
      setDriverLocation({ lat: loc.lat, lng: loc.lng });
    };
    const onRideStatusUpdate = (data) => {
      if (data.status === "searching") setPhase(PHASES.SEARCHING);
    };
    const onRideAccepted = (r) => {
      setRide((prev) => ({ ...prev, ...r, _id: r._id || r.rideId || prev?._id, otp: r.otp || prev?.otp }));
      setPhase(PHASES.MATCHED);
      setEta(Math.floor(Math.random() * 5 + 2));
    };

    const onRideConfirmed = (r) => {
      setRide((prev) => ({ ...prev, ...r, _id: r._id || r.rideId || prev?._id, otp: r.otp || prev?.otp }));
      setPhase(PHASES.MATCHED);
      setEta(Math.floor(Math.random() * 5 + 2));
    };
    const onCaptainArrived = (r) => {
      setRide((prev) => ({ ...prev, ...r }));
      setPhase(PHASES.MATCHED); // ensure user sees captain card + OTP
      setEta(0);
    };
    const onRideStarted = (data) => {
      setRide((prev) => ({ ...prev, ...data, status: "ongoing" }));
      setPhase(PHASES.TRANSIT);
      setRideStartedFlash(true);
      setTimeout(() => setRideStartedFlash(false), 4000);
      setTransitEta(15);
      setShowShareBanner(true);
      setTimeout(() => setShowShareBanner(false), 6000);
    };
    const onRideCompleted = (r) => {
      setRide((prev) => ({ ...prev, ...r }));
      setPhase(PHASES.DONE);
    };
    const onRideCancelled = () => {
      setPhase(PHASES.IDLE);
      setRide(null);
      setSelectedVehicle(null);
      alert("Ride was cancelled.");
    };

    socket.on("driver_location", onDriverLocation);
    socket.on("ride_status_update", onRideStatusUpdate);
    socket.on("ride_accepted", onRideAccepted);
    socket.on("ride_confirmed", onRideConfirmed);
    socket.on("captain_arrived", onCaptainArrived);
    socket.on("ride_started", onRideStarted);
    socket.on("ride_completed", onRideCompleted);
    socket.on("ride_cancelled", onRideCancelled);

    return () => {
      socket.off("connect", registerRoom);
      socket.off("driver_location", onDriverLocation);
      socket.off("ride_status_update", onRideStatusUpdate);
      socket.off("ride_accepted", onRideAccepted);
      socket.off("ride_confirmed", onRideConfirmed);
      socket.off("captain_arrived", onCaptainArrived);
      socket.off("ride_started", onRideStarted);
      socket.off("ride_completed", onRideCompleted);
      socket.off("ride_cancelled", onRideCancelled);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getUserId(user)]);

  // ETA countdown during TRANSIT
  useEffect(() => {
    if (phase !== PHASES.TRANSIT || transitEta === null) return;
    if (transitEta <= 0) return;
    transitTimerRef.current = setTimeout(() =>
      setTransitEta((p) => (p > 0 ? p - 1 : 0)), 60000); // tick every minute
    return () => clearTimeout(transitTimerRef.current);
  }, [phase, transitEta]);

  // Haversine distance in km between two lat/lng points
  const haversine = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const estimateFare = (v) => {
    // Use real distance if both coords available, else fallback to 5km
    const dist = (pickup && destCoords)
      ? haversine(pickup.lat, pickup.lng, destCoords.lat, destCoords.lng)
      : 5;
    let fare = Math.round(v.base + dist * v.per);
    if (v.promo) fare = Math.round(fare * 0.8);
    return fare;
  };

  const bookRide = async () => {
    if (!destination) return alert("Enter destination");
    if (!selectedVehicle) return alert("Select a vehicle");
    if (!pickup) return alert("Location not detected yet");
    // Use geocoded coords if available, else fallback offset
    const destLat = destCoords?.lat ?? pickup.lat + 0.05;
    const destLng = destCoords?.lng ?? pickup.lng + 0.05;
    setPhase(PHASES.SEARCHING);
    try {
      const res = await API.post("/rides/request", {
        pickup: { lat: pickup.lat, lng: pickup.lng, address: "Current Location" },
        destination: { lat: destLat, lng: destLng, address: destination },
        vehicle: selectedVehicle.type,
        paymentMethod: payMethod,
      });
      setRide(res.data);
      console.log("✅ Ride created | OTP:", res.data.otp, "| Fare:", res.data.fare);
    } catch (err) {
      console.error(err);
      setPhase(PHASES.IDLE);
      alert("Booking failed: " + (err.response?.data?.msg || err.message));
    }
  };

  const cancelRide = async () => {
    if (phase === PHASES.TRANSIT) return; // Cannot cancel ongoing ride
    try {
      if (ride?._id) await API.post(`/rides/cancel/${ride._id}`, { reason: "Cancelled by user" });
    } catch {}
    setPhase(PHASES.IDLE); setRide(null); setSelectedVehicle(null);
  };

  const sosAlert = () => {
    if (ride?.driver?.phone) window.location.href = `tel:${ride.driver.phone}`;
    else alert("Emergency! Sharing your location with emergency contacts.");
  };

  const submitRating = async () => {
    try { await API.post(`/rides/${ride?._id}/rate`, { rating, by: "user" }); } catch {}
    setPhase(PHASES.IDLE); setRide(null); setRating(0);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden relative">

      {/* SIDE DRAWER OVERLAY */}
      {drawer && (
        <div className="fixed inset-0 z-[1001] flex">
          <div className="bg-white w-72 h-full shadow-2xl flex flex-col">
            {/* Drawer Header */}
            <div className="bg-yellow-500 p-5 pt-10">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-yellow-500 text-2xl font-black shadow">
                  {user?.name?.[0] || "U"}
                </div>
                <div>
                  <p className="font-black text-white text-lg">{user?.name}</p>
                  <p className="text-yellow-100 text-xs">{user?.email || user?.phone}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-yellow-200 text-xs">⭐ 4.9</span>
                    <span className="text-yellow-200 text-xs">• 42 rides</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Wallet */}
            <div className="mx-4 mt-4 bg-yellow-50 rounded-2xl p-3 flex items-center justify-between border border-yellow-200">
              <div>
                <p className="text-xs text-gray-500">Rapido Wallet</p>
                <p className="font-black text-yellow-600 text-lg">₹{wallet}</p>
              </div>
              <button className="bg-yellow-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl">Add Money</button>
            </div>

            {/* Menu Items */}
            <div className="flex-1 p-4 space-y-1 overflow-y-auto">
              {[
                { icon: "🕒", label: "My Rides", action: () => { navigate("/history"); setDrawer(false); } },
                { icon: "💳", label: "Payment & Wallet", action: () => { navigate("/wallet"); setDrawer(false); } },
                { icon: "⚡", label: "Power Pass", action: () => { navigate("/pass"); setDrawer(false); } },
                { icon: "🔔", label: "Notifications", action: () => { navigate("/notifications"); setDrawer(false); } },
                { icon: "🎁", label: "Refer & Earn", action: () => { navigate("/refer"); setDrawer(false); } },
                { icon: "❓", label: "Help & Support", action: () => { navigate("/support"); setDrawer(false); } },
                { icon: "⚙️", label: "Settings", action: () => { navigate("/settings"); setDrawer(false); } },
                ...(user?.role === "admin" ? [{ icon: "🔧", label: "Admin Panel", action: () => { navigate("/admin"); setDrawer(false); } }] : []),
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
              <button onClick={logout} className="w-full text-red-500 font-bold py-2 text-sm">Logout</button>
            </div>
          </div>
          {/* Backdrop */}
          <div className="flex-1 bg-black/40" onClick={() => setDrawer(false)} />
        </div>
      )}

      {/* TOP HEADER */}
      <div className="bg-white px-4 py-3 flex items-center gap-3 shadow-sm z-10">
        <button onClick={() => setDrawer(true)} className="flex flex-col gap-1 p-1">
          <div className="w-5 h-0.5 bg-gray-700 rounded" />
          <div className="w-5 h-0.5 bg-gray-700 rounded" />
          <div className="w-5 h-0.5 bg-gray-700 rounded" />
        </button>
        <div className="flex-1">
          <p className="text-xs text-gray-400 font-semibold">YOUR LOCATION</p>
          <div className="flex items-center gap-1">
            <span className="text-green-500 text-sm">📍</span>
            <p className="font-bold text-gray-800 text-sm truncate">
              {pickup ? `${pickup.lat.toFixed(4)}, ${pickup.lng.toFixed(4)}` : "Detecting..."}
            </p>
          </div>
        </div>
        <button onClick={() => setDrawer(true)}
          className="w-9 h-9 bg-yellow-500 rounded-full flex items-center justify-center text-white font-black text-sm shadow">
          {user?.name?.[0] || "U"}
        </button>
      </div>

      {/* MAP — full background */}
      <div className="flex-1 relative" style={{ zIndex: 0 }}>
        <LiveMap position={phase === PHASES.TRANSIT && driverLocation ? driverLocation : pickup} drivers={drivers} />

        {/* Share Live Location banner — appears when ride starts */}
        {showShareBanner && (
          <div className="absolute top-3 left-3 right-3 z-[999] bg-gray-900 text-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl">
            <span className="text-2xl">📍</span>
            <div className="flex-1">
              <p className="font-black text-sm">Your ride has started!</p>
              <p className="text-gray-300 text-xs">Share your live location with family</p>
            </div>
            <button onClick={() => {
                const msg = `I started a ride to ${destination}. Track me!`;
                if (navigator.share) navigator.share({ title: "Live Trip", text: msg });
                setShowShareBanner(false);
              }}
              className="bg-yellow-500 text-white text-xs font-black px-3 py-1.5 rounded-xl">
              Share
            </button>
            <button onClick={() => setShowShareBanner(false)} className="text-gray-400 text-lg">×</button>
          </div>
        )}

        {/* ETA floating badge */}
        {phase === PHASES.PICKUP && eta && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white shadow-xl rounded-full px-5 py-2 flex items-center gap-2 z-[999]">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-yellow-600 font-black text-base">{eta} min away</span>
          </div>
        )}

        {/* SOS Button */}
        <button onClick={sosAlert} className="absolute top-3 right-3 bg-red-500 text-white font-black text-xs px-3 py-2 rounded-full shadow-lg z-[999]">
          🆘 SOS
        </button>

        {/* ── RIDE STARTED FLASH ── */}
        {rideStartedFlash && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center pointer-events-none">
            <div className="bg-green-500 text-white rounded-3xl px-8 py-6 shadow-2xl text-center animate-bounce">
              <div className="text-5xl mb-2">🚀</div>
              <p className="font-black text-2xl">Ride Started!</p>
              <p className="text-green-100 text-sm mt-1">Have a safe trip 🙏</p>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM SHEET */}
      <div className="bg-white rounded-t-3xl shadow-2xl z-10">

        {/* ── IDLE ── */}
        {phase === PHASES.IDLE && (
          <div className="p-4 space-y-3">
            {/* Search Box */}
            <div className="bg-gray-50 rounded-2xl px-4 py-3 space-y-2 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <div className="w-0.5 h-5 bg-gray-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-xs text-gray-400 font-semibold">PICKUP</p>
                  <p className="text-sm font-semibold text-gray-700">📍 Current Location</p>
                  <div className="border-t border-gray-200" />
                  <p className="text-xs text-gray-400 font-semibold">DROP</p>
                  <input value={destination}
                    onChange={async (e) => {
                      setDestination(e.target.value);
                      setDestCoords(null);
                    }}
                    onBlur={async () => {
                      if (!destination.trim()) return;
                      try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`);
                        const data = await res.json();
                        if (data[0]) setDestCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
                      } catch {}
                    }}
                    className="w-full text-sm font-semibold text-gray-800 bg-transparent outline-none placeholder-gray-400"
                    placeholder="Where are you going?" />
                </div>
              </div>
            </div>

            {/* Saved Places */}
            <div className="flex gap-2">
              {SAVED.map((s) => (
                <button key={s.label} onClick={async () => {
                    setDestination(s.address);
                    try {
                      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(s.address)}&format=json&limit=1`);
                      const data = await res.json();
                      if (data[0]) setDestCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
                    } catch {}
                  }}
                  className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-all">
                  <span>{s.icon}</span>{s.label}
                </button>
              ))}
            </div>

            {/* Vehicle Cards */}
            <div className="grid grid-cols-3 gap-2">
              {VEHICLES.map((v) => (
                <button key={v.type} onClick={() => setSelectedVehicle(v)}
                  className={`relative flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${selectedVehicle?.type === v.type ? "border-yellow-500 bg-yellow-50 shadow-md" : "border-gray-100 bg-gray-50"}`}>
                  {v.promo && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full whitespace-nowrap">
                      {v.promo}
                    </span>
                  )}
                  <span className="text-3xl mt-1">{v.icon}</span>
                  <span className="font-bold text-sm mt-1 text-gray-800">{v.label}</span>
                  <span className="text-yellow-600 font-black text-sm">₹{estimateFare(v)}</span>
                  <span className="text-gray-400 text-xs">{v.eta} min</span>
                </button>
              ))}
            </div>

            {/* Payment Method */}
            <div className="flex gap-2">
              {[
                { id: "cash", label: "💵 Cash" },
                { id: "wallet", label: "👛 Wallet" },
                { id: "upi", label: "📱 UPI" },
              ].map((m) => (
                <button key={m.id} onClick={() => setPayMethod(m.id)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${payMethod === m.id ? "border-yellow-500 bg-yellow-50 text-yellow-700" : "border-gray-100 text-gray-500"}`}>
                  {m.label}
                </button>
              ))}
            </div>

            <button onClick={bookRide}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-black py-4 rounded-2xl text-lg transition-all shadow-lg">
              Book {selectedVehicle?.label || "Ride"} →
            </button>
          </div>
        )}

        {/* ── SEARCHING ── */}
        {phase === PHASES.SEARCHING && (
          <div className="p-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="font-black text-xl text-gray-800">Finding your Captain...</h2>
            <p className="text-gray-400 text-sm">Searching captains within 2–5 km</p>
            {/* Show OTP immediately after booking */}
            {ride?.otp && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-3">
                <p className="text-gray-500 text-xs font-semibold">🔐 Your Ride OTP</p>
                <p className="font-black text-3xl tracking-widest text-yellow-600 mt-1">
                  {String(ride.otp).padStart(4, '0')}
                </p>
                <p className="text-gray-400 text-xs mt-1">Share with captain when they arrive</p>
              </div>
            )}
            <button onClick={cancelRide} className="text-red-500 font-semibold text-sm border border-red-200 px-4 py-2 rounded-xl">Cancel</button>
          </div>
        )}

        {/* ── MATCHED ── */}
        {phase === PHASES.MATCHED && ride && (
          <div className="p-4 space-y-3">
            {/* Captain Profile Card */}
            <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-yellow-400 flex-shrink-0">
                  {ride.captain?.photo
                    ? <img src={ride.captain.photo} alt="captain" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-yellow-500 flex items-center justify-center text-white text-2xl font-black">
                        {(ride.captain?.captainName || ride.driver?.captainName || "C")[0]}
                      </div>}
                </div>
                <div className="flex-1">
                  <p className="font-black text-gray-800">{ride.captain?.captainName || ride.driver?.captainName || "Captain"}</p>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(s => <span key={s} className="text-yellow-400 text-xs">★</span>)}
                    <span className="text-gray-400 text-xs ml-1">{ride.captain?.rating || 4.8}</span>
                  </div>
                  <a href={`tel:${ride.captain?.phone || ride.driver?.phone}`}
                    className="text-xs text-green-600 font-bold">
                    📞 {ride.captain?.phone || ride.driver?.phone || "N/A"}
                  </a>
                </div>
                <p className="font-black text-yellow-600 text-xl">₹{ride.fare}</p>
              </div>

              {/* Vehicle Details */}
              <div className="bg-white rounded-xl p-3 space-y-1.5">
                <p className="text-xs font-black text-gray-500 mb-1">🚗 VEHICLE DETAILS</p>
                {[
                  { label: "Vehicle", value: ride.captain?.vehicleModel || ride.driver?.vehicleModel || ride.vehicle },
                  { label: "Number", value: ride.captain?.vehicleNumber || ride.driver?.vehicleNumber || "N/A" },
                  { label: "RC",     value: ride.captain?.rcDetails    || ride.driver?.rcDetails    || "N/A" },
                ].map(d => (
                  <div key={d.label} className="flex justify-between">
                    <span className="text-xs text-gray-400">{d.label}</span>
                    <span className="text-xs font-bold text-gray-700">{d.value}</span>
                  </div>
                ))}
                {(ride.captain?.currentLocation || ride.driver?.currentLocation) && (
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-400">📍 Location</span>
                    <span className="text-xs font-bold text-blue-500">
                      {(ride.captain?.currentLocation || ride.driver?.currentLocation)?.lat?.toFixed(4)},
                      {(ride.captain?.currentLocation || ride.driver?.currentLocation)?.lng?.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* OTP */}
            <div className="bg-yellow-50 rounded-2xl p-3 text-center border border-yellow-200">
              <p className="text-gray-500 text-xs font-semibold mb-1">🔐 Share OTP with Captain</p>
              <p className="font-black text-4xl tracking-widest text-yellow-600">
                {String(ride.otp || "----").padStart(4, "0")}
              </p>
              <p className="text-gray-400 text-xs mt-1">Share only when captain arrives</p>
            </div>

            <div className="flex gap-2">
              <a href={`tel:${ride.captain?.phone || ride.driver?.phone || "#"}`}
                className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white font-bold py-3 rounded-2xl">
                📞 Call Captain
              </a>
              <button className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white font-bold py-3 rounded-2xl">
                💬 Chat
              </button>
            </div>
            <button onClick={cancelRide} className="w-full border-2 border-red-200 text-red-500 font-semibold py-3 rounded-2xl text-sm">Cancel Ride</button>
          </div>
        )}

        {/* ── PICKUP ── */}
        {phase === PHASES.PICKUP && ride && (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p className="font-bold text-green-600">Captain is on the way!</p>
              {eta && <span className="ml-auto bg-yellow-100 text-yellow-700 text-xs font-black px-2 py-1 rounded-full">{eta} min</span>}
            </div>
            <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xl font-black">
                {(ride.driver?.captainName || ride.driver?.name)?.[0] || "C"}
              </div>
              <div className="flex-1">
                <p className="font-black text-gray-800">{ride.driver?.captainName || ride.driver?.name || "Your Captain"}</p>
                <p className="text-gray-500 text-xs">🚗 {ride.driver?.vehicleNumber || ride.driver?.vehicleNo || "N/A"} • ⭐ {ride.driver?.rating || 4.8}</p>
                {ride.driver?.currentLocation && (
                  <p className="text-xs text-blue-500">📍 ({ride.driver.currentLocation.lat?.toFixed(4)}, {ride.driver.currentLocation.lng?.toFixed(4)})</p>
                )}
              </div>
              <div className="flex gap-2">
                <a href={`tel:${ride.driver?.phone || "#"}`} className="bg-green-500 text-white p-2 rounded-full text-base">📞</a>
                <button className="bg-blue-500 text-white p-2 rounded-full text-base">💬</button>
              </div>
            </div>
            <div className="bg-yellow-50 rounded-2xl p-3 text-center border border-yellow-200">
              <p className="text-gray-500 text-xs font-semibold mb-1">🔐 Your OTP</p>
              <p className="font-black text-4xl tracking-widest text-yellow-600">
                {ride?.otp ? String(ride.otp).padStart(4, "0") : "----"}
              </p>
              <p className="text-gray-400 text-xs mt-1">Share this with your Captain to start the ride</p>
            </div>
          </div>
        )}

        {/* ── TRANSIT — LIVE TRIP SCREEN ── */}
        {phase === PHASES.TRANSIT && (
          <div className="p-4 space-y-3">

            {/* Live status bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <p className="font-black text-green-600">Ride in Progress 🚀</p>
              </div>
              <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
                <span className="text-green-600 text-xs font-black">
                  {transitEta !== null && transitEta > 0
                    ? `🕒 ${transitEta} min ETA`
                    : "📍 Arriving soon"}
                </span>
              </div>
            </div>

            {/* Route card */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-1 mt-1">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <div className="w-0.5 h-8 bg-gray-300" />
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">FROM</p>
                    <p className="font-semibold text-gray-700 text-sm">📍 Current Location</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">TO</p>
                    <p className="font-black text-gray-800 text-sm">{destination || ride?.destination?.address || "Destination"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Fare</p>
                  <p className="font-black text-yellow-600 text-xl">&#8377;{ride?.fare}</p>
                  <p className="text-xs text-gray-400 capitalize mt-0.5">{ride?.paymentMethod}</p>
                </div>
              </div>
            </div>

            {/* Captain card */}
            <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xl font-black shadow">
                  {ride?.driver?.name?.[0] || "C"}
                </div>
                <div className="flex-1">
                  <p className="font-black text-gray-800">{ride?.driver?.name || "Your Captain"}</p>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400 text-xs">★★★★★</span>
                    <span className="text-gray-400 text-xs">4.8</span>
                  </div>
                  <p className="text-gray-500 text-xs">{ride?.driver?.vehicleNo || "MP 09 AB 1234"} • {ride?.vehicle}</p>
                </div>
                <div className="flex gap-2">
                  <a href={`tel:${ride?.driver?.phone || "#"}`}
                    className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                    📞
                  </a>
                  <button className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                    💬
                  </button>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => {
                  const msg = `I'm on a ride to ${destination}. Track me!`;
                  if (navigator.share) navigator.share({ title: "My Live Trip", text: msg });
                  else alert("Share: " + msg);
                }}
                className="flex flex-col items-center gap-1 bg-blue-50 border border-blue-100 rounded-2xl p-3">
                <span className="text-xl">📲</span>
                <span className="text-xs font-bold text-blue-600">Share Trip</span>
              </button>
              <button onClick={sosAlert}
                className="flex flex-col items-center gap-1 bg-red-50 border border-red-200 rounded-2xl p-3">
                <span className="text-xl">🛡️</span>
                <span className="text-xs font-bold text-red-600">Safety</span>
              </button>
              <button onClick={() => navigate("/support")}
                className="flex flex-col items-center gap-1 bg-gray-50 border border-gray-100 rounded-2xl p-3">
                <span className="text-xl">❓</span>
                <span className="text-xs font-bold text-gray-600">Support</span>
              </button>
            </div>

            <button onClick={sosAlert}
              className="w-full bg-red-500 text-white font-black py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-red-200">
              🆘 Emergency SOS
            </button>
          </div>
        )}

        {/* ── DONE ── */}
        {phase === PHASES.DONE && ride && (
          <div className="p-4 space-y-3 text-center">
            <div className="text-5xl">🎉</div>
            <h2 className="font-black text-2xl text-gray-800">Ride Complete!</h2>
            <div className="bg-gray-50 rounded-2xl p-4 flex justify-around">
              <div>
                <p className="text-gray-400 text-xs">Fare</p>
                <p className="font-black text-2xl text-yellow-600">₹{ride.fare}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Payment</p>
                <p className="font-bold text-gray-700 capitalize">{ride.paymentMethod}</p>
              </div>
            </div>
            <div>
              <p className="text-gray-600 font-semibold mb-2">Rate your Captain</p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setRating(s)}
                    className={`text-3xl transition-all ${s <= rating ? "scale-110" : "opacity-30"}`}>⭐</button>
                ))}
              </div>
            </div>
            <button onClick={submitRating}
              className="w-full bg-yellow-500 text-white font-black py-3 rounded-2xl text-lg">
              Submit & Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
