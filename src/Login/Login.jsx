import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // for navigation
 

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  // Handle input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:5000/api/login", form); 
      // ^ Replace this with your backend login route

      if (res.data.success) {
        localStorage.setItem("token", res.data.token); // save JWT or session token
        localStorage.setItem("fullname", res.data.fullname);
        navigate("/dashboard"); // redirect to dashboard page
      } else {
        setMessage(res.data.message || "Login failed. Please try again.");
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

      {/* Login Container */}
      <div className="bg-white text-blue-800 shadow-2xl rounded-2xl flex flex-col md:flex-row overflow-hidden w-[90%] max-w-4xl">
        {/* Left Side */}
        <div className="flex-1 bg-blue-700 text-white flex flex-col items-center justify-center p-10">
          <h2 className="text-3xl font-bold mb-4">Welcome Back</h2>
          <p className="text-lg text-blue-100">
            Log in to access your Tekton Geometrix account.
          </p>
        </div>

        {/* Right Side */}
        <div className="flex-1 p-10 flex flex-col justify-center">
          <h2 className="text-3xl font-bold mb-6 text-center">Login</h2>

          {message && (
            <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-center">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
              className="w-full bg-blue-700 text-white py-3 rounded-lg hover:bg-blue-800 transition-all font-semibold"
            >
              LOGIN
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
    </div>
  );
};

export default Login;
