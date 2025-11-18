import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Calendar, Trash2, X } from 'lucide-react';
import api from '../services/api';
import { formatDateTime } from '../utils/formatTime';

function Screenshots() {
  const [screenshots, setScreenshots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchScreenshots();
  }, [selectedDate]);

  const fetchScreenshots = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/screenshots/list?date=${selectedDate}`);
      setScreenshots(response.data);
    } catch (error) {
      console.error('Error fetching screenshots:', error);
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

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Screenshots</h2>
            <div className="flex items-center space-x-2">
              <Calendar size={20} className="text-gray-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading screenshots...</div>
          ) : screenshots.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No screenshots found for this date
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {screenshots.map((screenshot) => (
                <div key={screenshot.id} className="relative group">
                  <div
                    className="cursor-pointer border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedImage(screenshot)}
                  >
                    <div className="bg-gray-200 h-48 flex items-center justify-center">
                      <span className="text-4xl">📷</span>
                    </div>
                    <div className="p-3 bg-white">
                      <p className="text-sm font-medium truncate">
                        {screenshot.active_application || 'Application'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(screenshot.timestamp)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(screenshot.id);
                    }}
                    className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="font-bold">{selectedImage.active_application}</h3>
                <p className="text-sm text-gray-500">{formatDateTime(selectedImage.timestamp)}</p>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4">
              <div className="bg-gray-200 h-96 flex items-center justify-center">
                <span className="text-6xl">📷</span>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                Window: {selectedImage.active_window_title || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Screenshots;
