import SupportManagerQueueHub from './SupportManagerQueueHub';

export default function SupportManagerActiveHub() {
  return (
    <SupportManagerQueueHub
      queue="active"
      title="Projects In Support"
      subtitle="Approved handoffs — support executives are handling customer follow-up and ongoing support."
      emptyMessage="No projects currently in active support"
    />
  );
}
