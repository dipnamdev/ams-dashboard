import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import Screenshots from './pages/Screenshots';
import History from './pages/History';
import Settings from './pages/Settings';
import AdminDashboard from './pages/admin/AdminDashboard';
import EmployeeManagement from './pages/admin/EmployeeManagement';
import Reports from './pages/admin/Reports';
import SingleUser from './pages/admin/SingleUser';
import HRDashboard from './pages/hr/HRDashboard';

function App() {
  const { user, loading } = useAuth();

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
        <Route path="/settings" element={user?.role === 'admin' ? <Settings /> : <Navigate to="/" />} />
        <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/dashboard" />} />
        <Route path="/admin/employees" element={user?.role === 'admin' ? <EmployeeManagement /> : <Navigate to="/dashboard" />} />
        <Route path="/admin/reports" element={(user?.role === 'admin' || user?.role === 'hr') ? <Reports /> : <Navigate to="/dashboard" />} />
        <Route path="/admin/single-user" element={user?.role === 'admin' ? <SingleUser /> : <Navigate to="/dashboard" />} />
        <Route path="/hr" element={user ? <HRDashboard /> : <Navigate to="/" />} />
        <Route path="/employee-management" element={user?.role === 'admin' ? <EmployeeManagement /> : <Navigate to="/" />} />
      </Routes>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#333',
            color: '#fff',
          },
          success: {
            duration: 3000,
            theme: {
              primary: '#4aed88',
            },
          },
          error: {
            style: {
              background: '#fee2e2',
              color: '#991b1b',
              border: '1px solid #f87171',
            },
          },
        }}
      />
    </Router>
  );
}

export default App;
