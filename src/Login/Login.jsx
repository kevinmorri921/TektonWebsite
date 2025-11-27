import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react"; // 👈 Added
import { API_BASE_URL } from "../utils/apiClient";
import bgImage from "../assets/bg-pics.jpg";

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 👈 Added state

  // Animation state
  const [animate, setAnimate] = useState({
    container: false,
    leftSection: false,
    rightSection: false,
    inputs: [false, false],
    button: false,
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setMessage("");

  try {
    const res = await axios.post(`${API_BASE_URL}/api/login`, form);

    if (res.data.success) {
      console.log("🔑 Login successful for:", form.email);

      // Store user info in localStorage (corrected)
      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          email: form.email,
          role: res.data.role   // Use role returned from backend
        })
      );
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("fullname", res.data.fullname);
      localStorage.setItem("email", res.data.email || form.email);

      // Redirect logic
      if (res.data.role === "admin" || form.email === 'super_admin@tekton.com') {
        console.log("👑 Admin access detected, redirecting to admin panel");
        navigate("/admin");
        return;
      } else {
        console.log("➡️ Redirecting to dashboard");
        navigate("/dashboard");
      }
    } else {
      setMessage(res.data.message || "Login failed. Please try again.");
    }
  } catch (err) {
    console.error(err);
    setMessage(err.response?.data?.message || "⚠ Server error. Please try again later.");
  } finally {
    setLoading(false);
  }
};


  // Trigger staggered animation on mount
  useEffect(() => {
    setAnimate((prev) => ({ ...prev, container: true }));

    const timers = [
      setTimeout(() => setAnimate((prev) => ({ ...prev, leftSection: true })), 200),
      setTimeout(() => setAnimate((prev) => ({ ...prev, rightSection: true })), 400),
      setTimeout(() => setAnimate((prev) => ({ ...prev, inputs: [true, false] })), 600),
      setTimeout(() => setAnimate((prev) => ({ ...prev, inputs: [true, true] })), 800),
      setTimeout(() => setAnimate((prev) => ({ ...prev, button: true })), 1000),
    ];

    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <div
      className={`h-screen w-screen flex items-center justify-center overflow-hidden transition-all duration-1000 ${
        animate.container ? "opacity-100" : "opacity-0"
      }`}
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Back Button */}
      <div
        className={`absolute top-4 right-4 z-10 transition-all duration-700 ${
          animate.container ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[-20px]"
        }`}
      >
        <button
          onClick={() => navigate("/")}
          className="bg-white text-gray-800 hover:bg-gray-200 hover:text-gray-700 transition-colors text-xs font-medium px-2 py-1 rounded"
        >
          ⬅ Back
        </button>
      </div>

      {/* Main Container */}
      <div
        className={`flex w-[700px] h-[400px] bg-[#323548]/80 backdrop-blur-lg rounded-[1.8rem] shadow-2xl overflow-hidden mt-[-25px] transition-all duration-1000 ${
          animate.container ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
        }`}
      >
        {/* Left Section */}
        <div
          className={`w-1/2 flex flex-col justify-center items-center px-6 text-center relative transition-all duration-1000 ${
            animate.leftSection ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-5"
          }`}
        >
          <h2
            className="text-2xl font-extrabold mb-2 tracking-wide text-white"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            WELCOME BACK!
          </h2>
          <p className="text-gray-300 text-[12px] leading-relaxed">
            Log in to your account and continue with <br />
            <span className="font-semibold text-white">TEKTON GEOMETRIX Inc.</span>
          </p>
          <div className="absolute right-0 top-[15%] h-[70%] w-[1.5px] bg-[#3c3d52]" />
        </div>

        {/* Right Section */}
        <div
          className={`w-1/2 flex flex-col justify-center items-center px-8 transition-all duration-1000 ${
            animate.rightSection ? "opacity-100 translate-x-0" : "opacity-0 translate-x-5"
          }`}
        >
          <h2
            className="text-xl font-bold mb-4 text-white"
            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
          >
            Hello!
          </h2>

          {message && (
            <div className="bg-red-900/50 text-red-200 p-2 rounded-lg mb-3 text-center w-full text-[13px] transition-all duration-700">
              {message}
            </div>
          )}

          <form className="w-full space-y-3" onSubmit={handleSubmit}>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className={`w-full p-2.5 pl-5 rounded-full text-[12px] bg-gradient-to-r from-[#43425d] to-[#59517e] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 border-none transition-all duration-700 ${
                animate.inputs[0] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
              }`}
            />

            {/* 👇 Password input with toggle */}
            <div
              className={`relative transition-all duration-700 ${
                animate.inputs[1] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
              }`}
            >
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full p-2.5 pl-5 pr-10 rounded-full text-[12px] bg-gradient-to-r from-[#43425d] to-[#59517e] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 border-none"
              />
              <div
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-300 cursor-pointer hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`mt-3 py-2 px-8 rounded-full bg-gradient-to-r from-[#59517e] to-[#423e66] font-semibold text-sm text-white hover:opacity-85 transition-all mx-auto block ${
                animate.button ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
              }`}
            >
              {loading ? "Logging in..." : "LOGIN"}
            </button>
          </form>

          <p className="text-gray-400 text-[11px] mt-3 text-center transition-all duration-700">
            Don’t have an account?{" "}
            <a onClick={() => navigate("/signup")} className="text-indigo-300 underline cursor-pointer">
              Sign Up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
