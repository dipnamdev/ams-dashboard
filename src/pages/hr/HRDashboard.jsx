import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { Users, UserCheck, UserX, BarChart3, Clock, Mail, Fingerprint, Activity, Timer, ChevronRight, Hash, CalendarClock, Search } from 'lucide-react';
import api from '../../services/api';
import { formatDurationFromSeconds } from '../../utils/formatTime';

function HRDashboard() {
  const [teamOverview, setTeamOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchTeamOverview();
    const interval = setInterval(fetchTeamOverview, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchTeamOverview = async () => {
    try {
      const date = new Date().toISOString().split('T')[0];
      const response = await api.get(`/api/reports/team-overview?date=${date}`);
      //   console.log(response.data.data);
      setTeamOverview(response.data.data?.overview || null);
    } catch (error) {
      console.error('Error fetching team overview:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">HR Dashboard</h2>
          <button
            onClick={() => navigate('/admin/reports')}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <BarChart3 size={20} />
            <span>View Reports</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Checked In</p>
                <p className="text-3xl font-bold text-blue-600">
                  {teamOverview?.summary?.total_checked_in || 0}
                </p>
              </div>
              <UserCheck size={48} className="text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Checked Out</p>
                <p className="text-3xl font-bold text-red-600">
                  {teamOverview?.summary?.total_checked_out || 0}
                </p>
              </div>
              <UserX size={48} className="text-red-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Employees</p>
                <p className="text-3xl font-bold text-green-600">
                  {teamOverview?.employees?.length || 0}
                </p>
              </div>
              <Users size={48} className="text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Active Duration</p>
                <p className="text-3xl font-bold text-purple-600">
                  {formatDurationFromSeconds(
                    parseFloat(teamOverview?.summary?.avg_active_duration || 0)
                  )}
                </p>
              </div>
              <Clock size={48} className="text-purple-600" />
            </div>
          </div>
        </div>

        {/* Employee List */}

        <div className="bg-white rounded-2xl shadow-lg p-8 transition-all duration-300 hover:shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Users className="text-blue-600" size={28} /> Employees Overview
            </h3>

            <div className="relative">
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full md:w-64"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
          </div>

          {!loading && teamOverview?.employees ? (
            <div className="space-y-4">
              {teamOverview.employees
                .filter(emp =>
                  emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  emp.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((employee) => (
                  <div
                    key={employee.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                      {/* Name & Basic Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start xl:block">
                          <div>
                            <h4 className="text-lg font-bold text-gray-900 truncate">
                              {employee.name}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                              <Mail size={14} className="flex-shrink-0" />
                              <span className="truncate">{employee.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                              <Hash size={12} />
                              <span>{employee.employee_id}</span>
                            </div>
                          </div>

                          {/* Mobile Status Badge */}
                          <div className="xl:hidden">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium border
                              ${employee.break_start_time && !employee.break_end_time
                                  ? "bg-orange-50 text-orange-600 border-orange-100"
                                  : employee.status === "Checked In"
                                    ? "bg-green-50 text-green-600 border-green-100"
                                    : "bg-gray-50 text-gray-500 border-gray-100"}`}
                            >
                              {employee.break_start_time && !employee.break_end_time
                                ? "On Break"
                                : employee.status || "Offline"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Timeline Grid */}
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 border-t xl:border-t-0 xl:border-l border-gray-100 pt-4 xl:pt-0 xl:pl-8">
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Check In</p>
                          <p className={`font-mono font-medium ${employee.check_in_time ? "text-gray-900" : "text-gray-400"}`}>
                            {employee.check_in_time ? new Date(employee.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Lunch Start</p>
                          <p className={`font-mono font-medium ${employee.break_out_time || employee.break_start_time ? "text-orange-700" : "text-gray-400"}`}>
                            {(employee.break_out_time || employee.break_start_time) ? new Date(employee.break_out_time || employee.break_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Lunch End</p>
                          <p className={`font-mono font-medium ${employee.break_in_time ? "text-green-700" : "text-gray-400"}`}>
                            {employee.break_in_time ? new Date(employee.break_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Check Out</p>
                          <p className={`font-mono font-medium ${employee.check_out_time ? "text-gray-900" : "text-gray-400"}`}>
                            {employee.check_out_time ? new Date(employee.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                          </p>
                        </div>
                      </div>

                      {/* Desktop Status Badge */}
                      <div className="hidden xl:flex items-center justify-end w-32">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border text-center w-full
                          ${employee.break_start_time && !employee.break_end_time
                              ? "bg-orange-50 text-orange-600 border-orange-100"
                              : employee.status === "Checked In"
                                ? "bg-green-50 text-green-600 border-green-100"
                                : "bg-gray-50 text-gray-500 border-gray-100"}`}
                        >
                          {employee.break_start_time && !employee.break_end_time
                            ? "On Break"
                            : employee.status || "Offline"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              {teamOverview.employees.length === 0 && (
                <p className="text-center text-gray-500 py-8">No employees found.</p>
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <Clock className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-lg">No employee data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HRDashboard;