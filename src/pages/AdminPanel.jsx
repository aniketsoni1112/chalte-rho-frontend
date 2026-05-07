import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import LiveMap from "../components/LiveMap";
import { AuthContext } from "../context/AuthContext";

const ALL_TABS = [
  { id: "overview",  label: "📊 Overview",   roles: ["admin", "manager"] },
  { id: "live",      label: "🗺️ Live Ops",    roles: ["admin"] },
  { id: "users",     label: "👥 Users",       roles: ["admin"] },
  { id: "captains",  label: "🏍️ Captains",   roles: ["admin", "manager"] },
  { id: "rides",     label: "🚀 Rides",       roles: ["admin", "manager"] },
  { id: "pricing",   label: "💸 Pricing",     roles: ["admin"] },
  { id: "coupons",   label: "🎟️ Coupons",    roles: ["admin"] },
  { id: "broadcast", label: "📢 Broadcast",   roles: ["admin"] },
  { id: "payouts",   label: "💰 Payouts",     roles: ["admin", "manager"] },
  { id: "support",   label: "🎫 Support",     roles: ["admin"] },
];

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const role = user?.role || "admin";
  const TABS = ALL_TABS.filter(t => t.roles.includes(role));
  const [tab, setTab] = useState(TABS[0]?.id || "overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [rides, setRides] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [surgeZones, setSurgeZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [rideFilter, setRideFilter] = useState("");

  // Coupon form
  const [couponForm, setCouponForm] = useState({ code: "", discount: "", type: "flat" });
  // Surge form
  const [surgeForm, setSurgeForm] = useState({ area: "", multiplier: 1.5 });
  // Broadcast form
  const [broadcastForm, setBroadcastForm] = useState({ target: "all", title: "", message: "" });
  const [broadcastResult, setBroadcastResult] = useState(null);

  useEffect(() => {
    setLoading(true);
    const calls = {
      captains: () => API.get("/manager/captains").then(r => setUsers(r.data.filter(u => u.role === "driver"))),
      overview: () => API.get("/admin/stats").then(r => setStats(r.data)),
      live: () => API.get("/admin/stats").then(r => setStats(r.data)),
      users: () => API.get(`/admin/users?role=${roleFilter}&search=${search}`).then(r => setUsers(r.data)),
      rides: () => API.get(`/admin/rides?status=${rideFilter}`).then(r => setRides(r.data)),
      pricing: () => API.get("/admin/surge").then(r => setSurgeZones(r.data)),
      coupons: () => API.get("/admin/coupons").then(r => setCoupons(r.data)),
      payouts: () => API.get("/admin/payouts").then(r => setPayouts(r.data)),
      support: () => API.get("/admin/tickets").then(r => setTickets(r.data)),
      broadcast: () => Promise.resolve(),
    };
    (calls[tab] || (() => Promise.resolve()))().catch(() => {}).finally(() => setLoading(false));
  }, [tab, roleFilter, rideFilter]);

  const blockUser = async (id) => {
    const res = await API.patch(`/admin/block/${id}`);
    setUsers(p => p.map(u => u._id === id ? { ...u, blocked: res.data.blocked } : u));
  };

  const verifyDriver = async (id, status) => {
    await API.patch(`/admin/verify/${id}`, { status });
    setUsers(p => p.map(u => u._id === id ? { ...u, verified: status } : u));
  };

  const createCoupon = async () => {
    if (!couponForm.code || !couponForm.discount) return alert("Fill all fields");
    const res = await API.post("/admin/coupons", couponForm);
    setCoupons(res.data.coupons);
    setCouponForm({ code: "", discount: "", type: "flat" });
  };

  const toggleCoupon = async (code) => {
    const res = await API.patch(`/admin/coupons/${code}`);
    setCoupons(p => p.map(c => c.code === code ? res.data : c));
  };

  const setSurge = async () => {
    if (!surgeForm.area) return alert("Enter area name");
    await API.post("/admin/surge", surgeForm);
    setSurgeZones(p => [...p.filter(z => z.area !== surgeForm.area), surgeForm]);
    setSurgeForm({ area: "", multiplier: 1.5 });
  };

  const removeSurge = async (area) => {
    await API.delete(`/admin/surge/${area}`);
    setSurgeZones(p => p.filter(z => z.area !== area));
  };

  const sendBroadcast = async () => {
    if (!broadcastForm.title || !broadcastForm.message) return alert("Fill all fields");
    const res = await API.post("/admin/broadcast", broadcastForm);
    setBroadcastResult(res.data);
    setBroadcastForm({ target: "all", title: "", message: "" });
  };

  const statusColor = { completed: "bg-green-100 text-green-700", ongoing: "bg-blue-100 text-blue-700", searching: "bg-yellow-100 text-yellow-700", cancelled: "bg-red-100 text-red-700" };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gray-900 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-white text-xl">←</button>
          <div>
            <h1 className="text-white font-black text-lg">{role === "manager" ? "🛡️ Manager Dashboard" : "⚙️ Admin Dashboard"}</h1>
            <p className="text-gray-400 text-xs">{user?.name} • {role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-400 text-xs font-bold">LIVE</span>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 px-3 py-2 overflow-x-auto bg-white border-b sticky top-14 z-10">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${tab === t.id ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4">
        {loading && <p className="text-center text-gray-400 py-6">Loading...</p>}

        {/* ── OVERVIEW ── */}
        {tab === "overview" && stats && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total Users",   value: stats.totalUsers,      icon: "👤", color: "bg-blue-500",   roles: ["admin"] },
                { label: "Total Drivers", value: stats.totalDrivers,    icon: "🏍️", color: "bg-yellow-500", roles: ["admin", "manager"] },
                { label: "Online Now",    value: stats.onlineDrivers||0, icon: "🟢", color: "bg-green-500",  roles: ["admin", "manager"] },
                { label: "Active Rides",  value: stats.activeRides||0,  icon: "🚀", color: "bg-purple-500", roles: ["admin", "manager"] },
                { label: "Pending Approval", value: stats.pendingCaptains||0, icon: "⏳", color: "bg-orange-500", roles: ["admin", "manager"] },
                { label: "Approved Captains", value: stats.approvedCaptains||0, icon: "✅", color: "bg-teal-500", roles: ["admin", "manager"] },
                { label: "Total Rides",   value: stats.totalRides,      icon: "📊", color: "bg-indigo-500", roles: ["admin"] },
                { label: "Revenue",       value: `₹${stats.revenue}`,  icon: "💰", color: "bg-orange-500", roles: ["admin"] },
              ].filter(s => s.roles.includes(role)).map((s) => (
                <div key={s.label} className={`${s.color} rounded-2xl p-4 text-white shadow`}>
                  <p className="text-2xl">{s.icon}</p>
                  <p className="font-black text-2xl mt-1">{s.value}</p>
                  <p className="text-white/80 text-xs">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Vehicle Inventory */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="font-black text-gray-800 mb-3">🏍️ Fleet Inventory</p>
              <div className="grid grid-cols-3 gap-2">
                {[{ label: "Bikes", icon: "🏍️", count: Math.floor(stats.totalDrivers * 0.6) },
                  { label: "Autos", icon: "🛺", count: Math.floor(stats.totalDrivers * 0.3) },
                  { label: "Cabs", icon: "🚗", count: Math.floor(stats.totalDrivers * 0.1) }].map((v) => (
                  <div key={v.label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-2xl">{v.icon}</p>
                    <p className="font-black text-gray-800">{v.count}</p>
                    <p className="text-gray-400 text-xs">{v.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Fraud Detection */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <p className="font-black text-red-700 mb-2">🚨 Fraud Alerts</p>
              {[
                { msg: "Suspicious GPS pattern detected", driver: "Driver #1042", time: "2 min ago" },
                { msg: "Multiple fake ride attempts", driver: "Driver #0891", time: "15 min ago" },
              ].map((a, i) => (
                <div key={i} className="flex items-start justify-between py-2 border-b border-red-100 last:border-0">
                  <div>
                    <p className="text-red-700 font-semibold text-sm">{a.msg}</p>
                    <p className="text-red-400 text-xs">{a.driver} • {a.time}</p>
                  </div>
                  <button className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">Review</button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── LIVE OPS ── */}
        {tab === "live" && (
          <>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Online", value: stats?.onlineDrivers || 0, color: "bg-green-500" },
                { label: "Active Rides", value: stats?.activeRides || 0, color: "bg-blue-500" },
                { label: "Searching", value: "3", color: "bg-yellow-500" },
              ].map((s) => (
                <div key={s.label} className={`${s.color} rounded-2xl p-3 text-center text-white`}>
                  <p className="font-black text-2xl">{s.value}</p>
                  <p className="text-white/80 text-xs">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm" style={{ height: 300 }}>
              <LiveMap position={{ lat: 22.719, lng: 75.857 }} showHeatmap={true} />
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3">
              <p className="font-bold text-orange-700 text-sm">🔥 High Demand Zones</p>
              {["Palasia Square", "Vijay Nagar", "Rajwada"].map((z) => (
                <div key={z} className="flex items-center justify-between py-1">
                  <span className="text-gray-700 text-sm">{z}</span>
                  <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">High</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── USERS ── */}
        {tab === "users" && (
          <>
            <div className="flex gap-2">
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
                placeholder="Search name or email..." />
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
                className="border-2 border-gray-200 rounded-xl px-2 py-2 text-sm outline-none">
                <option value="">All</option>
                <option value="user">Users</option>
                <option value="driver">Drivers</option>
              </select>
            </div>
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u._id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white font-black">
                        {u.name?.[0] || "?"}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{u.name}</p>
                        <p className="text-gray-400 text-xs">{u.email || u.phone}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${u.role === "driver" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"}`}>
                      {u.role}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => blockUser(u._id)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold ${u.blocked ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {u.blocked ? "✓ Unblock" : "🚫 Block"}
                    </button>
                    {u.role === "driver" && (
                      <>
                        <button onClick={() => verifyDriver(u._id, "approved")}
                          className="flex-1 py-2 rounded-xl text-xs font-bold bg-green-100 text-green-700">
                          ✅ Approve
                        </button>
                        <button onClick={() => verifyDriver(u._id, "rejected")}
                          className="flex-1 py-2 rounded-xl text-xs font-bold bg-red-100 text-red-600">
                          ❌ Reject
                        </button>
                      </>
                    )}
                  </div>
                  {u.verified && (
                    <p className={`text-xs font-bold mt-1 ${u.verified === "approved" ? "text-green-600" : "text-red-500"}`}>
                      Docs: {u.verified}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── CAPTAINS ── */}
        {tab === "captains" && (
          <div className="space-y-2">
            {users.filter(u => u.role === "driver").map(c => (
              <div key={c._id} className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white font-black">
                      {c.name?.[0] || "C"}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{c.name}</p>
                      <p className="text-gray-400 text-xs">{c.email || c.phone}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    c.captainStatus === "approved" ? "bg-green-100 text-green-700" :
                    c.captainStatus === "rejected" ? "bg-red-100 text-red-600" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>{c.captainStatus || "pending"}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs text-gray-500">
                  <span>🏍️ {c.vehicle} • {c.vehicleNumber || "N/A"}</span>
                  <span>📄 RC: {c.rcCardNumber || "N/A"}</span>
                  <span>🪹 License: {c.licenseNumber || "N/A"}</span>
                  {c.approvedBy && <span>✅ By: {c.approvedBy?.name || "Manager"}</span>}
                </div>
              </div>
            ))}
            {users.filter(u => u.role === "driver").length === 0 && (
              <p className="text-center text-gray-400 py-8">No captains found</p>
            )}
          </div>
        )}

        {/* ── RIDES ── */}
        {tab === "rides" && (
          <>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {["", "searching", "ongoing", "completed", "cancelled"].map((s) => (
                <button key={s} onClick={() => setRideFilter(s)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${rideFilter === s ? "bg-gray-900 text-white" : "bg-white text-gray-500"}`}>
                  {s || "All"}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {rides.map((r) => (
                <div key={r._id} className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-gray-800 text-sm">{r.user?.name || "User"} → {r.driver?.name || "No driver"}</p>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColor[r.status] || "bg-gray-100 text-gray-600"}`}>{r.status}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{r.vehicle} • {r.paymentMethod}</span>
                    <span className="font-black text-yellow-600">₹{r.fare}</span>
                  </div>
                  <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── PRICING / SURGE ── */}
        {tab === "pricing" && (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <p className="font-black text-gray-800">⚡ Set Surge Pricing</p>
              <input value={surgeForm.area} onChange={(e) => setSurgeForm(p => ({ ...p, area: e.target.value }))}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
                placeholder="Area name (e.g. Palasia Square)" />
              <div>
                <label className="text-xs text-gray-500 font-semibold">Multiplier: {surgeForm.multiplier}x</label>
                <input type="range" min="1" max="3" step="0.1" value={surgeForm.multiplier}
                  onChange={(e) => setSurgeForm(p => ({ ...p, multiplier: parseFloat(e.target.value) }))}
                  className="w-full mt-1" />
                <div className="flex justify-between text-xs text-gray-400"><span>1x Normal</span><span>3x Max</span></div>
              </div>
              <button onClick={setSurge} className="w-full bg-orange-500 text-white font-black py-3 rounded-xl">
                ⚡ Apply Surge
              </button>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-gray-700">Active Surge Zones</p>
              {surgeZones.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No active surge zones</p>}
              {surgeZones.map((z, i) => (
                <div key={i} className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{z.area}</p>
                    <p className="text-orange-600 font-black">{z.multiplier}x surge</p>
                  </div>
                  <button onClick={() => removeSurge(z.area)} className="bg-red-100 text-red-500 font-bold text-xs px-3 py-1.5 rounded-xl">Remove</button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── COUPONS ── */}
        {tab === "coupons" && (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <p className="font-black text-gray-800">🎟️ Create Coupon</p>
              <input value={couponForm.code} onChange={(e) => setCouponForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none font-bold"
                placeholder="COUPON CODE (e.g. WELCOME50)" />
              <div className="flex gap-2">
                <input type="number" value={couponForm.discount} onChange={(e) => setCouponForm(p => ({ ...p, discount: e.target.value }))}
                  className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
                  placeholder="Discount value" />
                <select value={couponForm.type} onChange={(e) => setCouponForm(p => ({ ...p, type: e.target.value }))}
                  className="border-2 border-gray-200 rounded-xl px-2 py-2 text-sm outline-none">
                  <option value="flat">₹ Flat</option>
                  <option value="percent">% Off</option>
                </select>
              </div>
              <button onClick={createCoupon} className="w-full bg-yellow-500 text-white font-black py-3 rounded-xl">
                + Create Coupon
              </button>
            </div>

            <div className="space-y-2">
              {coupons.map((c, i) => (
                <div key={i} className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="font-black text-gray-800">{c.code}</p>
                    <p className="text-gray-500 text-xs">{c.type === "flat" ? `₹${c.discount} off` : `${c.discount}% off`} • {c.uses} uses</p>
                  </div>
                  <button onClick={() => toggleCoupon(c.code)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl ${c.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {c.active ? "Active" : "Inactive"}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── BROADCAST ── */}
        {tab === "broadcast" && (
          <div className="space-y-3">
            {broadcastResult && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-3 text-center">
                <p className="text-green-700 font-bold">✅ {broadcastResult.msg}</p>
              </div>
            )}
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <p className="font-black text-gray-800">📢 Send Broadcast</p>
              <div className="flex gap-2">
                {["all", "users", "drivers"].map((t) => (
                  <button key={t} onClick={() => setBroadcastForm(p => ({ ...p, target: t }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all ${broadcastForm.target === t ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"}`}>
                    {t === "all" ? "👥 All" : t === "users" ? "👤 Users" : "🏍️ Drivers"}
                  </button>
                ))}
              </div>
              <input value={broadcastForm.title} onChange={(e) => setBroadcastForm(p => ({ ...p, title: e.target.value }))}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
                placeholder="Notification Title" />
              <textarea value={broadcastForm.message} onChange={(e) => setBroadcastForm(p => ({ ...p, message: e.target.value }))} rows={3}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none resize-none"
                placeholder="Message content..." />
              <button onClick={sendBroadcast} className="w-full bg-gray-900 text-white font-black py-3 rounded-xl">
                📢 Send Now
              </button>
            </div>
          </div>
        )}

        {/* ── PAYOUTS ── */}
        {tab === "payouts" && (
          <div className="space-y-2">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="font-black text-gray-800 mb-3">💰 Captain Payouts</p>
              {payouts.map((d, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-yellow-500 rounded-full flex items-center justify-center text-white font-black text-sm">
                      {d.name?.[0] || "D"}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{d.name}</p>
                      <p className="text-gray-400 text-xs">{d.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-green-600">₹{d.wallet || 0}</p>
                    <button className="text-xs text-blue-500 font-bold">Pay Out</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SUPPORT TICKETS ── */}
        {tab === "support" && (
          <div className="space-y-2">
            {tickets.length === 0 && (
              <div className="text-center py-10">
                <p className="text-4xl mb-2">🎫</p>
                <p className="text-gray-500 font-semibold">No open tickets</p>
              </div>
            )}
            {tickets.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-gray-800 text-sm">{t.issue}</p>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${t.status === "resolved" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {t.status || "open"}
                  </span>
                </div>
                <p className="text-gray-500 text-sm">{t.description}</p>
                <button className="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl">✓ Resolve</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
