const statusStyles = {
  reported: 'bg-blue-100 text-blue-700',
  verified: 'bg-indigo-100 text-indigo-700',
  assigned: 'bg-purple-100 text-purple-700',
  in_progress: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
  rejected: 'bg-gray-100 text-gray-500',
};

const statusLabels = {
  reported: 'Reported',
  verified: 'Verified',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        statusStyles[status] || 'bg-gray-100 text-gray-600'
      }`}
    >
      {statusLabels[status] || status}
    </span>
  );
}
