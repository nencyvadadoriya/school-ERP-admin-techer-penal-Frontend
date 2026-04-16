import React from 'react';
import { FaBars, FaUser } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  toggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const roleColors = { admin: 'bg-purple-100 text-purple-700', teacher: 'bg-green-100 text-green-700', student: 'bg-blue-100 text-blue-700' };

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100">
          <FaBars />
        </button>
        <div className="hidden sm:block">
          <p className="text-sm font-medium text-gray-900">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
            {user?.profile_image
              ? <img src={user.profile_image} alt="" className="w-full h-full object-cover" />
              : <FaUser className="text-primary-600 text-sm" />}
          </div>
          <span className="hidden md:block text-sm font-medium text-gray-900">{user?.first_name} {user?.last_name}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
