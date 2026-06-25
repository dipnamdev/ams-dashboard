import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { 
  Calendar, Trash2, X, Clock, Monitor, MousePointer, 
  Image as ImageIcon, User, Save, CheckCircle, 
  AlertCircle, HelpCircle, Activity, Info, ChevronRight, FileText
} from 'lucide-react';
import api from '../services/api';
import { formatDurationFromSeconds } from '../utils/formatTime';

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
  
  // Daily Justification Note state
  const [dailyNote, setDailyNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

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
      const summary = history.length > 0 ? history[0] : null;
      setDailySummary(summary);
      setDailyNote(summary?.daily_note || '');
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedDate) return;
    setIsSavingNote(true);
    try {
      await api.post('/api/attendance/notes', {
        date: selectedDate,
        note: dailyNote
      });
      setDailySummary(prev => prev ? { ...prev, daily_note: dailyNote } : null);
      alert('Daily justification note saved successfully!');
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note. Please check backend connection.');
    } finally {
      setIsSavingNote(false);
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

  const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Helper to extract 10-minute window of activity logs around a screenshot
  const getScreenshotActivityLogs = (screenshotTimestamp) => {
    const ssTime = new Date(screenshotTimestamp).getTime();
    const windowStart = ssTime - 5 * 60 * 1000;
    const windowEnd = ssTime + 5 * 60 * 1000;
    
    return activityHistory.filter(log => {
      const logStart = new Date(log.start_time).getTime();
      const logEnd = log.end_time ? new Date(log.end_time).getTime() : logStart + (log.duration || 30) * 1000;
      return logStart <= windowEnd && logEnd >= windowStart;
    });
  };

  // Calculate timeline gaps (Idle & Untracked blocks)
  const getInactivePeriods = () => {
    if (!dailySummary || !dailySummary.activity_logs) return [];
    return dailySummary.activity_logs.filter(
      log => log.activity_type === 'idle' || log.activity_type === 'untracked' || log.activity_type === 'lunch_break'
    );
  };

  const inactivePeriods = getInactivePeriods();
  const screenshotActivityLogs = selectedImage ? getScreenshotActivityLogs(selectedImage.timestamp) : [];

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="text-indigo-600 w-8 h-8" />
              My Activity & Timeline
            </h1>
            <p className="mt-1 text-slate-500">Track and manage your time, review screenshots, and submit justification notes.</p>
          </div>
          
          {/* Date Selector */}
          <div className="mt-4 md:mt-0 flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200/80">
            <Calendar size={18} className="text-slate-400" />
            <span className="text-sm font-semibold text-slate-600">Select Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="font-medium text-slate-800 border-0 p-0 focus:ring-0 outline-none cursor-pointer"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center h-96 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
            <p className="text-slate-500 font-medium">Fetching details...</p>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Daily Summary Stats Grid */}
            {dailySummary ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                
                {/* Check In/Out */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold uppercase tracking-wider">Session</span>
                    <Clock className="text-blue-500 w-5 h-5" />
                  </div>
                  <div className="mt-3">
                    <p className="text-lg font-bold text-slate-800">
                      {dailySummary.check_in_time ? formatTime(dailySummary.check_in_time) : '--:--'}
                    </p>
                    <p className="text-xs text-slate-400">
                      to {dailySummary.check_out_time ? formatTime(dailySummary.check_out_time) : 'Active'}
                    </p>
                  </div>
                </div>

                {/* Total Work */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold uppercase tracking-wider">Total Work</span>
                    <Monitor className="text-emerald-500 w-5 h-5" />
                  </div>
                  <div className="mt-3">
                    <p className="text-xl font-extrabold text-slate-900">
                      {formatDurationFromSeconds(dailySummary.total_work_duration || 0)}
                    </p>
                    <p className="text-xs text-slate-400">Active + Idle</p>
                  </div>
                </div>

                {/* Total Tracked */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold uppercase tracking-wider">Tracked Time</span>
                    <Activity className="text-indigo-500 w-5 h-5" />
                  </div>
                  <div className="mt-3">
                    <p className="text-xl font-extrabold text-slate-900">
                      {formatDurationFromSeconds((dailySummary.total_active_duration || 0) + (dailySummary.total_idle_duration || 0))}
                    </p>
                    <p className="text-xs text-slate-400">App running time</p>
                  </div>
                </div>

                {/* Total Active */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold uppercase tracking-wider">Active</span>
                    <CheckCircle className="text-teal-500 w-5 h-5" />
                  </div>
                  <div className="mt-3">
                    <p className="text-xl font-extrabold text-slate-900">
                      {formatDurationFromSeconds(dailySummary.total_active_duration || 0)}
                    </p>
                    <p className="text-xs text-slate-400">Keyboard/Mouse input</p>
                  </div>
                </div>

                {/* Total Idle */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold uppercase tracking-wider">Idle</span>
                    <MousePointer className="text-amber-500 w-5 h-5" />
                  </div>
                  <div className="mt-3">
                    <p className="text-xl font-extrabold text-slate-900">
                      {formatDurationFromSeconds(dailySummary.total_idle_duration || 0)}
                    </p>
                    <p className="text-xs text-slate-400">Time away from PC</p>
                  </div>
                </div>

                {/* Untracked & Break */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold uppercase tracking-wider">Gaps / Break</span>
                    <AlertCircle className="text-slate-400 w-5 h-5" />
                  </div>
                  <div className="mt-3">
                    <p className="text-sm font-bold text-slate-800">
                      Break: {formatDurationFromSeconds(dailySummary.total_break_duration || 0)}
                    </p>
                    <p className="text-sm font-bold text-rose-600 mt-0.5">
                      Untracked: {formatDurationFromSeconds(dailySummary.untracked_time || 0)}
                    </p>
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-6 py-4 rounded-2xl flex items-center gap-3">
                <AlertCircle />
                <span className="font-medium">No active attendance record found for this date. Make sure to check in to start tracking.</span>
              </div>
            )}

            {/* Daily Note & Inactive Gaps Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Daily Justification Note */}
              <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm flex flex-col justify-between lg:col-span-1">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-2">
                    <FileText className="text-indigo-600 w-5 h-5" />
                    Daily Note & Justification
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">Provide reasons for idle or untracked intervals (e.g. meetings, power cuts).</p>
                  <textarea
                    value={dailyNote}
                    onChange={(e) => setDailyNote(e.target.value)}
                    rows={4}
                    placeholder="Write your note here... (e.g. Power failure from 1PM-2PM, Client call via mobile from 3:30PM)"
                    className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none bg-slate-50/50"
                  />
                </div>
                <button
                  onClick={handleSaveNote}
                  disabled={isSavingNote}
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-sm hover:shadow active:scale-95 disabled:bg-slate-300"
                >
                  <Save size={16} />
                  {isSavingNote ? 'Saving...' : 'Save Note'}
                </button>
              </div>

              {/* Inactive Periods & Gaps Summary */}
              <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm lg:col-span-2">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-2">
                  <Clock className="text-slate-600 w-5 h-5" />
                  Inactive & Untracked Time Periods
                </h3>
                <p className="text-xs text-slate-400 mb-4 font-normal">Lists exact windows when the tracking was stopped or you were idle.</p>
                
                <div className="space-y-3 overflow-y-auto max-h-56 pr-2">
                  {inactivePeriods.length > 0 ? (
                    inactivePeriods.map((period, index) => {
                      const isIdle = period.activity_type === 'idle';
                      const isBreak = period.activity_type === 'lunch_break';
                      
                      return (
                        <div 
                          key={index}
                          className={`flex items-center justify-between p-3 rounded-xl border ${
                            isBreak 
                              ? 'bg-orange-50/50 border-orange-100 text-orange-800' 
                              : isIdle 
                                ? 'bg-amber-50/50 border-amber-100 text-amber-800'
                                : 'bg-slate-50 border-slate-100 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded-md text-2xs font-extrabold uppercase ${
                              isBreak 
                                ? 'bg-orange-100 text-orange-700' 
                                : isIdle 
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-200 text-slate-600'
                            }`}>
                              {period.activity_type}
                            </span>
                            <span className="text-sm font-semibold">
                              {formatTime(period.start_time)} – {period.end_time ? formatTime(period.end_time) : 'Now'}
                            </span>
                          </div>
                          
                          <span className="text-xs font-bold font-mono">
                            {formatDurationFromSeconds(period.duration || 0)}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-150">
                      <CheckCircle className="mx-auto text-emerald-400 mb-2 w-8 h-8" />
                      <p className="text-sm font-medium">No idle or untracked gaps found today!</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Screenshots Grid */}
            <div className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <ImageIcon size={20} className="text-indigo-600" />
                  Captured Screenshots
                </h2>
                <span className="text-xs font-bold text-slate-500 bg-slate-200/80 px-2.5 py-1 rounded-full">{screenshots.length} Screenshots</span>
              </div>

              <div className="p-6">
                {screenshots.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {screenshots.map((shot) => (
                      <div
                        key={shot.id}
                        className="group relative bg-slate-50 rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-md hover:border-slate-300 transition-all duration-300 cursor-pointer"
                        onClick={() => setSelectedImage(shot)}
                      >
                        <div className="aspect-video bg-slate-200 relative overflow-hidden">
                          <img
                            src={getImageUrl(shot, 'thumbnail')}
                            alt="Screenshot"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'; }}
                          />
                          <div className="absolute inset-0 bg-indigo-950/0 group-hover:bg-indigo-950/20 transition-colors duration-300 flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-semibold bg-indigo-600/90 py-1.5 px-3 rounded-lg shadow transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">View Logs</span>
                          </div>
                        </div>
                        <div className="p-4 bg-white border-t border-slate-100">
                          <p className="text-xs font-bold text-indigo-600 mb-1">{formatTime(shot.timestamp)}</p>
                          <p className="text-sm font-semibold text-slate-800 truncate" title={shot.active_window_title}>
                            {shot.active_window_title || 'Unknown Window'}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(shot.id);
                          }}
                          className="absolute top-2.5 right-2.5 bg-rose-600/90 text-white p-2 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-rose-700 transition-all shadow duration-200"
                          title="Delete Screenshot"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-400">
                    <ImageIcon size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="font-semibold text-slate-500">No screenshots available for this date.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Activity Timeline */}
            <div className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Activity size={20} className="text-indigo-600" />
                  Detailed Minute-by-Minute Timeline
                </h2>
                <span className="text-xs font-bold text-slate-500 bg-slate-200/80 px-2.5 py-1 rounded-full">{activityHistory.length} logs</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-55 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">Time</th>
                      <th className="px-6 py-4">Application</th>
                      <th className="px-6 py-4">Window Title</th>
                      <th className="px-6 py-4 text-center">Duration</th>
                      <th className="px-6 py-4 text-center">Input Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activityHistory.length > 0 ? (
                      activityHistory.map((log, index) => (
                        <tr key={index} className="hover:bg-indigo-50/20 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-800 whitespace-nowrap">
                            {formatTime(log.start_time)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Monitor size={16} className="text-slate-400" />
                              <span className="font-semibold text-slate-700">{log.active_application || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 max-w-xs truncate font-medium text-slate-500" title={log.active_window_title}>
                            {log.active_window_title || '-'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase ${
                              log.activity_type === 'active' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {formatDurationFromSeconds(log.duration || 0)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-4 text-xs font-semibold text-slate-400">
                              <span className="flex items-center gap-1.5" title="Mouse Clicks">
                                <MousePointer size={13} className="text-slate-300" /> {log.mouse_clicks || 0}
                              </span>
                              <span className="flex items-center gap-1.5" title="Keyboard Strokes">
                                <span className="font-mono text-3xs border border-slate-200 rounded px-1 py-0.5 text-slate-300">K</span> {log.keyboard_strokes || 0}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium">
                          No activity records found for this date.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
          </div>
        )}
      </div>

      {/* Screenshot & Combined 10-Minute Activity Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-slate-900/85 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200" onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-bold rounded-lg uppercase">Screenshot log</span>
                  {selectedImage.active_application || 'Screenshot'}
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{new Date(selectedImage.timestamp).toLocaleString()}</p>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3">
              
              {/* Image View (Left) */}
              <div className="lg:col-span-2 overflow-auto p-6 bg-slate-900 flex flex-col justify-center items-center relative min-h-[300px]">
                <img
                  src={getImageUrl(selectedImage, 'full')}
                  alt="Full Screenshot"
                  className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-2xl border border-slate-700"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/800x600?text=Failed+to+load+image'; }}
                />
                
                {/* Details Footer */}
                <div className="mt-4 w-full bg-slate-800/80 backdrop-blur text-slate-200 p-4 rounded-xl text-xs border border-slate-700/50">
                  <p className="truncate"><span className="font-bold text-indigo-400">Window Title:</span> {selectedImage.active_window_title || 'N/A'}</p>
                  <p className="mt-1 flex items-center gap-4">
                    <span><span className="font-bold text-indigo-400">Application:</span> {selectedImage.active_application || 'N/A'}</span>
                    <span><span className="font-bold text-indigo-400">Resolution:</span> {selectedImage.screen_resolution || 'N/A'}</span>
                  </p>
                </div>
              </div>

              {/* 10-Minute Activity Window Logs (Right) */}
              <div className="lg:col-span-1 p-6 border-l border-slate-100 flex flex-col overflow-hidden max-h-[70vh]">
                <h4 className="text-md font-bold text-slate-800 flex items-center gap-2 mb-2">
                  <Activity className="text-indigo-600 w-4 h-4" />
                  10-Min Activity Window
                </h4>
                <p className="text-2xs text-slate-400 mb-4 font-normal">Shows exact user inputs & apps used 5 minutes before and after this screenshot.</p>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                  {screenshotActivityLogs.length > 0 ? (
                    screenshotActivityLogs.map((log, index) => (
                      <div key={index} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2 hover:bg-slate-100/50 transition-colors">
                        <div className="flex items-center justify-between text-2xs font-extrabold">
                          <span className="text-indigo-600">{formatTime(log.start_time)}</span>
                          <span className={`px-2 py-0.5 rounded uppercase ${
                            log.activity_type === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {log.activity_type}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 truncate" title={log.active_application}>
                            {log.active_application}
                          </p>
                          <p className="text-3xs text-slate-400 truncate mt-0.5" title={log.active_window_title}>
                            {log.active_window_title}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-3xs font-bold text-slate-400 border-t border-slate-200/60 pt-1.5">
                          <span>Clicks: {log.mouse_clicks || 0}</span>
                          <span>Keystrokes: {log.keyboard_strokes || 0}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      <Info className="mx-auto w-6 h-6 text-slate-300 mb-2" />
                      <p className="text-xs">No active logs in this 10-minute window.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default Screenshots;
