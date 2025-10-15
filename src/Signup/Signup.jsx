import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Signup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");

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
      const res = await axios.post("http://localhost:5000/api/signup", form);

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

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-700 to-blue-500 overflow-hidden">
      {/* Back Button */}
      <div className="absolute top-6 left-6 z-10">
        <button
          onClick={() => navigate("/")}
          className="text-white hover:text-gray-200 transition-colors text-lg font-semibold"
        >
          ⬅ Back
        </button>
      </div>

      {/* Signup Container */}
      <div
        className="w-[1920px] h-[1080px] flex bg-white shadow-2xl rounded-2xl overflow-hidden border-4 border-blue-800"
        style={{
          maxWidth: "1920px",
          maxHeight: "1080px",
        }}
      >
        {/* Left Side - Visual Section */}
        <div className="w-1/2 bg-blue-800 text-white flex flex-col justify-center items-center">
          <h2 className="text-5xl font-extrabold mb-6">Join Us Today</h2>
          <p className="text-2xl text-blue-200 text-center px-16">
            Create your account and become part of <strong>Tekton Geometrix</strong>.
          </p>
        </div>

        {/* Right Side - Form Section */}
        <div className="w-1/2 bg-white text-blue-800 flex flex-col justify-center items-center px-24">
          <h2 className="text-4xl font-bold mb-6">Sign Up</h2>

          {message && (
            <div className="bg-blue-100 text-blue-700 p-4 rounded-md mb-6 text-center w-full">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-6">
            <input
              type="text"
              name="fullname"
              placeholder="Full Name"
              value={form.fullname}
              onChange={handleChange}
              required
              className="w-full border border-blue-400 p-4 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full border border-blue-400 p-4 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full border border-blue-400 p-4 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              className="w-full border border-blue-400 p-4 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />

            <button
              type="submit"
              className="w-full bg-blue-700 text-white py-4 rounded-lg hover:bg-blue-800 transition-all text-lg font-semibold"
            >
              SIGN UP
            </button>
          </form>

          <p className="text-center mt-8 text-gray-600 text-lg">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-blue-700 font-semibold hover:underline"
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
