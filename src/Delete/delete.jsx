import React, { useState } from "react";

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
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Are you sure you want to delete your account?</h2>
      <button
        onClick={handleDelete}
        style={{
          color: "white",
          background: "red",
          padding: "10px 20px",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Yes, Delete My Account
      </button>
      <br /><br />
      <a href="/profile">Cancel</a>
      <p>{status}</p>
    </div>
  );
}

export default DeleteAccount;
