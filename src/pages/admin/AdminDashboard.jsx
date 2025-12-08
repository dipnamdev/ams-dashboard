import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { Users, UserCheck, UserX, Plus } from 'lucide-react';
import api from '../../services/api';
import { formatDurationFromSeconds } from '../../utils/formatTime';

function AdminDashboard() {
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
      setTeamOverview(response.data.data?.overview || null);
    } catch (error) {
      console.error('Error fetching team overview:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'active') return '🟢';
    if (status === 'idle') return '🟡';
    return '🔴';
  };

  const getStatusColor = (status) => {
    if (status === 'active') return 'text-green-600';
    if (status === 'idle') return 'text-yellow-600';
    return 'text-red-600';
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
          <h2 className="text-3xl font-bold">Admin Dashboard</h2>
          <button
            onClick={() => navigate('/admin/employees')}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            <span>Manage Employees</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Employees</p>
                <p className="text-3xl font-bold text-blue-600">
                  {teamOverview?.total_employees || 0}
                </p>
              </div>
              <Users size={48} className="text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Present Today</p>
                <p className="text-3xl font-bold text-green-600">
                  {teamOverview?.present_today || 0}
                </p>
              </div>
              <UserCheck size={48} className="text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Absent</p>
                <p className="text-3xl font-bold text-red-600">
                  {teamOverview?.absent || 0}
                </p>
              </div>
              <UserX size={48} className="text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">Active Employees</h3>
          {teamOverview?.employees && teamOverview.employees.length > 0 ? (
            <div className="space-y-3">
              {teamOverview.employees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getStatusIcon(employee.status)}</span>
                    <div>
                      <p className="font-medium">{employee.name}</p>
                      <p className={`text-sm ${getStatusColor(employee.status)}`}>
                        {employee.status === 'active' && `Active - ${formatDurationFromSeconds(employee.active_time)}`}
                        {employee.status === 'idle' && `Idle - ${employee.idle_minutes}m`}
                        {employee.status === 'not_checked_in' && 'Not Checked In'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/admin/reports?employee=${employee.id}`)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No employee data available</p>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate('/admin/employees')}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left"
          >
            <h3 className="text-lg font-bold mb-2">Manage Employees</h3>
            <p className="text-gray-600">Create, edit, or remove employee accounts</p>
          </button>
          <button
            onClick={() => navigate('/admin/reports')}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left"
          >
            <h3 className="text-lg font-bold mb-2">View Reports</h3>
            <p className="text-gray-600">Generate detailed attendance and productivity reports</p>
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
