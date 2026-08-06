import { Headphones, Mail, Phone, User } from 'lucide-react';

export default function SupportContactCard({ contact, compact = false, title = 'Your Support Contact' }) {
  if (!contact) {
    return (
      <div className={`card border-myth-border ${compact ? 'p-4' : ''}`}>
        <h3 className={`font-semibold text-white flex items-center gap-2 ${compact ? 'text-sm mb-2' : 'text-lg mb-3'}`}>
          <Headphones size={compact ? 16 : 18} className="text-orange-400" /> {title}
        </h3>
        <p className="text-sm text-gray-500">A support contact will be assigned after your project is completed.</p>
      </div>
    );
  }

  const name = `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.email || 'Support';

  return (
    <div className={`card border-orange-400/20 ${compact ? 'p-4' : ''}`}>
      <h3 className={`font-semibold text-white flex items-center gap-2 ${compact ? 'text-sm mb-3' : 'text-lg mb-4'}`}>
        <Headphones size={compact ? 16 : 18} className="text-orange-400" /> {title}
      </h3>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-orange-400/15 flex items-center justify-center text-orange-400 shrink-0">
          {contact.avatar ? (
            <img src={contact.avatar} alt={name} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <User size={22} />
          )}
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-white font-medium">{name}</p>
          <p className="text-xs text-gray-500 capitalize">MYTHISOFT Support Team</p>
          {contact.email && (
            <a href={`mailto:${contact.email}`} className="text-sm text-myth-accent hover:underline flex items-center gap-2 mt-2">
              <Mail size={14} /> {contact.email}
            </a>
          )}
          {contact.phone && (
            <p className="text-sm text-gray-400 flex items-center gap-2">
              <Phone size={14} /> {contact.phone}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
