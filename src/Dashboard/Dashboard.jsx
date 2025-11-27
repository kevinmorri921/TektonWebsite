import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import bgImage from "../assets/db-pic.jpg";
import { Home, BarChart3, Settings, User, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [fullname, setFullname] = useState("");
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: new Date(),
    description: "",
  });

  // Check if user is admin or super admin
  const [isAdmin, setIsAdmin] = useState(false);

  // Delete confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3000);
  };

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedName = localStorage.getItem("fullname");
        
        // Check if user is admin or super admin from localStorage
        const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
        const userRole = currentUser.role || "";
        const userEmail = currentUser.email || "";
        
        // Check for admin role (case-insensitive) or super_admin email
        const isAdminRole = userRole.toLowerCase() === "admin" || userRole.toUpperCase() === "SUPER_ADMIN";
        const isSuperAdminEmail = userEmail === "super_admin@tekton.com";
        
        if (isAdminRole || isSuperAdminEmail) {
          setIsAdmin(true);
        } else {
          // Fallback: verify with backend
          try {
            const response = await axios.get("http://localhost:5000/api/admin/verify", {
              credentials: 'include'
            });
            if (response.status === 200) {
              setIsAdmin(true);
            }
          } catch (error) {
            setIsAdmin(false);
          }
        }
        
        if (storedName) {
          setFullname(storedName);
        } else {
          const response = await axios.get("https://your-api-endpoint.com/user");
          setFullname(response.data.fullname || "User");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [navigate]);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/events");
        setEvents(res.data);
      } catch (err) {
        console.error("Error fetching events:", err);
      }
    };
    fetchEvents();
  }, []);

  // Add or Edit Event
  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      if (newEvent._id) {
        // Editing existing event
        const res = await axios.put(
          `http://localhost:5000/api/events/${newEvent._id}`,
          newEvent
        );
        setEvents((prev) =>
          prev.map((event) => (event._id === res.data._id ? res.data : event))
        );
      } else {
        // Adding new event
        const res = await axios.post("http://localhost:5000/api/events", newEvent);
        setEvents((prev) => [...prev, res.data]);
      }
      setShowModal(false);
      setNewEvent({ title: "", date: new Date(), description: "" });
      showToast(newEvent._id ? "Event updated successfully" : "Event added successfully", "success");
    } catch (err) {
      console.error("Error saving event:", err);
      showToast("Failed to save event", "error");
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      // Call the logout endpoint to log the sign-out event
      await axios.post(
        'http://localhost:5000/api/logout',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Failed to log logout event:', error);
      // Continue with logout even if logging fails
    }
    
    // Clear all auth-related data from localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("fullname");
    localStorage.removeItem("userId");
    localStorage.removeItem("email");
    
    // Show success notification
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transition-opacity duration-500 z-50';
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>Logged out successfully</span>
      </div>
    `;
    document.body.appendChild(notification);
    
    // Remove notification after animation
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 500);
    }, 2000);

    // Redirect to login page
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#1E1E2A]">
        <p className="text-white text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div
      className="h-screen w-screen flex items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url(${bgImage})`,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex w-[90%] max-w-[1200px] h-[85vh] bg-[#F8F9FA] rounded-[2rem] shadow-2xl overflow-hidden"
      >
        {/* Sidebar */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative flex"
        >
          <aside className="w-[250px] bg-[#F8F9FA] flex flex-col py-6 px-6 rounded-l-[2rem]">
            <div>
              <p className="text-xl font-semibold italic text-center text-gray-800 mb-8 mt-6">
                Hi, <span className="font-bold">{fullname}</span>!
              </p>

              <nav className="space-y-5">
                {/*<motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => navigate("/dashboard")}
                  className="flex items-center gap-3 bg-[#303345] px-4 py-2 w-full rounded-xl text-left font-medium text-[#F8F9FA]"
                >
                  <Home size={18} /> Dashboard
                </motion.button>*/}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => navigate("/analytics")}
                  className="flex items-center gap-3 bg-[#F8F9FA] hover:bg-gray-100 px-4 py-2 w-full rounded-xl text-left font-medium text-[#303345] transition"
                >
                  <BarChart3 size={18} className="text-[#303345]" /> Analytics
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => navigate("/settings")}
                  className="flex items-center gap-3 bg-[#F8F9FA] hover:bg-gray-100 px-4 py-2 w-full rounded-xl text-left font-medium text-[#303345] transition"
                >
                  <Settings size={18} className="text-[#303345]" /> Settings
                </motion.button>
                {isAdmin && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => navigate("/admin")}
                    className="flex items-center gap-3 bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-2 w-full rounded-xl text-left font-medium text-white transition shadow-lg hover:shadow-purple-500/50 hover:from-purple-700 hover:to-purple-800"
                    title="Access the Admin Panel"
                  >
                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Go to Admin Panel
                  </motion.button>
                )}
              </nav>
            </div>

            {/* Profile + Logout */}
            <div className="space-y-4 mt-auto mb-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => navigate("/profile")}
                className="flex items-center gap-3 bg-[#F8F9FA] hover:bg-gray-100 px-4 py-2 w-full rounded-xl text-left font-medium text-[#303345] transition"
              >
                <User size={18} className="text-[#303345]" /> Profile
              </motion.button>
              <div className="border-t border-gray-300" />
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={handleLogout}
                className="flex items-center gap-3 bg-[#F8F9FA] hover:bg-gray-100 px-4 py-2 w-full rounded-xl text-left font-medium text-[#303345] transition"
              >
                <LogOut size={18} className="text-[#303345]" /> Log Out
              </motion.button>
            </div>
          </aside>

          <div className="w-[1px] bg-gray-300 my-8"></div>
        </motion.div>

        {/* Main Content */}
        <motion.main
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex-1 p-10 flex flex-col bg-[#F8F9FA] rounded-r-[2rem] overflow-auto"
        >
          <h2 className="text-2xl font-extrabold text-[#14142B] mb-2">
            WELCOME TO TEKTON GEOMETRIX INC
          </h2>
          <p className="text-sm text-gray-700 mb-6">
            Welcome Back! Here’s a quick look at your account activity.
          </p>

          {/* CALENDAR + TASKS */}
          <div className="flex gap-6 mb-6">
            {/* Calendar Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex-1 bg-white rounded-2xl shadow-md p-6 relative"
            >
              <h3 className="text-lg font-semibold mb-4 text-[#303345]">Calendar</h3>
              <div className="flex flex-col items-center">
                <Calendar
                  onChange={setDate}
                  value={date}
                  className="text-gray-800"
                  tileContent={({ date: tileDate }) => {
                    const hasEvent = events.some(
                      (event) =>
                        new Date(event.date).toDateString() === tileDate.toDateString()
                    );
                    return hasEvent ? (
                      <div className="flex justify-center mt-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full "></div>
                      </div>
                    ) : null;
                  }}
                />

                <button
                  onClick={() => {
                    setNewEvent({ ...newEvent, date });
                    setShowModal(true);
                  }}
                  className="mt-4 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg shadow-md font-semibold transition"
                >
                  + Add Event
                </button>

                <p className="mt-4 text-gray-700">
                  Selected date: <span className="font-semibold">{date.toDateString()}</span>
                </p>

                {/* Events on selected date with Edit/Delete */}
                <div className="mt-4 w-full">
                  {events
                    .filter(
                      (event) =>
                        new Date(event.date).toDateString() === date.toDateString()
                    )
                    .map((event) => (
                      <div
                        key={event._id}
                        className="bg-indigo-50 p-3 rounded-lg mb-2 text-slate-900 shadow-sm flex justify-between items-start border border-indigo-200"
                      >
                        <div>
                          <h4 className="font-bold text-slate-900">{event.title}</h4>
                          <p className="text-sm text-slate-700">{event.description}</p>
                        </div>

                        <div className="flex gap-2">
                          {/* Edit Button */}
                          <button
                            onClick={() => {
                              setNewEvent({
                                title: event.title,
                                description: event.description,
                                date: new Date(event.date),
                                _id: event._id,
                              });
                              setShowModal(true);
                            }}
                            className="px-2 py-1 bg-amber-400 hover:bg-amber-500 text-gray-900 rounded-md text-sm font-medium transition"
                          >
                            Edit
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => {
                              setEventToDelete(event);
                              setShowDeleteConfirm(true);
                            }}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}

                  {events.filter(
                    (event) => new Date(event.date).toDateString() === date.toDateString()
                  ).length === 0 && (
                    <p className="text-gray-500 text-sm italic">No events on this date.</p>
                  )}
                </div>
              </div>

              {/* Delete Event Confirmation Modal */}
              {showDeleteConfirm && eventToDelete && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                >
                  <motion.div
                    initial={{ scale: 0.95, y: -20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: -20 }}
                    className="bg-white rounded-2xl shadow-2xl p-6 w-[400px]"
                  >
                    <h3 className="text-xl font-bold text-slate-900 mb-4">Delete Event</h3>
                    
                    <p className="text-gray-700 mb-2">
                      Are you sure you want to delete this event?
                    </p>
                    <p className="text-sm text-gray-600 mb-6 font-medium">
                      {eventToDelete.title}
                    </p>

                    <p className="text-sm text-red-600 mb-6 bg-red-50 p-3 rounded-lg">
                      ⚠️ This action cannot be undone.
                    </p>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setEventToDelete(null);
                        }}
                        disabled={isDeleting}
                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            setIsDeleting(true);
                            await axios.delete(`http://localhost:5000/api/events/${eventToDelete._id}`);
                            setEvents((prev) =>
                              prev.filter((e) => e._id !== eventToDelete._id)
                            );
                            showToast("Event deleted successfully", "success");
                            setShowDeleteConfirm(false);
                            setEventToDelete(null);
                          } catch (err) {
                            console.error("Error deleting event:", err);
                            showToast("Unable to delete event. Please try again.", "error");
                          } finally {
                            setIsDeleting(false);
                          }
                        }}
                        disabled={isDeleting}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50"
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* Add/Edit Event Modal */}
              {/* Add/Edit Event Modal */}
              {showModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/30 backdrop-blur-sm flex justify-center items-center z-50"
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white p-6 rounded-2xl shadow-xl w-[400px]"
                  >
                    <h3 className="text-lg font-bold text-slate-900 mb-4">
                      {newEvent._id ? "Edit Event" : "Add Event"}
                    </h3>
                    <form onSubmit={handleAddEvent} className="flex flex-col gap-3">
                      <input
                        type="text"
                        placeholder="Title"
                        required
                        className="border-2 border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      />
                      <textarea
                        placeholder="Description"
                        className="border-2 border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white resize-none"
                        value={newEvent.description}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, description: e.target.value })
                        }
                      />
                      <input
                        type="date"
                        className="border-2 border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-gray-900 bg-white cursor-pointer"
                        value={new Date(newEvent.date).toISOString().split("T")[0]}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, date: new Date(e.target.value) })
                        }
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => setShowModal(false)}
                          className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium transition"
                        >
                          {newEvent._id ? "Update" : "Add"}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </motion.div>
              )}

            </motion.div>

            {/* TO DOs */}
            {/* TO DOs */}
            {/* TO DOs */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex-1 bg-white rounded-2xl shadow-md p-6 overflow-auto"
            >
              <h3 className="text-lg font-semibold mb-4 text-[#303345]">TO DOs</h3>

              {events.length === 0 ? (
                <p className="text-gray-500 italic">No events yet. Add one to get started!</p>
              ) : (
                <ul className="space-y-3 max-h-[300px] overflow-y-auto">
                  {[...events]
                    .filter((event) => new Date(event.date) >= new Date()) // optional: only show upcoming
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map((event) => (
                      <li
                        key={event._id}
                        onClick={() => setSelectedDate(new Date(event.date))}
                        className="p-3 bg-indigo-50 rounded-lg shadow-sm flex justify-between items-center cursor-pointer hover:bg-indigo-100 transition border border-indigo-200"
                      >
                        <div>
                          <h4 className="font-bold text-slate-900">{event.title}</h4>
                          <p className="text-sm text-slate-700">
                            {new Date(event.date).toLocaleDateString()} — {event.description}
                          </p>
                        </div>
                        {new Date(event.date).toDateString() === new Date().toDateString() && (
                          <span className="text-xs font-medium bg-[#303345] text-white px-2 py-1 rounded">
                            Today
                          </span>
                        )}
                      </li>
                    ))}
                </ul>
              )}
            </motion.div>
          </div>

          {/* Search bar */}
          {/* <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex justify-end mt-auto"
          >
            <input
              type="text"
              placeholder="Search"
              className="w-40 px-4 py-2 rounded-lg bg-[#C5CAE9] text-[#1F1F30] placeholder-gray-700 focus:outline-none"
            />
          </motion.div> */}
        </motion.main>
      </motion.div>

      {/* Toast Notification */}
      {toast.show && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 flex items-center space-x-2 ${
            toast.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {toast.type === "success" ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span>{toast.message}</span>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;
