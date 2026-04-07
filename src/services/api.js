import axios from "axios";

const API = axios.create({
  baseURL: "https://brown-dragons-drive.loca.lt/api",
  headers: { "bypass-tunnel-reminder": "true" },
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = token;
  return req;
});

export default API;