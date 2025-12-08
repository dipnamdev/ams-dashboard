import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Settings, Calendar, Camera, LayoutDashboard, Users, BarChart3 } from 'lucide-react';
import { logout, getCurrentUser } from '../services/auth';
import { useAuth } from '../hooks/useAuth';

function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);
  const { userRole, loading } = useAuth();

  React.useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to={user?.role === 'hr' ? "/hr" : "/dashboard"} className="text-xl font-bold">
              Attendance Tracker
            </Link>
            <div className="hidden md:flex space-x-4">
              <Link to="/dashboard" className="flex items-center space-x-1 hover:bg-white/10 px-3 py-2 rounded">
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>
              <Link to="/hr" className="flex items-center space-x-1 hover:bg-white/10 px-3 py-2 rounded">
                <Users size={18} />
                <span>View Employee</span>
              </Link>
              <Link to="/screenshots" className="flex items-center space-x-1 hover:bg-white/10 px-3 py-2 rounded">
                <Camera size={18} />
                <span>My Activity</span>
              </Link>
              <Link to="/history" className="flex items-center space-x-1 hover:bg-white/10 px-3 py-2 rounded">
                <Calendar size={18} />
                <span>History</span>
              </Link>

              {(user?.role === 'admin' || user?.role === 'hr') && (
                <Link to="/admin/reports" className="flex items-center space-x-1 hover:bg-white/10 px-3 py-2 rounded">
                  <BarChart3 size={18} />
                  <span>Reports</span>
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link to="/admin/single-user" className="flex items-center space-x-1 hover:bg-white/10 px-3 py-2 rounded">
                  <User size={18} />
                  <span>Single User</span>
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* {(user?.role === 'admin' || user?.role === 'hr') && (
              <Link to="/settings" className="hover:bg-white/10 p-2 rounded">
                <Settings size={20} />
              </Link>
            )

            }
            <div className="flex items-center space-x-2">
              <User size={20} />
              <span className="font-medium">{user?.name || user?.email}</span>
            </div> */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 hover:bg-white/10 px-3 py-2 rounded"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
