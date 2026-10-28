import { statusColors } from '../utils/constants';

export default function StatusBadge({ status }) {
  const colors = statusColors[status] || statusColors.PENDING;
  const label = status?.replace(/_/g, ' ') || 'UNKNOWN';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}></span>
      {label}
    </span>
  );
}
