import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Calendar, Trash2, X, Clock, Monitor, MousePointer, Image as ImageIcon, User } from 'lucide-react';
import api from '../services/api';
import { formatDateTime, formatDurationFromSeconds } from '../utils/formatTime';

function Screenshots() {
  const [screenshots, setScreenshots] = useState([]);
  const [activityHistory, setActivityHistory] = useState([]);
  const [dailySummary, setDailySummary] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState(import.meta.env.VITE_BACKEND_BASE_URL || '');
  const [failedImages, setFailedImages] = useState({});
  const [authToken, setAuthToken] = useState('');

  useEffect(() => {
    fetchAllData();
  }, [selectedDate]);

  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (token) setAuthToken(token);
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [screenshotRes, activityRes, attendanceRes] = await Promise.all([
        api.get(`/api/screenshots/list?date=${selectedDate}`),
        api.get('/api/activity/history', {
          params: { date: selectedDate }
        }),
        api.get('/api/attendance/history', {
          params: { start_date: selectedDate, end_date: selectedDate }
        })
      ]);

      setScreenshots(screenshotRes.data.data?.screenshots || []);
      setActivityHistory(activityRes.data.data?.history || []);

      const history = attendanceRes.data.data?.history || [];
      setDailySummary(history.length > 0 ? history[0] : null);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this screenshot?')) return;

    try {
      await api.delete(`/api/screenshots/${id}`);
      setScreenshots(screenshots.filter(s => s.id !== id));
      if (selectedImage?.id === id) {
        setSelectedImage(null);
      }
    } catch (error) {
      alert('Failed to delete screenshot');
    }
  };

  const getImageUrl = (screenshot, type = 'thumbnail') => {
    if (!apiBaseUrl) return '';
    const variant = type === 'full' ? 'full' : 'thumbnail';
    const cacheBuster = new Date(screenshot.timestamp).getTime();
    const tokenParam = authToken ? `&token=${encodeURIComponent(authToken)}` : '';
    return `${apiBaseUrl}/api/screenshots/${screenshot.id}/file?type=${variant}&t=${cacheBuster}${tokenParam}`;
  };

  const renderThumbnail = (screenshot) => {
    const src = getImageUrl(screenshot, 'thumbnail');
    if (!apiBaseUrl || !src || failedImages[screenshot.id]) {
      return (
        <div className="bg-gray-200 h-48 flex items-center justify-center">
          <span className="text-4xl">📷</span>
        </div>
      );
    }
    return (
      <img
        src={src}
        alt={screenshot.active_application || 'Screenshot thumbnail'}
        className="h-48 w-full object-cover"
        onError={() =>
          setFailedImages((prev) => ({
            ...prev,
            [screenshot.id]: true,
          }))
        }
      />
    );
  };

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Activity</h1>
          <p className="mt-2 text-gray-600">View your daily activity logs, screenshots, and work summary.</p>
        </div>

        {/* Date Selector */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Select Date</h2>
            <div className="flex items-center space-x-2">
              <Calendar size={20} className="text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Daily Summary Cards */}
        {dailySummary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">Check In/Out</h3>
                <Clock className="text-blue-500" size={20} />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">
                  {dailySummary.check_in_time ? formatTime(dailySummary.check_in_time) : '--:--'}
                </p>
                <p className="text-sm text-gray-500">
                  to {dailySummary.check_out_time ? formatTime(dailySummary.check_out_time) : '--:--'}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">Total Work</h3>
                <Monitor className="text-green-500" size={20} />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatDurationFromSeconds(dailySummary.total_work_duration || 0)}
              </p>
              <p className="text-sm text-gray-500">Active Duration</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">Idle Time</h3>
                <MousePointer className="text-yellow-500" size={20} />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatDurationFromSeconds(dailySummary.total_idle_duration || 0)}
              </p>
              <p className="text-sm text-gray-500">Total Idle Duration</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">Break Time</h3>
                <Clock className="text-orange-500" size={20} />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatDurationFromSeconds(dailySummary.total_break_duration || 0)}
              </p>
              <p className="text-sm text-gray-500">Total Break Duration</p>
            </div>
          </div>
        )}

        {/* Screenshot Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setSelectedImage(null)}>
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="font-bold text-lg">{selectedImage.active_application || 'Screenshot'}</h3>
                <p className="text-sm text-gray-500">{new Date(selectedImage.timestamp).toLocaleString()}</p>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-100 flex items-center justify-center">
              <img
                src={getImageUrl(selectedImage, 'full')}
                alt={selectedImage.active_application || 'Screenshot'}
                className="max-w-full max-h-[70vh] object-contain shadow-lg"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/800x600?text=Failed+to+load+image'; }}
              />
            </div>
            <div className="p-4 border-t bg-white">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Window Title:</span> {selectedImage.active_window_title || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Activity Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Clock size={20} className="text-blue-600" />
                  Activity Timeline
                </h2>
                <span className="text-sm text-gray-500">{activityHistory.length} records found</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
                    <tr>
                      <th className="px-6 py-3">Time</th>
                      <th className="px-6 py-3">Application</th>
                      <th className="px-6 py-3">Window Title</th>
                      <th className="px-6 py-3 text-center">Duration</th>
                      <th className="px-6 py-3 text-center">Input Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {activityHistory.length > 0 ? (
                      activityHistory.map((log, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                            {formatTime(log.start_time)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Monitor size={16} className="text-gray-400" />
                              <span className="font-medium text-gray-800">{log.active_application || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 max-w-xs truncate" title={log.active_window_title}>
                            {log.active_window_title || '-'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${log.activity_type === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                              {formatDurationFromSeconds(log.duration || 0)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1" title="Mouse Clicks">
                                <MousePointer size={14} /> {log.mouse_clicks || 0}
                              </span>
                              <span className="flex items-center gap-1" title="Keyboard Strokes">
                                <span className="font-mono border border-gray-300 rounded px-1">K</span> {log.keyboard_strokes || 0}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                          No activity records found for this date.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Screenshots Grid */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ImageIcon size={20} className="text-purple-600" />
                  Screenshots
                </h2>
                <span className="text-sm text-gray-500">{screenshots.length} screenshots</span>
              </div>

              <div className="p-6">
                {screenshots.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {screenshots.map((shot) => (
                      <div
                        key={shot.id}
                        className="group relative bg-gray-50 rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedImage(shot)}
                      >
                        <div className="aspect-video bg-gray-200 relative overflow-hidden">
                          <img
                            src={getImageUrl(shot, 'thumbnail')}
                            alt="Screenshot"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'; }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity" />
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-medium text-gray-900 mb-1">{formatTime(shot.timestamp)}</p>
                          <p className="text-xs text-gray-500 truncate" title={shot.active_window_title}>
                            {shot.active_window_title || 'Unknown Window'}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(shot.id);
                          }}
                          className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <ImageIcon size={48} className="mx-auto text-gray-300 mb-4" />
                    <p>No screenshots available for this date.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>


    </div>
  );
}

export default Screenshots;
