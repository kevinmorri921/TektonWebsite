import React, { useEffect, useState } from 'react';
import axios from 'axios';

const EventLog = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const LOGS_PER_PAGE = 20;
  const API_URL = 'http://localhost:5000/api/activity-log';

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const params = new URLSearchParams({
        page: currentPage,
        limit: LOGS_PER_PAGE,
      });

      if (actionFilter) params.append('action', actionFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await axios.get(`${API_URL}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setLogs(response.data.data);
      setTotalPages(response.data.pagination.pages);
      setFilteredLogs(response.data.data);
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch logs on component mount and when filters change
  useEffect(() => {
    fetchLogs();
  }, [currentPage, actionFilter]);

  // Local search filtering
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLogs(logs);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = logs.filter(
      (log) =>
        log.username?.toLowerCase().includes(query) ||
        log.email?.toLowerCase().includes(query) ||
        log.role?.toLowerCase().includes(query) ||
        log.action?.toLowerCase().includes(query) ||
        log.details?.toLowerCase().includes(query)
    );
    setFilteredLogs(filtered);
  }, [searchQuery, logs]);

  const handleExportCSV = () => {
    if (logs.length === 0) {
      alert('No logs to export');
      return;
    }

    const csv = [
      ['Date', 'Time', 'Username', 'Email', 'Role', 'Action', 'Details'],
      ...logs.map((log) => {
        const date = new Date(log.createdAt);
        return [
          date.toLocaleDateString(),
          date.toLocaleTimeString(),
          log.username,
          log.email,
          log.role || '-',
          log.action,
          log.details || 'N/A',
        ];
      }),
    ];

    const csvContent = csv.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity-log-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getActionBadgeColor = (action) => {
    switch (action) {
      case 'Login':
        return 'bg-indigo-100 text-indigo-800';
      case 'Sign Out':
        return 'bg-slate-100 text-slate-800';
      case 'Uploaded Marker':
        return 'bg-blue-100 text-blue-800';
      case 'Downloaded File':
        return 'bg-green-100 text-green-800';
      case 'Updated Survey':
        return 'bg-yellow-100 text-yellow-800';
      case 'Deleted Marker':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4 mb-6 bg-white rounded-2xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-extrabold text-[#14142B] mb-2">EVENT LOG</h2>
        <button
          onClick={fetchLogs}
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
            placeholder="Search by username, email, action, or details..."
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

        {/* Action filter dropdown */}
        <div>
          <label htmlFor="action-filter" className="sr-only">Filter by action</label>
          <select
            id="action-filter"
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-gray-100 border border-gray-300 text-[#303345] py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Actions</option>
            <option value="Login">Login</option>
            <option value="Sign Out">Sign Out</option>
            <option value="Uploaded Marker">Uploaded Marker</option>
            <option value="Downloaded File">Downloaded File</option>
            <option value="Updated Survey">Updated Survey</option>
            <option value="Deleted Marker">Deleted Marker</option>
          </select>
        </div>

        {/* Export button */}
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors text-sm font-medium"
        >
          Export CSV
        </button>

        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            Clear
          </button>
        )}
        <div className="text-sm text-gray-600">
          {filteredLogs.length} {filteredLogs.length === 1 ? 'log' : 'logs'} found
        </div>
      </div>

      {/* Table with Scrollable Container */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <div className="overflow-auto max-h-[600px] border border-gray-200 rounded-xl">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
              <tr className="text-left">
                <th className="py-4 px-4 text-gray-600 font-medium whitespace-nowrap min-w-[140px]">Date & Time</th>
                <th className="py-4 px-4 text-gray-600 font-medium whitespace-normal min-w-[100px]">Username</th>
                <th className="py-4 px-4 text-gray-600 font-medium whitespace-normal min-w-[140px]">Email</th>
                <th className="py-4 px-4 text-gray-600 font-medium whitespace-nowrap min-w-[100px]">Role</th>
                <th className="py-4 px-4 text-gray-600 font-medium whitespace-nowrap min-w-[120px]">Action</th>
                <th className="py-4 px-4 text-gray-600 font-medium min-w-[250px]">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">
                    No activity logs found
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => (
                  <tr
                    key={log._id || index}
                    className="hover:bg-gray-50 transition-colors border-b border-gray-100"
                  >
                    <td className="py-5 px-4 text-gray-800 whitespace-nowrap min-w-[140px] text-sm">
                      {new Date(log.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-5 px-4 text-gray-700 whitespace-normal break-words min-w-[100px] text-sm font-medium">
                      {log.username}
                    </td>
                    <td className="py-5 px-4 text-gray-600 whitespace-normal break-words min-w-[140px] text-sm">
                      {log.email}
                    </td>
                    <td className="py-5 px-4 text-gray-600 whitespace-normal min-w-[100px]">
                      <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 rounded text-sm font-medium">
                        {log.role || '-'}
                      </span>
                    </td>
                    <td className="py-5 px-4 whitespace-nowrap min-w-[120px]">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-5 px-4 text-gray-600 min-w-[250px] whitespace-normal break-words text-sm">
                      {log.details || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {filteredLogs.length > 0 && (
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium">{filteredLogs.length}</span> of{' '}
            <span className="font-medium">{logs.length}</span> logs
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      currentPage === pageNum
                        ? 'bg-[#303345] text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && <span className="text-gray-600">...</span>}
            </div>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventLog;
