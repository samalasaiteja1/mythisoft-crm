import SupportManagerQueueHub from './SupportManagerQueueHub';

export default function SupportManagerClosedHub() {
  return (
    <SupportManagerQueueHub
      queue="closed"
      title="Closed Support Handoffs"
      subtitle="Projects where the support cycle is complete — fixes verified and tickets closed."
      emptyMessage="No closed support handoffs yet"
    />
  );
}
