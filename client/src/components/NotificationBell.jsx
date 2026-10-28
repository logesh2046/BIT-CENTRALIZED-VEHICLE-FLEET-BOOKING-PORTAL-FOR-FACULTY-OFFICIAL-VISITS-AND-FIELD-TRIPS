import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import api from '../services/api';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await api.get('/notifications?unreadOnly=true');
        setUnreadCount(res.data.unreadCount || 0);
      } catch (err) {
        // silent fail
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user.role?.toLowerCase().replace('_', '-');
    const basePath = {
      admin: '/admin',
      hod: '/hod',
      faculty: '/faculty',
      'transport-officer': '/transport',
      transport_officer: '/transport',
      driver: '/driver',
    };
    navigate(`${basePath[role] || basePath[user.role] || '/faculty'}/notifications`);
  };

  return (
    <button
      onClick={handleClick}
      className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
