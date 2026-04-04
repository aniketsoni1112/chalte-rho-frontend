import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center bg-yellow-500 px-4 py-3 shadow-lg">
      <div>
        <h1 className="font-black text-white text-xl">🏍️ chalte rho</h1>
        <p className="text-yellow-100 text-xs">Hi, {user?.name || "Rider"} 👋</p>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => navigate("/history")}
          className="bg-yellow-400 text-white px-3 py-1.5 rounded-xl font-bold text-sm">
          🕒
        </button>
        {user?.role === "admin" && (
          <button onClick={() => navigate("/admin")}
            className="bg-yellow-400 text-white px-3 py-1.5 rounded-xl font-bold text-sm">
            ⚙️
          </button>
        )}
        <button onClick={logout}
          className="bg-white text-yellow-600 px-3 py-1.5 rounded-xl font-bold text-sm shadow">
          Logout
        </button>
      </div>
    </div>
  );
}
