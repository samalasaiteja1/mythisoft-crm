import { Server, CheckCircle2, AlertCircle } from 'lucide-react';

const services = [
  { name: 'API Server', host: 'localhost:5000', status: 'online', uptime: '99.9%' },
  { name: 'MongoDB', host: 'localhost:27017', status: 'online', uptime: '99.8%' },
  { name: 'React Client', host: 'localhost:5173', status: 'online', uptime: '100%' },
  { name: 'Email Service', host: 'SMTP', status: 'online', uptime: '98.5%' },
  { name: 'Cloudinary', host: 'CDN', status: 'degraded', uptime: '97.2%' },
];

export default function ServerStatus() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Server className="text-myth-accent" size={24} /> Server Status
        </h1>
        <p className="text-gray-400 mt-1">Monitor infrastructure health and uptime</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((s) => (
          <div key={s.name} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white font-semibold">{s.name}</p>
                <p className="text-sm text-gray-400">{s.host}</p>
                <p className="text-xs text-gray-500 mt-2">Uptime: {s.uptime}</p>
              </div>
              <span className={`badge flex items-center gap-1 ${s.status === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                {s.status === 'online' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                {s.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
