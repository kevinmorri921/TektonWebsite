import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post("http://localhost:5000/api/login", form);

      if (res.data.success) {
        console.log("✅ Login success — navigating to dashboard now");
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("fullname", res.data.fullname);
        navigate("/dashboard");
      } else {
        setMessage(res.data.message || "Login failed. Please try again.");
      }
    } catch (err) {
      console.error("Login error:", err.response ? err.response.data : err.message);
      setMessage(err.response?.data?.message || "⚠ Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-blue-600 to-blue-400 text-white flex">
      {/* Back Button */}
      <div className="absolute top-6 left-6">
        <button
          onClick={() => navigate("/")}
          className="text-white hover:text-gray-200 transition-colors"
        >
          ⬅ Back
        </button>
      </div>

      {/* Left Side */}
      <div className="w-1/2 h-full bg-blue-700 flex flex-col items-center justify-center text-center text-white px-10">
        <h2 className="text-5xl font-bold mb-6">Welcome Back</h2>
        <p className="text-xl text-blue-100">
          Log in to access your Tekton Geometrix account.
        </p>
      </div>

      {/* Right Side */}
      <div className="w-1/2 h-full bg-white text-blue-800 flex flex-col justify-center items-center p-16">
        <h2 className="text-4xl font-bold mb-6">Login</h2>

        {message && (
          <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4 w-96 text-center">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-96 space-y-5">
          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full border border-blue-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full border border-blue-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="text-right">
            <a href="#" className="text-blue-700 hover:underline text-sm">
              Forgot Password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-700 text-white py-3 rounded-lg font-semibold transition-all ${
              loading ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-800"
            }`}
          >
            {loading ? "Logging in..." : "LOGIN"}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-700">
          Don’t have an account?{" "}
          <button
            onClick={() => navigate("/signup")}
            className="text-blue-700 hover:underline"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
