import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../utils/apiClient";
import bgImage from "../assets/bg-pics.jpg";

const Signup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");

  // Animation state for staggered fade-in
  const [animate, setAnimate] = useState({
    container: false,
    leftSection: false,
    rightSection: false,
    inputs: [false, false, false, false],
    button: false,
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.fullname || !form.email || !form.password || !form.confirmPassword) {
      return setMessage("⚠ Please fill in all fields.");
    }

    if (form.password !== form.confirmPassword) {
      return setMessage("⚠ Passwords do not match.");
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/api/signup`, form);

      if (res.data.success) {
        setMessage("✅ Registration successful! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setMessage(res.data.message || "❌ Registration failed. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setMessage("⚠ Server error. Please try again later.");
    }
  };

  // Trigger staggered animation on mount
  useEffect(() => {
    setAnimate((prev) => ({ ...prev, container: true }));

    const timers = [
      setTimeout(() => setAnimate((prev) => ({ ...prev, leftSection: true })), 200),
      setTimeout(() => setAnimate((prev) => ({ ...prev, rightSection: true })), 400),
      setTimeout(() =>
        setAnimate((prev) => ({
          ...prev,
          inputs: [true, false, false, false],
        }))
      , 600),
      setTimeout(() =>
        setAnimate((prev) => ({
          ...prev,
          inputs: [true, true, false, false],
        }))
      , 800),
      setTimeout(() =>
        setAnimate((prev) => ({
          ...prev,
          inputs: [true, true, true, false],
        }))
      , 1000),
      setTimeout(() =>
        setAnimate((prev) => ({
          ...prev,
          inputs: [true, true, true, true],
        }))
      , 1200),
      setTimeout(() => setAnimate((prev) => ({ ...prev, button: true })), 1400),
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
        className={`flex w-[700px] h-[450px] bg-[#323548]/80 backdrop-blur-lg rounded-[1.8rem] shadow-2xl overflow-hidden mt-[-25px] transition-all duration-1000 ${
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
            LET'S GET STARTED!
          </h2>
          <p className="text-gray-300 text-[12px] leading-relaxed">
            Create your account and become part of <br />
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
            Create Account
          </h2>

          {message && (
            <div className="bg-indigo-900/50 text-indigo-200 p-2 rounded-lg mb-3 text-center w-full text-[13px] transition-all duration-700">
              {message}
            </div>
          )}

          <form className="w-full space-y-3" onSubmit={handleSubmit}>
            <input
              type="text"
              name="fullname"
              placeholder="Full Name"
              value={form.fullname}
              onChange={handleChange}
              required
              className={`w-full p-2.5 pl-5 rounded-full text-[12px] bg-gradient-to-r from-[#43425d] to-[#59517e] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 border-none transition-all duration-700 ${
                animate.inputs[0] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
              }`}
            />

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className={`w-full p-2.5 pl-5 rounded-full text-[12px] bg-gradient-to-r from-[#43425d] to-[#59517e] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 border-none transition-all duration-700 ${
                animate.inputs[1] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
              }`}
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              className={`w-full p-2.5 pl-5 rounded-full text-[12px] bg-gradient-to-r from-[#43425d] to-[#59517e] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 border-none transition-all duration-700 ${
                animate.inputs[2] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
              }`}
            />

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              className={`w-full p-2.5 pl-5 rounded-full text-[12px] bg-gradient-to-r from-[#43425d] to-[#59517e] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 border-none transition-all duration-700 ${
                animate.inputs[3] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
              }`}
            />

            <button
              type="submit"
              className={`mt-3 py-2 px-8 rounded-full bg-gradient-to-r from-[#59517e] to-[#423e66] font-semibold text-sm text-white hover:opacity-85 transition-all mx-auto block ${
                animate.button ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
              }`}
            >
              SIGN UP
            </button>
          </form>

          <p className="text-gray-400 text-[11px] mt-3 text-center transition-all duration-700">
            Already have an account?{" "}
            <a onClick={() => navigate("/login")} className="text-indigo-300 underline cursor-pointer">
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
