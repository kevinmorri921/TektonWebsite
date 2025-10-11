import React, { useState } from "react";
import { Link } from "react-router-dom";

function DeleteAccount() {
  const [status, setStatus] = useState("");

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your account?")) return;

    try {
      const response = await fetch("http://localhost:5000/delete-account", {
        method: "POST",
        credentials: "include", // include cookies for session
        headers: { "Content-Type": "application/json" }
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("Account deleted successfully. Redirecting...");
        setTimeout(() => {
          window.location.href = "/signup"; // redirect like PHP
        }, 2000);
      } else {
        setStatus(data.message || "Error deleting account");
      }
    } catch (error) {
      setStatus("Server error.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* Left column - info/illustration */}
        <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-blue-600 to-blue-400 text-white rounded-lg p-10">
          <h3 className="text-2xl font-bold mb-4">Delete Account</h3>
          <p className="text-sm text-blue-100">
            Deleting your account will remove your data permanently. This action cannot be undone.
            Please make sure you have exported any data you need before proceeding.
          </p>
        </div>

        {/* Right column - action card */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 sm:p-8">
            <h2 className="text-center text-lg sm:text-xl font-semibold text-gray-800 mb-6">
              Are you sure you want to delete your account?
            </h2>

            <div className="flex flex-col items-center gap-4">
              <button
                onClick={handleDelete}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-md transition-colors"
              >
                Yes, Delete My Account
              </button>

              <Link to="/profile" className="text-blue-600 hover:underline">
                Cancel
              </Link>

              {status && (
                <p className="mt-4 text-center text-sm text-gray-700">{status}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeleteAccount;
