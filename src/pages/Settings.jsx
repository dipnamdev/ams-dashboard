import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Save, Settings as SettingsIcon } from 'lucide-react';

function Settings() {
  const [autoStart, setAutoStart] = useState(true);
  const [showIdleNotifications, setShowIdleNotifications] = useState(true);
  const [screenshotInterval, setScreenshotInterval] = useState(10);
  const [apiUrl, setApiUrl] = useState('http://localhost:3000');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    // In web-only mode, load basic defaults from environment/localStorage
    const storedApiUrl = localStorage.getItem('apiUrl') || import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:3000';
    setApiUrl(storedApiUrl);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Persist minimal web settings
      localStorage.setItem('apiUrl', apiUrl);
      alert('Settings saved');
    } catch (error) {
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <SettingsIcon className="mr-2" size={24} />
            <h2 className="text-2xl font-bold">Settings</h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium">Auto-start on system boot</h3>
                <p className="text-sm text-gray-500">Launch app automatically when your computer starts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoStart}
                  onChange={(e) => setAutoStart(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium">Show idle notifications</h3>
                <p className="text-sm text-gray-500">Get notified when you've been inactive</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showIdleNotifications}
                  onChange={(e) => setShowIdleNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Screenshot interval</h3>
              <p className="text-sm text-gray-500 mb-3">How often to capture activity screenshots</p>
              <select
                value={screenshotInterval}
                onChange={(e) => setScreenshotInterval(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
              </select>
            </div>



            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">API URL</h3>
              <p className="text-sm text-gray-500 mb-3">Backend server URL</p>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="http://localhost:3000"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 font-medium"
            >
              <Save size={20} />
              <span>{loading ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
