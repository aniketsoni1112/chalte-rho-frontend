import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";

export default function Settings() {
  const navigate = useNavigate();
  const { user, login } = useContext(AuthContext);
  const [tab, setTab] = useState("profile");
  const [profile, setProfile] = useState({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "" });
  const [addresses, setAddresses] = useState([
    { type: "Home", icon: "🏠", address: "Sector 21, Indore" },
    { type: "Work", icon: "💼", address: "Palasia Square, Indore" },
  ]);
  const [newAddr, setNewAddr] = useState({ type: "Other", address: "" });
  const [contacts, setContacts] = useState([{ name: "Mom", phone: "9876543210" }]);
  const [newContact, setNewContact] = useState({ name: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const saveProfile = async () => {
    setLoading(true);
    try {
      const res = await API.put("/user/profile", profile);
      login({ token: localStorage.getItem("token"), user: res.data });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { alert("Failed to save"); }
    setLoading(false);
  };

  const addAddress = async () => {
    if (!newAddr.address) return alert("Enter address");
    try {
      await API.post("/user/addresses", newAddr);
      setAddresses((p) => [...p, newAddr]);
      setNewAddr({ type: "Other", address: "" });
    } catch { setAddresses((p) => [...p, newAddr]); setNewAddr({ type: "Other", address: "" }); }
  };

  const addContact = async () => {
    if (!newContact.name || !newContact.phone) return alert("Fill all fields");
    try {
      await API.post("/user/emergency-contacts", newContact);
      setContacts((p) => [...p, newContact]);
      setNewContact({ name: "", phone: "" });
    } catch { setContacts((p) => [...p, newContact]); setNewContact({ name: "", phone: "" }); }
  };

  const TABS = ["profile", "addresses", "emergency", "preferences"];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-yellow-500 px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-white text-xl font-bold">←</button>
        <h1 className="text-white font-black text-xl">Settings</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mx-4 mt-4 overflow-x-auto pb-1">
        {[
          { id: "profile", label: "👤 Profile" },
          { id: "addresses", label: "📍 Addresses" },
          { id: "emergency", label: "🆘 Emergency" },
          { id: "preferences", label: "⚙️ Prefs" },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`whitespace-nowrap px-3 py-2 rounded-xl text-xs font-bold transition-all ${tab === t.id ? "bg-yellow-500 text-white shadow" : "bg-white text-gray-500"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3">

        {/* ── PROFILE ── */}
        {tab === "profile" && (
          <div className="space-y-3">
            {/* Avatar */}
            <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center text-white text-2xl font-black">
                {profile.name?.[0] || "U"}
              </div>
              <div>
                <p className="font-black text-gray-800">{profile.name || "Your Name"}</p>
                <p className="text-gray-400 text-xs">{profile.email || profile.phone}</p>
              </div>
            </div>

            {[
              { key: "name", label: "Full Name", placeholder: "Your full name", type: "text" },
              { key: "email", label: "Email", placeholder: "your@email.com", type: "email" },
              { key: "phone", label: "Phone", placeholder: "10-digit number", type: "tel" },
            ].map((f) => (
              <div key={f.key} className="bg-white rounded-2xl p-4 shadow-sm">
                <label className="text-xs font-bold text-gray-400">{f.label}</label>
                <input type={f.type} value={profile[f.key]}
                  onChange={(e) => setProfile((p) => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full mt-1 text-gray-800 font-semibold outline-none border-b border-gray-100 pb-1"
                  placeholder={f.placeholder} />
              </div>
            ))}

            <button onClick={saveProfile} disabled={loading}
              className={`w-full font-black py-4 rounded-2xl text-lg transition-all ${saved ? "bg-green-500 text-white" : "bg-yellow-500 text-white"} disabled:opacity-60`}>
              {saved ? "✅ Saved!" : loading ? "Saving..." : "Save Profile"}
            </button>
          </div>
        )}

        {/* ── ADDRESSES ── */}
        {tab === "addresses" && (
          <div className="space-y-3">
            <p className="font-bold text-gray-700">Saved Places</p>
            {addresses.map((a, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
                <span className="text-2xl">{a.icon}</span>
                <div className="flex-1">
                  <p className="font-bold text-gray-800 text-sm">{a.type}</p>
                  <p className="text-gray-500 text-xs">{a.address}</p>
                </div>
                <button onClick={() => setAddresses((p) => p.filter((_, j) => j !== i))}
                  className="text-red-400 text-sm font-bold">✕</button>
              </div>
            ))}

            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
              <p className="font-bold text-gray-700 text-sm">Add New Address</p>
              <div className="flex gap-2">
                {["Home", "Work", "Other"].map((t) => (
                  <button key={t} onClick={() => setNewAddr((p) => ({ ...p, type: t }))}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${newAddr.type === t ? "border-yellow-500 bg-yellow-50 text-yellow-700" : "border-gray-100 text-gray-500"}`}>
                    {t}
                  </button>
                ))}
              </div>
              <input value={newAddr.address} onChange={(e) => setNewAddr((p) => ({ ...p, address: e.target.value }))}
                className="w-full border-2 border-gray-200 focus:border-yellow-400 rounded-xl p-3 outline-none text-sm"
                placeholder="Enter address" />
              <button onClick={addAddress}
                className="w-full bg-yellow-500 text-white font-bold py-3 rounded-xl">+ Add Address</button>
            </div>
          </div>
        )}

        {/* ── EMERGENCY CONTACTS ── */}
        {tab === "emergency" && (
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3">
              <p className="text-red-700 font-bold text-sm">🆘 Emergency Contacts</p>
              <p className="text-red-500 text-xs mt-1">These contacts will be notified with your live location when you press SOS.</p>
            </div>

            {contacts.map((c, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-500 font-black">
                  {c.name[0]}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800 text-sm">{c.name}</p>
                  <p className="text-gray-500 text-xs">{c.phone}</p>
                </div>
                <button onClick={() => setContacts((p) => p.filter((_, j) => j !== i))}
                  className="text-red-400 text-sm font-bold">✕</button>
              </div>
            ))}

            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
              <p className="font-bold text-gray-700 text-sm">Add Emergency Contact</p>
              <input value={newContact.name} onChange={(e) => setNewContact((p) => ({ ...p, name: e.target.value }))}
                className="w-full border-2 border-gray-200 focus:border-yellow-400 rounded-xl p-3 outline-none text-sm"
                placeholder="Contact Name" />
              <input type="tel" value={newContact.phone} onChange={(e) => setNewContact((p) => ({ ...p, phone: e.target.value }))}
                className="w-full border-2 border-gray-200 focus:border-yellow-400 rounded-xl p-3 outline-none text-sm"
                placeholder="Phone Number" />
              <button onClick={addContact}
                className="w-full bg-red-500 text-white font-bold py-3 rounded-xl">+ Add Contact</button>
            </div>
          </div>
        )}

        {/* ── PREFERENCES ── */}
        {tab === "preferences" && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <p className="font-bold text-gray-700">Language</p>
              {["English", "Hindi", "Marathi"].map((lang) => (
                <button key={lang}
                  className="w-full flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-gray-700 font-semibold text-sm">{lang}</span>
                  {lang === "English" && <span className="text-yellow-500 font-black">✓</span>}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <p className="font-bold text-gray-700">Notifications</p>
              {[
                { label: "Ride Updates", on: true },
                { label: "Offers & Promotions", on: true },
                { label: "App Updates", on: false },
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
