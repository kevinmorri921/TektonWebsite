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

  // Handle input changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle form submission
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
      // 👆 Replace with your backend signup route

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-blue-400 text-white">
      {/* Back Button */}
      <div className="absolute top-6 left-6">
        <button
          onClick={() => navigate("/")}
          className="text-white hover:text-gray-200 transition-colors"
        >
          ⬅ Back
        </button>
      </div>

      {/* Signup Container */}
      <div className="bg-white text-blue-800 shadow-2xl rounded-2xl flex flex-col md:flex-row overflow-hidden w-[90%] max-w-4xl">
        {/* Left Side */}
        <div className="flex-1 bg-blue-700 text-white flex flex-col items-center justify-center p-10">
          <h2 className="text-3xl font-bold mb-4">Join Us Today</h2>
          <p className="text-lg text-blue-100">
            Create your account and become part of Tekton Geometrix.
          </p>
        </div>

        {/* Right Side */}
        <div className="flex-1 p-10 flex flex-col justify-center">
          <h2 className="text-3xl font-bold mb-6 text-center">Sign Up</h2>

          {message && (
            <div className="bg-blue-100 text-blue-700 p-3 rounded-md mb-4 text-center">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <input
                type="text"
                name="fullname"
                placeholder="Full Name"
                value={form.fullname}
                onChange={handleChange}
                required
                className="w-full border border-blue-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
            <div>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                className="w-full border border-blue-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-700 text-white py-3 rounded-lg hover:bg-blue-800 transition-all font-semibold"
            >
              SIGN UP
            </button>
          </form>

          <p className="text-center mt-6 text-gray-700">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-blue-700 hover:underline"
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
