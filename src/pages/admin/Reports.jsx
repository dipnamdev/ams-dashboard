import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { Download, BarChart3, Loader2, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatDurationFromSeconds } from '../../utils/formatTime';
import * as XLSX from 'xlsx';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function Reports() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employees, setEmployees] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const [registerMonth, setRegisterMonth] = useState(now.getMonth() + 1);
  const [registerYear, setRegisterYear] = useState(now.getFullYear());
  const [registerLoading, setRegisterLoading] = useState(false);

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
      const [response] = await Promise.all([
        api.get(url),
        new Promise(resolve => setTimeout(resolve, 600)) // Ensure visual loader is seen
      ]);
      setReportData(response.data.data?.report || null);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = () => {
    if (!reportData) return;

    // Get selected employee's name
    const employeeObj = employees.find(emp => String(emp.id) === String(selectedEmployee));
    const employeeName = employeeObj ? employeeObj.name : 'All_Employees';

    const wb = XLSX.utils.book_new();

    const sortedRecords = reportData.attendance_records
      ? [...reportData.attendance_records].sort((a, b) => new Date(a.date) - new Date(b.date))
      : [];
      
    const recordsData = [
      ['Date', 'Check-In', 'Check-Out', 'Work Duration', 'Active Duration', 'Active Time - 8h']
    ];

    sortedRecords.forEach((attendance) => {
      const dateStr = attendance?.date ? new Date(attendance.date).toLocaleDateString() : 'N/A';
      const checkInStr = attendance?.check_in_time ? new Date(attendance.check_in_time).toLocaleTimeString() : 'N/A';
      const checkOutStr = attendance?.check_out_time ? new Date(attendance.check_out_time).toLocaleTimeString() : 'N/A';
      const workDur = formatDurationFromSeconds(attendance?.total_work_duration) || 'N/A';
      const activeDur = formatDurationFromSeconds(attendance?.total_active_duration) || 'N/A';
      
      // Calculate active time - 8h
      const diffSeconds = (attendance?.total_active_duration || 0) - 28800;
      const sign = diffSeconds >= 0 ? '+' : '-';
      const absDiff = Math.abs(diffSeconds);
      const hours = Math.floor(absDiff / 3600);
      const minutes = Math.floor((absDiff % 3600) / 60);
      const diffStr = hours > 0 ? `${sign}${hours}h ${minutes}m` : `${sign}${minutes}m`;
      const activeDiffStr = diffSeconds === 0 ? '0m' : diffStr;

      recordsData.push([
        dateStr,
        checkInStr,
        checkOutStr,
        workDur,
        activeDur,
        activeDiffStr
      ]);
    });

    const wsRecords = XLSX.utils.aoa_to_sheet(recordsData);
    XLSX.utils.book_append_sheet(wb, wsRecords, 'Attendance Details');

    const fileName = `${employeeName}_${startDate}_${endDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const downloadMonthlyRegister = async () => {
    setRegisterLoading(true);
    try {
      const response = await api.get('/api/reports/monthly-register', {
        params: { month: registerMonth, year: registerYear },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const fileName = `Attendance_Register_${registerYear}-${String(registerMonth).padStart(2, '0')}.xlsx`;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      // With responseType: 'blob', an error response body also arrives as a
      // Blob, so it has to be read back out as text before it can be parsed
      // as the JSON error the backend actually sent.
      let message = 'Failed to download the monthly register.';
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const parsed = JSON.parse(text);
          message = parsed?.error?.message || message;
        } catch (_) {
          // Fall back to the generic message above
        }
      }
      console.error('Error downloading monthly register:', error);
      toast.error(message);
    } finally {
      setRegisterLoading(false);
    }
  };

  const chartData = reportData?.summary ? [
    { name: 'Active', value: Number(reportData.summary.total_active) || 0, hours: formatDurationFromSeconds(reportData.summary.total_active) },
    { name: 'Idle', value: Number(reportData.summary.total_idle) || 0, hours: formatDurationFromSeconds(reportData.summary.total_idle) },
    { name: 'Break', value: Number(reportData.summary.total_break) || 0, hours: formatDurationFromSeconds(reportData.summary.total_break) },
  ] : [];

  // Sort attendance records by date ascending for UI rendering
  const sortedRecords = reportData?.attendance_records
    ? [...reportData.attendance_records].sort((a, b) => new Date(a.date) - new Date(b.date))
    : [];

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
            onClick={exportExcel}
            disabled={!reportData || loading}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300"
          >
            <Download size={20} />
            <span>Export Excel</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <FileSpreadsheet className="mr-2" size={20} />
            Monthly Attendance Register
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Download the full-month IN/OUT register for all employees, formatted like the existing attendance sheet.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Month
              </label>
              <select
                value={registerMonth}
                onChange={(e) => setRegisterMonth(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <input
                type="number"
                value={registerYear}
                onChange={(e) => setRegisterYear(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end md:col-span-2">
              <button
                onClick={downloadMonthlyRegister}
                disabled={registerLoading}
                className="w-full flex items-center justify-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 h-[42px] disabled:bg-gray-300"
              >
                {registerLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    <span>Download Report</span>
                  </>
                )}
              </button>
            </div>
          </div>
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
                disabled={loading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 h-[42px] disabled:bg-blue-400"
              >
                {loading ? 'Fetching...' : 'Fetch Report'}
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-12 flex flex-col items-center justify-center mt-6">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-500 font-medium">Loading report details...</p>
          </div>
        ) : reportData ? (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h3 className="text-lg font-bold mb-4">Attendance Details</h3>

            {sortedRecords.length > 0 ? (
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
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border">
                        Active Time - 8h
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {sortedRecords.map((attendance, idx) => {
                      const diffSeconds = (attendance?.total_active_duration || 0) - 28800;
                      const sign = diffSeconds >= 0 ? '+' : '-';
                      const absDiff = Math.abs(diffSeconds);
                      const hours = Math.floor(absDiff / 3600);
                      const minutes = Math.floor((absDiff % 3600) / 60);
                      const diffStr = hours > 0 ? `${sign}${hours}h ${minutes}m` : `${sign}${minutes}m`;
                      const activeDiffStr = diffSeconds === 0 ? '0m' : diffStr;

                      return (
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

                          <td className={`px-4 py-2 border text-sm font-semibold ${diffSeconds >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {activeDiffStr}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No attendance records available</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default Reports;