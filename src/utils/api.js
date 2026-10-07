import axios from "axios";

const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);

// Use the address in the browser bar, so the IP site and https://devtinder.net both work.
export const BASE_URL = isLocal ? "http://localhost:3000" : `${window.location.origin}/api`;
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export const getErrorMessage = (err, fallback = "Something went wrong.") => {
  if (!err.response) {
    return "Unable to reach the server. Please try again later.";
  }
  const data = err.response.data;
  if (typeof data === "string" && data.trim()) return data;
  if (typeof data?.errors === "string") return data.errors;
  if (data?.errors && typeof data.errors === "object") {
    return Object.values(data.errors).join(" ");
  }
  return data?.message || data?.error || fallback;
};

export const sanitizeUser = ({ password: _password, ...user }) => user;

export const fetchProfile = async () => {
  const res = await api.get("/profile/view");
  return sanitizeUser(res.data);
};

export default api;
