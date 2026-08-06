export default function StatusBadge({ status, config }) {
  const item = config[status] || { label: status, color: 'bg-gray-500/20 text-gray-400' };
  return <span className={`badge ${item.color}`}>{item.label}</span>;
}
