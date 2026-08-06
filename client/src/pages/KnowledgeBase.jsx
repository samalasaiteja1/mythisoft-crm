import Help from './Help';

export default function KnowledgeBase() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Knowledge Base</h1>
        <p className="text-gray-400 mt-1">Support guides, FAQs, and troubleshooting articles</p>
      </div>
      <Help />
    </div>
  );
}
