import React from 'react';

interface BadgeProps {
  status: string;
  children?: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({ status, children }) => {
  const map: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-700',
    Approved: 'bg-green-100 text-green-700',
    Rejected: 'bg-red-100 text-red-700',
    Paid: 'bg-green-100 text-green-700',
    Partial: 'bg-blue-100 text-blue-700',
    Overdue: 'bg-red-100 text-red-700',
    Active: 'bg-green-100 text-green-700',
    Present: 'bg-green-100 text-green-700',
    Absent: 'bg-red-100 text-red-700',
    Late: 'bg-yellow-100 text-yellow-700',
    High: 'bg-red-100 text-red-700',
    Medium: 'bg-yellow-100 text-yellow-700',
    Low: 'bg-blue-100 text-blue-700',
    Urgent: 'bg-red-100 text-red-800 font-bold',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-700'}`}>
      {children || status}
    </span>
  );
};

export default Badge;
