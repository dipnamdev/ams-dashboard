import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { Download, BarChart3 } from 'lucide-react';
import api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatDurationFromSeconds } from '../../utils/formatTime';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

function Reports() {
  const [reportType, setReportType] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
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
    if (reportType === 'daily' && selectedDate) {
      fetchReport();
    } else if (reportType === 'weekly' && startDate && endDate) {
      fetchReport();
    }
  }, [reportType, selectedDate, startDate, endDate, selectedEmployee]);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/api/users');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      let url = '';
      if (reportType === 'daily') {
        url = `/api/reports/daily?date=${selectedDate}${selectedEmployee ? `&user_id=${selectedEmployee}` : ''}`;
      } else {
        url = `/api/reports/weekly?start_date=${startDate}${selectedEmployee ? `&user_id=${selectedEmployee}` : ''}`;
      }
      const response = await api.get(url);
      setReportData(response.data);
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
    a.download = `report_${reportType}_${selectedDate}.csv`;
    a.click();
  };

  const chartData = reportData ? [
    { name: 'Active', value: reportData.active_time || 0, hours: formatDurationFromSeconds(reportData.active_time) },
    { name: 'Idle', value: reportData.idle_time || 0, hours: formatDurationFromSeconds(reportData.idle_time) },
    { name: 'Break', value: reportData.break_time || 0, hours: formatDurationFromSeconds(reportData.break_time) },
  ] : [];

  return (
    <div className="min-h-screen bg-gray-100">
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
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            {reportType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ) : (
              <>
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
              </>
            )}

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
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading report...</div>
        ) : reportData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Time Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, hours }) => `${name}: ${hours}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded">
                  <span className="font-medium">Total Hours</span>
                  <span className="text-xl font-bold text-blue-600">
                    {formatDurationFromSeconds(reportData.total_hours)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-green-50 rounded">
                  <span className="font-medium">Active Time</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatDurationFromSeconds(reportData.active_time)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-yellow-50 rounded">
                  <span className="font-medium">Idle Time</span>
                  <span className="text-xl font-bold text-yellow-600">
                    {formatDurationFromSeconds(reportData.idle_time)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-orange-50 rounded">
                  <span className="font-medium">Break Time</span>
                  <span className="text-xl font-bold text-orange-600">
                    {formatDurationFromSeconds(reportData.break_time)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-500">
            Select filters and click to generate report
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;
