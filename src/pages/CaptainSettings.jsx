import { useState, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";

export default function CaptainSettings() {
  const navigate = useNavigate();
  const { user, login } = useContext(AuthContext);
  const [tab, setTab] = useState("profile");
  const [profile, setProfile] = useState({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "" });
  const [profileImage, setProfileImage] = useState(user?.profileImage || "");
  const [vehicle, setVehicle] = useState({ model: "Honda Activa", number: user?.vehicleNo || "MP 09 AB 1234", type: user?.vehicle || "bike", rc: "", insurance: "" });
  const [navPref, setNavPref] = useState("inapp");
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const imgInputRef = useRef();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return alert("Image must be under 2MB");
    const reader = new FileReader();
    reader.onload = () => setProfileImage(reader.result);
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      const res = await API.put("/user/profile", { ...profile, profileImage });
      login({ token: localStorage.getItem("token"), user: res.data });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch { alert("Failed to save"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-900 px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-white text-xl font-bold">←</button>
        <h1 className="text-white font-black text-xl">⚙️ Settings</h1>
      </div>

      <div className="flex gap-1 mx-4 mt-4 overflow-x-auto pb-1">
        {[
          { id: "profile", label: "👤 Profile" },
          { id: "vehicle", label: "🏍️ Vehicle" },
          { id: "navigation", label: "🗺️ Navigation" },
          { id: "prefs", label: "🔔 Prefs" },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`whitespace-nowrap px-3 py-2 rounded-xl text-xs font-bold transition-all ${tab === t.id ? "bg-gray-900 text-white" : "bg-white text-gray-500"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3">

        {/* Profile */}
        {tab === "profile" && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
              <div className="relative">
                {profileImage ? (
                  <img src={profileImage} alt="profile"
                    className="w-16 h-16 rounded-full object-cover border-2 border-yellow-400" />
                ) : (
                  <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center text-white text-2xl font-black">
                    {profile.name?.[0] || "C"}
                  </div>
                )}
                <button onClick={() => imgInputRef.current.click()}
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center text-white text-xs shadow">
                  ✏️
                </button>
                <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>
              <div>
                <p className="font-black text-gray-800">{profile.name || "Captain"}</p>
                <p className="text-xs text-yellow-600 font-semibold mt-0.5">Tap ✏️ to change photo</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {[1,2,3,4,5].map(s => <span key={s} className="text-yellow-400 text-xs">★</span>)}
                  <span className="text-gray-400 text-xs ml-1">4.8</span>
                </div>
              </div>
            </div>
            {[
              { key: "name", label: "Full Name", type: "text" },
              { key: "email", label: "Email", type: "email" },
              { key: "phone", label: "Phone", type: "tel" },
            ].map((f) => (
              <div key={f.key} className="bg-white rounded-2xl p-4 shadow-sm">
                <label className="text-xs font-bold text-gray-400">{f.label}</label>
                <input type={f.type} value={profile[f.key]}
                  onChange={(e) => setProfile((p) => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full mt-1 text-gray-800 font-semibold outline-none border-b border-gray-100 pb-1" />
              </div>
            ))}
            <button onClick={saveProfile} disabled={loading}
              className={`w-full font-black py-4 rounded-2xl text-lg ${saved ? "bg-green-500 text-white" : "bg-yellow-500 text-white"} disabled:opacity-60`}>
              {saved ? "✅ Saved!" : loading ? "Saving..." : "Save Profile"}
            </button>
          </div>
        )}

        {/* Vehicle */}
        {tab === "vehicle" && (
          <div className="space-y-3">
            {[
              { key: "model", label: "Vehicle Model" },
              { key: "number", label: "License Plate" },
            ].map((f) => (
              <div key={f.key} className="bg-white rounded-2xl p-4 shadow-sm">
                <label className="text-xs font-bold text-gray-400">{f.label}</label>
                <input value={vehicle[f.key]} onChange={(e) => setVehicle((p) => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full mt-1 text-gray-800 font-semibold outline-none border-b border-gray-100 pb-1" />
              </div>
            ))}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-bold text-gray-400 mb-2">Vehicle Type</p>
              <div className="flex gap-2">
                {["bike", "auto", "cab"].map((t) => (
                  <button key={t} onClick={() => setVehicle((p) => ({ ...p, type: t }))}
                    className={`flex-1 py-2 rounded-xl border-2 text-sm font-bold capitalize transition-all ${vehicle.type === t ? "border-yellow-500 bg-yellow-50 text-yellow-700" : "border-gray-100 text-gray-500"}`}>
                    {t === "bike" ? "🏍️" : t === "auto" ? "🛺" : "🚗"} {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
              <p className="font-bold text-gray-700 text-sm">Documents</p>
              {[{ label: "RC Book", key: "rc" }, { label: "Insurance", key: "insurance" }].map((d) => (
                <div key={d.key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-gray-600 text-sm font-semibold">{d.label}</span>
                  <label className="bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-lg cursor-pointer">
                    Upload
                    <input type="file" className="hidden" accept="image/*,.pdf" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        {tab === "navigation" && (
          <div className="space-y-3">
            <p className="font-bold text-gray-700">Preferred Navigation App</p>
            {[
              { id: "inapp", label: "In-App Navigation", icon: "🗺️", desc: "Use built-in OpenStreetMap" },
              { id: "gmaps", label: "Google Maps", icon: "📍", desc: "Opens Google Maps for navigation" },
              { id: "waze", label: "Waze", icon: "🚗", desc: "Opens Waze for navigation" },
            ].map((n) => (
              <button key={n.id} onClick={() => setNavPref(n.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${navPref === n.id ? "border-yellow-500 bg-yellow-50" : "border-gray-100 bg-white"}`}>
                <span className="text-3xl">{n.icon}</span>
                <div className="text-left flex-1">
                  <p className="font-bold text-gray-800 text-sm">{n.label}</p>
                  <p className="text-gray-400 text-xs">{n.desc}</p>
                </div>
                {navPref === n.id && <span className="text-yellow-500 font-black">✓</span>}
              </button>
            ))}
          </div>
        )}

        {/* Preferences */}
        {tab === "prefs" && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <p className="font-bold text-gray-700">Language</p>
              {["English", "Hindi", "Marathi", "Telugu"].map((lang) => (
                <button key={lang} onClick={() => setLanguage(lang)}
                  className="w-full flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-gray-700 font-semibold text-sm">{lang}</span>
                  {language === lang && <span className="text-yellow-500 font-black">✓</span>}
                </button>
              ))}
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <p className="font-bold text-gray-700">Notification Sounds</p>
              {[
                { label: "Ride Request Buzzer", on: true },
                { label: "Earnings Updates", on: true },
                { label: "Promotional Alerts", on: false },
              ].map((n) => (
                <div key={n.label} className="flex items-center justify-between">
                  <span className="text-gray-700 font-semibold text-sm">{n.label}</span>
                  <div className={`w-11 h-6 rounded-full flex items-center px-1 transition-all ${n.on ? "bg-yellow-500" : "bg-gray-200"}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-all ${n.on ? "translate-x-5" : ""}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
