import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { Users, UserCheck, UserX, BarChart3, Clock, Mail, Fingerprint, Activity, Timer, ChevronRight, Hash, CalendarClock } from 'lucide-react';
import api from '../../services/api';
import { formatDurationFromSeconds } from '../../utils/formatTime';

function HRDashboard() {
  const [teamOverview, setTeamOverview] = useState(null);
  const [loading, setLoading] = useState(true);
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
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Users className="text-blue-600" size={28} /> Employees Overview
            </h3>
            <span className="text-sm text-gray-500">
              Updated: {new Date().toLocaleTimeString()}
            </span>
          </div>

          {teamOverview?.employees && teamOverview.employees.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {teamOverview.employees.map((employee) => (
                <div
                  key={employee.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
                >
                  {/* Card Header & Status */}
                  <div className="p-5 border-b border-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-md transform group-hover:scale-105 transition-transform duration-300
                            ${employee.status === "Checked In" ? "bg-gradient-to-br from-green-400 to-green-600" :
                            employee.break_start_time && !employee.break_end_time ? "bg-gradient-to-br from-orange-400 to-orange-600" :
                              "bg-gradient-to-br from-gray-400 to-gray-600"}`}
                        >
                          {employee.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {employee.name}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <Mail size={14} />
                            <span className="truncate max-w-[150px]">{employee.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-1 bg-gray-50 px-2 py-0.5 rounded-full w-fit">
                            <Hash size={12} />
                            <span>{employee.employee_id}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border
                          ${employee.break_start_time && !employee.break_end_time
                          ? "bg-orange-50 text-orange-600 border-orange-100"
                          : employee.status === "Checked In"
                            ? "bg-green-50 text-green-600 border-green-100"
                            : "bg-gray-50 text-gray-500 border-gray-100"}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${employee.break_start_time && !employee.break_end_time ? "bg-orange-500 animate-pulse" : employee.status === "Checked In" ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}></span>
                        {employee.break_start_time && !employee.break_end_time
                          ? "On Break"
                          : employee.status || "Offline"}
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 divide-x divide-gray-50 bg-gray-50/30">
                    <div className="p-4 text-center hover:bg-white transition-colors">
                      <div className="flex items-center justify-center gap-1.5 text-blue-600 mb-1">
                        <Clock size={16} />
                        <span className="text-xs font-semibold uppercase tracking-wider">Work</span>
                      </div>
                      <span className="font-mono font-medium text-gray-900">
                        {formatDurationFromSeconds(employee.total_work_duration)}
                      </span>
                    </div>
                    <div className="p-4 text-center hover:bg-white transition-colors">
                      <div className="flex items-center justify-center gap-1.5 text-purple-600 mb-1">
                        <Activity size={16} />
                        <span className="text-xs font-semibold uppercase tracking-wider">Active</span>
                      </div>
                      <span className="font-mono font-medium text-gray-900">
                        {formatDurationFromSeconds(employee.total_active_duration)}
                      </span>
                    </div>
                    <div className="p-4 text-center hover:bg-white transition-colors">
                      <div className="flex items-center justify-center gap-1.5 text-yellow-600 mb-1">
                        <Timer size={16} />
                        <span className="text-xs font-semibold uppercase tracking-wider">Idle</span>
                      </div>
                      <span className="font-mono font-medium text-gray-900">
                        {formatDurationFromSeconds(employee.total_idle_duration)}
                      </span>
                    </div>
                  </div>

                  {/* Break Info Banner */}
                  {(employee.break_start_time && !employee.break_end_time) && (
                    <div className="bg-orange-50 px-5 py-2 flex items-center justify-center gap-2 text-xs font-medium text-orange-700 border-y border-orange-100">
                      <Clock size={12} />
                      <span>Started break at {new Date(employee.break_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}

                  {/* Timeline Footer */}
                  <div className="p-4 flex items-center justify-between text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-gray-600">
                        <div className="w-6 text-xs text-gray-400">IN</div>
                        <span className={`font-medium ${employee.check_in_time ? "text-gray-900" : "text-gray-400"}`}>
                          {employee.check_in_time ? new Date(employee.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <div className="w-6 text-xs text-gray-400">OUT</div>
                        <span className={`font-medium ${employee.check_out_time ? "text-gray-900" : "text-gray-400"}`}>
                          {employee.check_out_time ? new Date(employee.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/admin/reports?employee=${employee.id}`)}
                      className="flex items-center gap-1 pl-4 pr-3 py-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 font-medium text-xs transition-colors"
                    >
                      Details <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
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