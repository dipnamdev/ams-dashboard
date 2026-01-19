import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { Download, BarChart3 } from 'lucide-react';
import api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatDurationFromSeconds } from '../../utils/formatTime';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

function Reports() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employees, setEmployees] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchReport();
    }
  }, [startDate, endDate, selectedEmployee]);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/api/users');
      setEmployees(response.data.data?.users || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchReport = async () => {
    if (!startDate || !endDate) return;

    setLoading(true);
    try {
      const url = `/api/reports/weekly?start_date=${startDate}&end_date=${endDate}${selectedEmployee ? `&user_id=${selectedEmployee}` : ''}`;
      const response = await api.get(url);
      setReportData(response.data.data?.report || null);
      console.log(reportData)
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!reportData) return;

    const csvContent = [
      ['Metric', 'Value'],
      ['Total Hours', formatDurationFromSeconds(reportData.total_hours)],
      ['Active Time', formatDurationFromSeconds(reportData.active_time)],
      ['Idle Time', formatDurationFromSeconds(reportData.idle_time)],
      ['Break Time', formatDurationFromSeconds(reportData.break_time)],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${startDate}_to_${endDate}.csv`;
    a.click();
  };

  const chartData = reportData ? [
    { name: 'Active', value: reportData.active_time || 0, hours: formatDurationFromSeconds(reportData.active_time) },
    { name: 'Idle', value: reportData.idle_time || 0, hours: formatDurationFromSeconds(reportData.idle_time) },
    { name: 'Break', value: reportData.break_time || 0, hours: formatDurationFromSeconds(reportData.break_time) },
  ] : [];

  return (
    <div className="space-y-6">
      <Navbar />
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold flex items-center">
            <BarChart3 className="mr-2" />
            Reports
          </h2>
          <button
            onClick={exportCSV}
            disabled={!reportData}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300"
          >
            <Download size={20} />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>


            <div className="flex items-end">
              <button
                onClick={fetchReport}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 h-[42px]"
              >
                Fetch Report
              </button>
            </div>
          </div>
        </div>



        {reportData && (
          // <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          //   <h3 className="text-lg font-bold mb-4">Attendance Details</h3>
          //   {reportData.attendance_records && reportData.attendance_records.length > 0 ? (
          //     reportData.attendance_records.map((attendance, idx) => (
          //       <div key={idx} className="mb-4 border-b pb-2">
          //         <p><strong>Date:</strong> {attendance?.date ? new Date(attendance.date).toLocaleDateString() : 'N/A'}</p>
          //         <p><strong>Check-in:</strong> {attendance?.check_in_time ? new Date(attendance.check_in_time).toLocaleString() : 'N/A'}</p>
          //         <p><strong>Check-out:</strong> {attendance?.check_out_time ? new Date(attendance.check_out_time).toLocaleString() : 'N/A'}</p>
          //         {/* <p><strong>Check-in IP:</strong> {attendance?.check_in_ip || 'N/A'}</p> */}
          //         <p><strong>Total Work Duration:</strong> {formatDurationFromSeconds(attendance?.total_work_duration) || 'N/A'}</p>
          //         <p><strong>Total Active Duration:</strong> {formatDurationFromSeconds(attendance?.total_active_duration) || 'N/A'}</p>
          //         {/* <p><strong>Notes:</strong> {attendance?.notes || 'N/A'}</p> */}
          //       </div>
          //     ))
          //   ) : (
          //     <p className="text-gray-500">No attendance records available</p>
          //   )}
          // </div>
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h3 className="text-lg font-bold mb-4">Attendance Details</h3>

            {reportData.attendance_records &&
              reportData.attendance_records.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border">
                        Check-In
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border">
                        Check-Out
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border">
                        Work Duration
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border">
                        Active Duration
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {reportData.attendance_records.map((attendance, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="px-4 py-2 border text-sm">
                          {attendance?.date
                            ? new Date(attendance.date).toLocaleDateString()
                            : "N/A"}
                        </td>

                        <td className="px-4 py-2 border text-sm">
                          {attendance?.check_in_time
                            ? new Date(attendance.check_in_time).toLocaleTimeString()
                            : "N/A"}
                        </td>

                        <td className="px-4 py-2 border text-sm">
                          {attendance?.check_out_time
                            ? new Date(attendance.check_out_time).toLocaleTimeString()
                            : "N/A"}
                        </td>

                        <td className="px-4 py-2 border text-sm">
                          {formatDurationFromSeconds(
                            attendance?.total_work_duration
                          ) || "N/A"}
                        </td>

                        <td className="px-4 py-2 border text-sm">
                          {formatDurationFromSeconds(
                            attendance?.total_active_duration
                          ) || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No attendance records available</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;