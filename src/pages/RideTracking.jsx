import LiveMap from "../components/LiveMap";
import API from "../services/api";
import { useState } from "react";

export default function UserHome() {
  const [ride, setRide] = useState(null);

  const bookRide = async () => {
    const res = await API.post("/rides/request", {
      pickup: { lat: 22.7, lng: 75.8 },
      destination: { lat: 22.8, lng: 75.9 },
    });

    setRide(res.data);
  };

  return (
    <div className="p-4">
      <LiveMap position={[22.7, 75.8]} />

      <button onClick={bookRide} className="btn mt-4">
        Book Ride
      </button>

      {ride && (
        <div className="mt-4 bg-white p-4 shadow rounded">
          <p>Fare: ₹{ride.fare}</p>
          <p>OTP: {ride.otp}</p>
        </div>
      )}
    </div>
  );
}