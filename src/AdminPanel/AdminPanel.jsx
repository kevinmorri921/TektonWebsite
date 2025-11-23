import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import bgImage from '../assets/db-pic.jpg';
import { BarChart3, Settings, User, LogOut, Users, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminPanel = () => {
  const [adminInfo, setAdminInfo] = useState({
    email: '',
    fullname: '',
    verified: false,
    error: null
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
    systemStatus: 'healthy'
  });
  const [showLoginHistory, setShowLoginHistory] = useState(false);
  const [loginHistory, setLoginHistory] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showUsers, setShowUsers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // userFilter: 'all' | 'online' | 'offline'
  const [userFilter, setUserFilter] = useState('all');
  // milliseconds: consider a user 'online' if lastLoginAt is within the last 5 minutes
  const ONLINE_WINDOW_MS = 5 * 60 * 1000;
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({ email: '', fullname: '', password: '', role: '' });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const navigate = useNavigate();

  // Reset form when modal closes
  useEffect(() => {
    if (!isEditModalOpen) {
      setEditingUser(null);
    } else if (editingUser) {
      setEditFormData({
        email: editingUser.email || '',
        fullname: editingUser.fullname || '',
        password: '',  // Always empty for security
        role: editingUser.role || 'Researcher'  // <-- populate role
      });
    }
  }, [isEditModalOpen, editingUser]);

  const saveUserChanges = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      
      // First, update email/fullname/password
      const response = await axios.put(
        `http://localhost:5000/api/admin/users/${editingUser._id}`,
        {
          email: editFormData.email.trim(),
          fullname: editFormData.fullname.trim(),
          ...(editFormData.password ? { password: editFormData.password } : {})
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Then, update role if it changed
      let updatedUserData = response.data.user;
      if (editFormData.role && editFormData.role !== editingUser.role) {
        const roleResponse = await axios.put(
          `http://localhost:5000/api/admin/users/${editingUser._id}/role`,
          { role: editFormData.role },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        updatedUserData = roleResponse.data.user;
      }

      // Update local state
      const updatedUsers = users.map(user =>
        user._id === editingUser._id ? { ...user, ...updatedUserData } : user
      );
      setUsers(updatedUsers);
      setFilteredUsers(prev => prev.map(user =>
        user._id === editingUser._id ? { ...user, ...updatedUserData } : user
      ));

      // Close modal and show success message
      setIsEditModalOpen(false);

      const notification = document.createElement('div');
      notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transition-opacity duration-500 z-50';
      notification.innerHTML = `
        <div class="flex items-center space-x-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>User updated successfully</span>
        </div>
      `;
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500);
      }, 3000);

    } catch (error) {
      console.error('Failed to update user:', error);
      
      const notification = document.createElement('div');
      notification.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg transition-opacity duration-500 z-50';
      notification.innerHTML = `
        <div class="flex items-center space-x-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>${error.response?.data?.message || 'Failed to update user. Please try again.'}</span>
        </div>
      `;
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500);
      }, 3000);
    }
  };

  const handleUserEdit = async (updatedData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/admin/users/${editingUser._id}`, updatedData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Update local state
      const updatedUsers = users.map(user => 
        user._id === editingUser._id ? { ...user, ...updatedData } : user
      );
      setUsers(updatedUsers);
      setFilteredUsers(prevFiltered => 
        prevFiltered.map(user => 
          user._id === editingUser._id ? { ...user, ...updatedData } : user
        )
      );

      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transition-opacity duration-500';
      notification.textContent = 'User updated successfully';
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500);
      }, 3000);

      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Failed to update user:', error);
      alert(error.response?.data?.message || 'Failed to update user. Please try again.');
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const newStatus = !currentStatus;

      console.log('Toggling user status:', { userId, currentStatus, newStatus });

      const response = await axios.put(
        `http://localhost:5000/api/admin/users/${userId}/toggle-status`,
        { 
          active: newStatus
        },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      console.log('Server response:', response.data);

      // Update local state
      const updatedUsers = users.map(user => 
        user._id === userId ? { ...user, active: newStatus } : user
      );
      setUsers(updatedUsers);
      setFilteredUsers(prevFiltered => 
        prevFiltered.map(user => 
          user._id === userId ? { ...user, active: newStatus } : user
        )
      );

      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transition-opacity duration-500 z-50';
      notification.innerHTML = `
        <div class="flex items-center space-x-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>Account ${!currentStatus ? 'activated' : 'deactivated'} successfully</span>
        </div>
      `;
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500);
      }, 3000);

    } catch (error) {
      console.error('Failed to toggle user status:', error);
      
      // Create error notification
      const notification = document.createElement('div');
      notification.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg transition-opacity duration-500 z-50';
      notification.innerHTML = `
        <div class="flex items-center space-x-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>${error.response?.data?.message || 'Failed to update account status. Please try again.'}</span>
        </div>
      `;
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500);
      }, 3000);
      
      // Refresh user list to ensure we have current data
      await fetchUsers();
    }
  };

  // helper to decide if a user is online (based on lastLoginAt)
  const isUserOnline = (user) => {
    if (!user || !user.lastLoginAt) return false;
    try {
      return (Date.now() - new Date(user.lastLoginAt).getTime()) < ONLINE_WINDOW_MS;
    } catch (e) {
      return false;
    }
  };

  // Filter users based on search query and online/offline filter
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();

    const matched = users.filter(user => {
      // search matching
      const matchesSearch = !q || (
        (user.email || '').toLowerCase().includes(q) ||
        (user.fullname || '').toLowerCase().includes(q)
      );

      // filter matching
      if (userFilter === 'all') return matchesSearch;
      const online = isUserOnline(user);
      if (userFilter === 'online' && online) return matchesSearch;
      if (userFilter === 'offline' && !online) return matchesSearch;
      return false;
    });

    setFilteredUsers(matched);
  }, [searchQuery, users, userFilter]);

  const fetchUsers = async () => {
    setUserLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const usersData = response.data || [];
      setUsers(usersData);
      setFilteredUsers(usersData);
      // Update total users count in stats
      setStats(prev => ({ ...prev, totalUsers: Array.isArray(usersData) ? usersData.length : 0 }));
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setUserLoading(false);
    }
  };

  const deleteUser = async (userId, userEmail) => {
    // Don't allow deletion of super admin
    if (userEmail === 'super_admin@tekton.com') {
      alert('Cannot delete super admin account');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Update local state to remove the deleted user
      const updatedUsers = users.filter(user => user._id !== userId);
      setUsers(updatedUsers);
      setFilteredUsers(prevFiltered => prevFiltered.filter(user => user._id !== userId));
  // update total users count
  setStats(prev => ({ ...prev, totalUsers: updatedUsers.length }));

      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transition-opacity duration-500';
      notification.textContent = 'User deleted successfully';
      document.body.appendChild(notification);

      // Remove notification after 3 seconds
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500);
      }, 3000);

    } catch (error) {
      console.error('Failed to delete user:', error);
      alert(error.response?.data?.message || 'Failed to delete user. Please try again.');
    }
  };

  useEffect(() => {
    const initializeAdmin = async () => {
      const token = localStorage.getItem('token');
      const email = localStorage.getItem('email');
      const fullname = localStorage.getItem('fullname');

      setAdminInfo(prev => ({
        ...prev,
        email,
        fullname
      }));

      try {
        // Verify admin status
        const verifyResponse = await axios.get('http://localhost:5000/api/admin/verify', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        setAdminInfo(prev => ({
          ...prev,
          verified: true,
          error: null
        }));

        // Fetch system stats
        const statsResponse = await axios.get('http://localhost:5000/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        setStats(statsResponse.data);
        // Also fetch full user list so we can display accurate total users
        try {
          await fetchUsers();
        } catch (e) {
          // fetchUsers already logs errors; ignore here
        }
      } catch (error) {
        console.error('Admin verification failed:', error.response?.data || error.message);
        setAdminInfo(prev => ({
          ...prev,
          verified: false,
          error: error.response?.data?.message || 'Verification failed'
        }));

        if (error.response?.status === 401 || error.response?.status === 403) {
          navigate('/login');
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAdmin();
  }, [navigate]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#1E1E2A]">
        <p className="text-white text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div
      className="h-screen w-screen flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex w-[90%] max-w-[1400px] h-[85vh] bg-[#F8F9FA] rounded-[2rem] shadow-2xl overflow-hidden"
      >
        {/* Sidebar */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative flex"
        >
          <aside className="w-[280px] bg-[#F8F9FA] flex flex-col py-6 px-6 rounded-l-[2rem]">
            <div>
              <p className="text-xl font-semibold italic text-center text-gray-800 mb-8 mt-6">
                Hi Admin, <span className="font-bold">{adminInfo.fullname}</span>
              </p>

              <nav className="space-y-5">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setShowUsers(false)}
                  className={`flex items-center gap-3 ${!showUsers ? 'bg-[#303345] text-white shadow-lg' : 'bg-[#F8F9FA] hover:bg-gray-100 text-[#303345]'} px-4 py-2 w-full rounded-xl text-left font-medium transition`}
                >
                  <Shield size={18} /> Dashboard
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => {
                    setShowUsers(true);
                    if (!users.length) {
                      fetchUsers();
                    }
                  }}
                  className={`flex items-center gap-3 ${showUsers ? 'bg-[#303345] text-white shadow-lg' : 'bg-[#F8F9FA] hover:bg-gray-100 text-[#303345]'} px-4 py-2 w-full rounded-xl text-left font-medium transition`}
                >
                  <Users size={18} /> User Management
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-3 bg-[#F8F9FA] hover:bg-gray-100 px-4 py-2 w-full rounded-xl text-left font-medium text-[#303345] transition"
                >
                  <BarChart3 size={18} /> Analytics
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-3 bg-[#F8F9FA] hover:bg-gray-100 px-4 py-2 w-full rounded-xl text-left font-medium text-[#303345] transition"
                >
                  <Settings size={18} /> Settings
                </motion.button>
              </nav>
            </div>

            {/* Profile + Logout */}
            <div className="space-y-4 mt-auto mb-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-3 bg-[#F8F9FA] hover:bg-gray-100 px-4 py-2 w-full rounded-xl text-left font-medium text-[#303345] transition"
              >
                <User size={18} /> Back to Dashboard
              </motion.button>
              <div className="border-t border-gray-300" />
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => {
                  localStorage.clear();
                  navigate('/login');
                }}
                className="flex items-center gap-3 bg-[#F8F9FA] hover:bg-gray-100 px-4 py-2 w-full rounded-xl text-left font-medium text-[#303345] transition"
              >
                <LogOut size={18} /> Sign Out
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
          className="flex-1 p-8 flex flex-col bg-[#F8F9FA] rounded-r-[2rem] overflow-auto"
        >
          <h2 className="text-3xl font-extrabold text-[#14142B] mb-2">
            ADMIN PANEL
          </h2>
          <p className="text-sm text-gray-700 mb-8">
            Manage users and monitor system statistics
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-md p-6"
            >
              <h3 className="text-gray-600 text-sm font-medium">Total Users</h3>
              <p className="text-3xl font-bold mt-2 text-[#303345]">{stats.totalUsers}</p>
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-md p-6"
            >
              <h3 className="text-gray-600 text-sm font-medium">Active Users</h3>
              <p className="text-3xl font-bold mt-2 text-[#303345]">{stats.activeUsers}</p>
              <div className="mt-2 text-purple-600 text-sm">Currently online</div>
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl shadow-md p-6"
            >
              <h3 className="text-gray-600 text-sm font-medium">New Users Today</h3>
              <p className="text-3xl font-bold mt-2 text-[#303345]">{stats.newUsersToday}</p>
              <div className="mt-2 text-purple-600 text-sm">↑ Recent signups</div>
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setShowLoginHistory(true)}
            >
      <h3 className="text-gray-600 text-sm font-medium">Login Activity</h3>
            <div className="mt-4 space-y-2">
              {users
                .filter(user => user.lastLoginAt) // Only show users who have logged in
                .sort((a, b) => new Date(b.lastLoginAt) - new Date(a.lastLoginAt)) // Sort by most recent login
                .slice(0, 3) // Take only the 3 most recent
                .map(user => (
                  <div 
                    key={user._id} 
                    className="flex items-center space-x-2 text-sm opacity-70 hover:opacity-100 transition-opacity"
                    title={`Last login: ${new Date(user.lastLoginAt).toLocaleString()}`}
                  >
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span className="text-[#303345] truncate">{user.email}</span>
                  </div>
                ))}
            </div>
            <div className="mt-2 text-purple-600 text-sm">Click to view all</div>
            </motion.div>
          </div>

        {/* User List Section */}
        {showUsers && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 bg-white rounded-2xl shadow-md p-6"
          >
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-extrabold text-[#14142B] mb-2"> USER MANAGEMENT</h2>
                <button
                  onClick={fetchUsers}
                  className="px-4 py-2 bg-[#303345] hover:bg-gray-600 text-white rounded-xl transition-colors text-sm font-medium"
                >
                  Refresh List
                </button>
              </div>

              {/* Search Bar + Filter */}
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users by email or name..."
                    className="w-full bg-gray-100 border border-gray-300 rounded-xl px-4 py-2 pl-10 
                      text-[#303345] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 
                      focus:border-transparent transition-all"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Online / Offline filter dropdown */}
                <div>
                  <label htmlFor="user-filter" className="sr-only">Filter users</label>
                  <select
                    id="user-filter"
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="bg-gray-100 border border-gray-300 text-[#303345] py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All</option>
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>

                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Clear
                  </button>
                )}
                <div className="text-sm text-gray-600">
                  {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
                </div>
              </div>
            </div>

            {userLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-200">
                      <th className="pb-4 px-6 text-gray-600 font-medium">Email</th>
                      <th className="pb-4 px-6 text-gray-600 font-medium">Full Name</th>
                      <th className="pb-4 px-6 text-gray-600 font-medium">Joined</th>
                      <th className="pb-4 px-6 text-gray-600 font-medium">Status</th>
                      <th className="pb-4 px-6 text-gray-600 font-medium">Role</th>
                      <th className="pb-4 px-6 text-gray-600 font-medium">Actions</th>

                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers.map((user, index) => (
                      <tr 
                        key={user._id || index}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-[#72768f] flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {user.fullname?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                              </span>
                            </div>
                            <span className="text-gray-800">{user.email}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-gray-700">
                          {user.fullname || '-'}
                        </td>
                        <td className="py-4 px-6 text-gray-600">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            user.isEnabled !== false
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {user.isEnabled !== false ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-gray-700">
                          {user.role || '-'}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            {/* Edit Button */}
                            <button
                              className={`flex items-center space-x-1 ${
                                user.email === 'super_admin@tekton.com'
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                              } transition-all rounded px-2 py-1`}
                              onClick={() => {
                                if (user.email === 'super_admin@tekton.com') return;
                                setEditingUser(user);
                                setIsEditModalOpen(true);
                              }}
                              disabled={user.email === 'super_admin@tekton.com'}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                              <span>Edit</span>
                            </button>

                            {/* Toggle Status Button */}
                            <button
                              className={`flex items-center space-x-1 ${
                                user.email === 'super_admin@tekton.com'
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : user.isEnabled !== false
                                  ? 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50'
                                  : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                              } transition-all rounded px-2 py-1`}
                              onClick={() => {
                                if (user.email === 'super_admin@tekton.com') return;
                                toggleUserStatus(user._id, user.isEnabled);
                              }}
                              disabled={user.email === 'super_admin@tekton.com'}
                              title={user.email === 'super_admin@tekton.com' ? 'Cannot modify super admin' : ''}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d={user.isEnabled !== false
                                    ? "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"}
                                />
                              </svg>
                              <span>{user.isEnabled !== false ? 'Deactivate' : 'Activate'}</span>
                            </button>

                            {/* Delete Button */}
                            <button
                              className={`flex items-center space-x-1 ${
                                user.email === 'super_admin@tekton.com'
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                              } transition-all rounded px-2 py-1`}
                              onClick={() => {
                                if (user.email === 'super_admin@tekton.com') return;
                                if (window.confirm(`Are you sure you want to delete ${user.email}? This action cannot be undone.`)) {
                                  deleteUser(user._id, user.email);
                                }
                              }}
                              disabled={user.email === 'super_admin@tekton.com'}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-gray-500">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* Edit User Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-[#303345]">Edit User</h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={saveUserChanges} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    required
                    className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-[#303345] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.fullname}
                    onChange={(e) => setEditFormData({ ...editFormData, fullname: e.target.value })}
                    required
                    className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-[#303345] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password (leave empty to keep current)
                  </label>
                  <input
                    type="password"
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-[#303345] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-[#303345] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="encoder">Encoder</option>
                    <option value="researcher">Researcher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>


                <div className="flex space-x-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    className="flex-1 bg-[#303345] hover:bg-gray-700 text-black-800 py-2 rounded-lg transition-colors font-medium"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Login History Modal */}
        {showLoginHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm"></div>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#303345]">Login History</h2>
                <button
                  onClick={() => setShowLoginHistory(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-white">
                    <tr className="text-left text-gray-700 text-sm border-b border-gray-200">
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Last Activity</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user._id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-2 h-2 rounded-full ${user.isEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="text-[#303345]">{user.email}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {user.lastLoginAt 
                            ? new Date(user.lastLoginAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'Never logged in'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.isEnabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {user.isEnabled ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
        </motion.main>
      </motion.div>
    </div>
  );
};

export default AdminPanel;



//editing  ADMINPANEL