import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://localhost:8080/api",
});

// Attach JWT automatically
axiosClient.interceptors.request.use(
  (config) => {
    const auth = sessionStorage.getItem("auth");
    if (auth) {
      const token = JSON.parse(auth).token;
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle auth errors globally
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      sessionStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
