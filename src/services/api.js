import axios from "axios";

const API = axios.create({
  baseURL: "http://100.77.40.41:5007/api",
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = token;
  return req;
});

export default API;