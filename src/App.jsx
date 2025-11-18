import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Screenshots from './pages/Screenshots';
import History from './pages/History';
import Settings from './pages/Settings';
import AdminDashboard from './pages/admin/AdminDashboard';
import EmployeeManagement from './pages/admin/EmployeeManagement';
import Reports from './pages/admin/Reports';

function App() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onNavigateTo((path) => {
        window.location.hash = path;
      });
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
        <Route path="/screenshots" element={user ? <Screenshots /> : <Navigate to="/" />} />
        <Route path="/history" element={user ? <History /> : <Navigate to="/" />} />
        <Route path="/settings" element={user ? <Settings /> : <Navigate to="/" />} />
        <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/dashboard" />} />
        <Route path="/admin/employees" element={user?.role === 'admin' ? <EmployeeManagement /> : <Navigate to="/dashboard" />} />
        <Route path="/admin/reports" element={user?.role === 'admin' ? <Reports /> : <Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
