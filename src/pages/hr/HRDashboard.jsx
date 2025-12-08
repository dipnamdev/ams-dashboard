import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { Users, UserCheck, UserX, BarChart3, Clock } from 'lucide-react';
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
            <div className="space-y-4">
              {teamOverview.employees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between p-5 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl hover:shadow-md hover:scale-[1.01] transition-all duration-200"
                >
                  {/* Employee Info */}
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold text-lg">
                      {employee.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">
                        {employee.name}{" "}
                        <span className="text-sm text-gray-500">({employee.employee_id})</span>
                      </p>
                      <p className="text-sm text-gray-600">{employee.email}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full ${employee.break_start_time && !employee.break_end_time
                              ? "bg-orange-100 text-orange-700"
                              : employee.status === "Checked In"
                                ? "bg-green-100 text-green-700"
                                : employee.status === "Checked Out"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 text-gray-600"
                            }`}
                        >
                          {employee.break_start_time && !employee.break_end_time
                            ? "On Lunch Break"
                            : employee.status || "N/A"}
                        </span>
                        {employee.total_work_duration > 0 && (
                          <span className="text-xs font-medium px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full">
                            Work: {formatDurationFromSeconds(employee.total_work_duration)}
                          </span>
                        )}
                        {employee.total_active_duration > 0 && (
                          <span className="text-xs font-medium px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full">
                            Active: {formatDurationFromSeconds(employee.total_active_duration)}
                          </span>
                        )}
                        {employee.total_idle_duration > 0 && (
                          <span className="text-xs font-medium px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                            Idle: {formatDurationFromSeconds(employee.total_idle_duration)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Time Info */}
                  <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end text-sm text-gray-600">
                    <p>
                      <span className="font-medium text-gray-800">Check-in:</span>{" "}
                      {employee.check_in_time
                        ? new Date(employee.check_in_time).toLocaleTimeString()
                        : "N/A"}
                    </p>
                    <p>
                      <span className="font-medium text-gray-800">Check-out:</span>{" "}
                      {employee.check_out_time
                        ? new Date(employee.check_out_time).toLocaleTimeString()
                        : "N/A"}
                    </p>
                    <p>
                      <span className="font-medium text-gray-800">Break-Out:</span>{" "}
                      {employee.break_out_time
                        ? new Date(employee.break_out_time).toLocaleTimeString()
                        : "N/A"}
                    </p>
                    <p>
                      <span className="font-medium text-gray-800">Break-In:</span>{" "}
                      {employee.break_in_time
                        ? new Date(employee.break_in_time).toLocaleTimeString()
                        : "N/A"}
                    </p>

                    <button
                      onClick={() => navigate(`/admin/reports?employee=${employee.id}`)}
                      className="mt-3 inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200"
                    >
                      <BarChart3 size={16} /> View Details
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