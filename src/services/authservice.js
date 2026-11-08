
import API from "./api";

// Register a new user
export const registerUser = async (userData) => {
  const response = await API.post("/auth/register", userData);

  if (response.data.token) {
    localStorage.setItem("token", response.data.token);
  }

  return response.data;
};

// Login existing user
export const loginUser = async (credentials) => {
  const response = await API.post("/auth/login", credentials);

  if (response.data.token) {
    localStorage.setItem("token", response.data.token);
  }

  return response.data;
};

// Logout user
export const logoutUser = () => {
  localStorage.removeItem("token");
};