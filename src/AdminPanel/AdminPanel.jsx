import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
  const [editFormData, setEditFormData] = useState({ email: '', fullname: '', password: '' });
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
        password: ''  // Always empty for security
      });
    }
  }, [isEditModalOpen, editingUser]);

  const saveUserChanges = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/admin/users/${editingUser._id}`,
        {
          email: editFormData.email.trim(),
          fullname: editFormData.fullname.trim(),
          ...(editFormData.password ? { password: editFormData.password } : {})
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Update local state
      const updatedUsers = users.map(user =>
        user._id === editingUser._id ? { ...user, ...response.data.user } : user
      );
      setUsers(updatedUsers);
      setFilteredUsers(prevFiltered =>
        prevFiltered.map(user =>
          user._id === editingUser._id ? { ...user, ...response.data.user } : user
        )
      );

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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-gray-800 border-r border-gray-700">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-purple-400">Admin Panel</h1>
          <p className="text-sm text-gray-400 mt-1">Welcome back, {adminInfo.fullname}</p>
        </div>
        <nav className="mt-6">
          <div className="px-4 space-y-2">
            <button 
              onClick={() => setShowUsers(false)}
              className={`w-full text-left px-4 py-2 rounded ${!showUsers ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => {
                setShowUsers(true);
                if (!users.length) {
                  fetchUsers();
                }
              }}
              className={`w-full text-left px-4 py-2 rounded ${showUsers ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
            >
              User Management
            </button>
            <button className="w-full text-left px-4 py-2 rounded text-gray-300 hover:bg-gray-700">
              System Settings
            </button>
            <button className="w-full text-left px-4 py-2 rounded text-gray-300 hover:bg-gray-700">
              Analytics
            </button>
          </div>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <button
            onClick={() => {
              localStorage.clear();
              navigate('/login');
            }}
            className="w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold">Dashboard Overview</h2>
            <p className="text-gray-400">Monitor and manage your system</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm ${
              adminInfo.verified 
                ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/50' 
                : 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/50'
            }`}>
              {adminInfo.verified ? 'Verified Admin' : 'Verifying...'}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-gray-400 text-sm font-medium">Total Users</h3>
            <p className="text-3xl font-bold mt-2">{stats.totalUsers}</p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-gray-400 text-sm font-medium">Active Users</h3>
            <p className="text-3xl font-bold mt-2">{stats.activeUsers}</p>
            <div className="mt-2 text-blue-400 text-sm">Currently online</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-gray-400 text-sm font-medium">New Users Today</h3>
            <p className="text-3xl font-bold mt-2">{stats.newUsersToday}</p>
            <div className="mt-2 text-purple-400 text-sm">↑ 5 in last hour</div>
          </div>
          <div 
            className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50 cursor-pointer group relative"
            onClick={() => setShowLoginHistory(true)}
          >
            <h3 className="text-gray-400 text-sm font-medium">Login Activity</h3>
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
                    <span className="text-white truncate">{user.email}</span>
                  </div>
                ))}
            </div>
            <div className="mt-2 text-purple-400 text-sm">Click to view all</div>
          </div>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                  <span>New user registration</span>
                </div>
                <span className="text-sm text-gray-400">2 minutes ago</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                  <span>System backup completed</span>
                </div>
                <span className="text-sm text-gray-400">15 minutes ago</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-purple-400 rounded-full"></div>
                  <span>Configuration updated</span>
                </div>
                <span className="text-sm text-gray-400">1 hour ago</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => {
                  setShowUsers(true);
                  if (!users.length) {
                    fetchUsers();
                  }
                }}
                className={`w-full p-3 ${showUsers ? 'bg-purple-700' : 'bg-purple-600'} hover:bg-purple-700 rounded-lg transition-colors`}
              >
                Manage Users
              </button>
              <button className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                System Settings
              </button>
              <button className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                View Analytics
              </button>
              <button 
                onClick={() => navigate('/dashboard')}
                className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* User List Section */}
        {showUsers && (
          <div className="mt-8 bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50">
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">User Management</h3>
                <button
                  onClick={fetchUsers}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm"
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
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 pl-10 
                      text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 
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
                    className="bg-gray-700/50 border border-gray-600 text-white py-2 px-3 rounded-lg focus:outline-none"
                  >
                    <option value="all">All</option>
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>

                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    Clear
                  </button>
                )}
                <div className="text-sm text-gray-400">
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
                    <tr className="text-left border-b border-gray-700">
                      <th className="pb-4 px-6 text-gray-400 font-medium">Email</th>
                      <th className="pb-4 px-6 text-gray-400 font-medium">Full Name</th>
                      <th className="pb-4 px-6 text-gray-400 font-medium">Joined</th>
                      <th className="pb-4 px-6 text-gray-400 font-medium">Status</th>
                      <th className="pb-4 px-6 text-gray-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/30">
                    {filteredUsers.map((user, index) => (
                      <tr 
                        key={user._id || index}
                        className="hover:bg-gray-700/30 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-purple-600/20 flex items-center justify-center">
                              <span className="text-purple-400 text-sm">
                                {user.fullname?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                              </span>
                            </div>
                            <span className="text-gray-300">{user.email}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-gray-300">
                          {user.fullname || '-'}
                        </td>
                        <td className="py-4 px-6 text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            user.active 
                              ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/50' 
                              : 'bg-gray-500/20 text-gray-400 ring-1 ring-gray-500/50'
                          }`}>
                            {user.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            {/* Edit Button */}
                            <button
                              className={`flex items-center space-x-1 ${
                                user.email === 'super_admin@tekton.com'
                                  ? 'text-gray-500 cursor-not-allowed'
                                  : 'text-blue-400 hover:text-blue-300 hover:bg-blue-400/10'
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
                                  ? 'text-gray-500 cursor-not-allowed'
                                  : user.active
                                  ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10'
                                  : 'text-green-400 hover:text-green-300 hover:bg-green-400/10'
                              } transition-all rounded px-2 py-1`}
                              onClick={() => {
                                if (user.email === 'super_admin@tekton.com') return;
                                toggleUserStatus(user._id, user.active);
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
                                  d={user.active 
                                    ? "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"}
                                />
                              </svg>
                              <span>{user.active ? 'Deactivate' : 'Activate'}</span>
                            </button>

                            {/* Delete Button */}
                            <button
                              className={`flex items-center space-x-1 ${
                                user.email === 'super_admin@tekton.com'
                                  ? 'text-gray-500 cursor-not-allowed'
                                  : 'text-red-400 hover:text-red-300 hover:bg-red-400/10'
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
                        <td colSpan="5" className="py-8 text-center text-gray-400">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Edit User Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Edit User</h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={saveUserChanges} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    required
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.fullname}
                    onChange={(e) => setEditFormData({ ...editFormData, fullname: e.target.value })}
                    required
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    New Password (leave empty to keep current)
                  </label>
                  <input
                    type="password"
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Login History Modal */}
      {showLoginHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div className="relative bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 border border-gray-700/50">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Login History</h2>
              <button
                onClick={() => setShowLoginHistory(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-gray-800">
                  <tr className="text-left text-gray-400 text-sm">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Last Activity</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id} className="border-t border-gray-700">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${user.isEnabled ? 'bg-green-400' : 'bg-red-400'}`}></div>
                          <span className="text-white">{user.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-400">
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
                          user.isEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isEnabled ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;