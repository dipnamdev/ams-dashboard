import { format, formatDuration, intervalToDuration } from 'date-fns';

export const formatTime = (date) => {
  if (!date) return '-';
  return format(new Date(date), 'hh:mm a');
};

export const formatDate = (date) => {
  if (!date) return '-';
  return format(new Date(date), 'yyyy-MM-dd');
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  return format(new Date(date), 'MMM dd, yyyy hh:mm a');
};

export const formatDurationFromSeconds = (seconds) => {
  if (!seconds || seconds === 0) return '0m';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export const formatDurationBetween = (start, end) => {
  if (!start || !end) return '-';
  
  const duration = intervalToDuration({
    start: new Date(start),
    end: new Date(end)
  });
  
  const hours = duration.hours || 0;
  const minutes = duration.minutes || 0;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};
