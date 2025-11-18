import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Clock, Play, Square, Coffee, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { formatTime, formatDurationFromSeconds } from '../utils/formatTime';

function Dashboard() {
  const [attendance, setAttendance] = useState(null);
  const [lunchBreak, setLunchBreak] = useState(null);
  const [activity, setActivity] = useState(null);
  const [idleMinutes, setIdleMinutes] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);

    if (window.electronAPI) {
      window.electronAPI.onUserIdle(({ idleMinutes: mins }) => {
        setIdleMinutes(mins);
      });

      window.electronAPI.onAutoMarkIn(() => {
        handleMarkIn();
      });

      window.electronAPI.onActionMarkIn(() => {
        handleMarkIn();
      });

      window.electronAPI.onActionMarkOut(() => {
        handleMarkOut();
      });

      window.electronAPI.onActionLunchOut(() => {
        handleLunchOut();
      });

      window.electronAPI.onActionLunchIn(() => {
        handleLunchIn();
      });
    }

    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [attRes, lunchRes, activityRes] = await Promise.all([
        api.get('/api/attendance/today'),
        api.get('/api/lunch-break/current'),
        api.get('/api/activity/current')
      ]);
      
      setAttendance(attRes.data);
      setLunchBreak(lunchRes.data);
      setActivity(activityRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleMarkIn = async () => {
    setLoading(true);
    try {
      await api.post('/api/attendance/check-in');
      if (window.electronAPI) {
        window.electronAPI.startTracking();
        window.electronAPI.updateTrayStatus('Active');
        window.electronAPI.showNotification('Success', 'Marked in successfully!');
      }
      await fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to mark in');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkOut = async () => {
    setLoading(true);
    try {
      await api.post('/api/attendance/check-out');
      if (window.electronAPI) {
        window.electronAPI.stopTracking();
        window.electronAPI.updateTrayStatus('Not Marked In');
        window.electronAPI.showNotification('Success', 'Marked out successfully!');
      }
      await fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to mark out');
    } finally {
      setLoading(false);
    }
  };

  const handleLunchOut = async () => {
    setLoading(true);
    try {
      await api.post('/api/lunch-break/start');
      if (window.electronAPI) {
        window.electronAPI.updateTrayStatus('On Break');
        window.electronAPI.showNotification('Lunch Break', 'Enjoy your lunch!');
      }
      await fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to start lunch break');
    } finally {
      setLoading(false);
    }
  };

  const handleLunchIn = async () => {
    setLoading(true);
    try {
      await api.post('/api/lunch-break/end');
      if (window.electronAPI) {
        window.electronAPI.updateTrayStatus('Active');
        window.electronAPI.showNotification('Welcome Back', 'Lunch break ended');
      }
      await fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to end lunch break');
    } finally {
      setLoading(false);
    }
  };

  const isMarkedIn = attendance?.check_in_time && !attendance?.check_out_time;
  const isOnBreak = lunchBreak?.start_time && !lunchBreak?.end_time;
  const isIdle = idleMinutes >= 5;

  const getStatusInfo = () => {
    if (!isMarkedIn) return { text: 'Not Marked In', color: 'text-red-600', bg: 'bg-red-100', icon: '🔴' };
    if (isIdle) return { text: `Idle (${idleMinutes} minutes)`, color: 'text-yellow-600', bg: 'bg-yellow-100', icon: '🟡' };
    if (isOnBreak) return { text: 'On Break', color: 'text-orange-600', bg: 'bg-orange-100', icon: '☕' };
    return { text: 'Active', color: 'text-green-600', bg: 'bg-green-100', icon: '🟢' };
  };

  const status = getStatusInfo();

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-6xl mx-auto p-6">
        <div className={`${status.bg} ${status.color} p-6 rounded-lg shadow-md mb-6 flex items-center justify-between`}>
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{status.icon}</span>
            <div>
              <h2 className="text-xl font-bold">Status: {status.text}</h2>
              {isIdle && (
                <p className="text-sm flex items-center mt-1">
                  <AlertCircle size={16} className="mr-1" />
                  You have been inactive. Please check back in!
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <Clock className="mr-2" size={20} />
            TODAY'S SUMMARY
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded">
              <p className="text-sm text-gray-600">Check In</p>
              <p className="text-xl font-bold text-blue-600">{formatTime(attendance?.check_in_time)}</p>
            </div>
            <div className="p-4 bg-green-50 rounded">
              <p className="text-sm text-gray-600">Active Time</p>
              <p className="text-xl font-bold text-green-600">
                {formatDurationFromSeconds(attendance?.active_time || 0)}
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded">
              <p className="text-sm text-gray-600">Idle Time</p>
              <p className="text-xl font-bold text-yellow-600">
                {formatDurationFromSeconds(attendance?.idle_time || 0)}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded">
              <p className="text-sm text-gray-600">Break Time</p>
              <p className="text-xl font-bold text-purple-600">
                {formatDurationFromSeconds(attendance?.break_time || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-bold mb-4">Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={handleMarkIn}
              disabled={loading || isMarkedIn}
              className="flex items-center justify-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Play size={20} />
              <span>Mark In</span>
            </button>
            <button
              onClick={handleMarkOut}
              disabled={loading || !isMarkedIn}
              className="flex items-center justify-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Square size={20} />
              <span>Mark Out</span>
            </button>
            <button
              onClick={handleLunchOut}
              disabled={loading || !isMarkedIn || isOnBreak}
              className="flex items-center justify-center space-x-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Coffee size={20} />
              <span>Lunch Out</span>
            </button>
            <button
              onClick={handleLunchIn}
              disabled={loading || !isOnBreak}
              className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Coffee size={20} />
              <span>Lunch In</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate('/screenshots')}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left"
          >
            <h3 className="text-lg font-bold mb-2">View Screenshots</h3>
            <p className="text-gray-600">Browse your activity screenshots</p>
          </button>
          <button
            onClick={() => navigate('/history')}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left"
          >
            <h3 className="text-lg font-bold mb-2">Attendance History</h3>
            <p className="text-gray-600">View your past attendance records</p>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
