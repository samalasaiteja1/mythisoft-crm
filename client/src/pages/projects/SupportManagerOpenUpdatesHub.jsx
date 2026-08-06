import SupportManagerQueueHub from './SupportManagerQueueHub';

export default function SupportManagerOpenUpdatesHub() {
  return (
    <SupportManagerQueueHub
      queue="updates"
      title="Open Update Requests"
      subtitle="Changes requested from technical — track progress until the tech manager resubmits for verification."
      emptyMessage="No open update requests — all handoffs approved or in active support"
    />
  );
}
