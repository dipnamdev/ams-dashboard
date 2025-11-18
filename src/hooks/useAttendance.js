import { useState, useEffect } from 'react';
import api from '../services/api';

export const useAttendance = () => {
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = async () => {
    try {
      const response = await api.get('/api/attendance/today');
      setAttendance(response.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
    const interval = setInterval(fetchAttendance, 30000);
    return () => clearInterval(interval);
  }, []);

  return { attendance, loading, refetch: fetchAttendance };
};
