import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8200`;

const API = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {},
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = token;
  return req;
});

export default API;
export { BASE_URL };
