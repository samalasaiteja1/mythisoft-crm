import { Link } from 'react-router-dom';
import { Mail, Phone, Building2, Briefcase, Globe } from 'lucide-react';
import { hasPipelineContact, formatContactName } from '../../utils/pipelineContact';

function InfoRow({ icon: Icon, label, children }) {
  if (!children) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon size={16} className="text-myth-accent shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <div className="text-gray-300 text-sm">{children}</div>
      </div>
    </div>
  );
}

export default function ContactInfoPanel({ contact, profileLink, profileLabel = 'View customer profile →' }) {
  if (!hasPipelineContact(contact)) {
    return <p className="text-gray-500 text-sm">No contact information available.</p>;
  }

  const name = formatContactName(contact);
  const websiteHref = contact.website
    ? (contact.website.startsWith('http') ? contact.website : `https://${contact.website}`)
    : '';

  return (
    <div className="space-y-4">
      {name && <p className="text-lg font-semibold text-white">{name}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoRow icon={Mail} label="Email">
          <a href={`mailto:${contact.email}`} className="hover:text-myth-accent">{contact.email}</a>
        </InfoRow>
        <InfoRow icon={Phone} label="Phone">
          {contact.phone ? (
            <a href={`tel:${contact.phone}`} className="hover:text-myth-accent">{contact.phone}</a>
          ) : null}
        </InfoRow>
        <InfoRow icon={Phone} label="Alternate phone">
          {contact.alternatePhone ? (
            <a href={`tel:${contact.alternatePhone}`} className="hover:text-myth-accent">{contact.alternatePhone}</a>
          ) : null}
        </InfoRow>
        <InfoRow icon={Building2} label="Company">
          {contact.company || null}
        </InfoRow>
        <InfoRow icon={Briefcase} label="Job title">
          {contact.title || null}
        </InfoRow>
        <InfoRow icon={Briefcase} label="Industry">
          {contact.industry || null}
        </InfoRow>
        <InfoRow icon={Globe} label="Website">
          {websiteHref ? (
            <a href={websiteHref} target="_blank" rel="noreferrer" className="text-myth-accent hover:underline break-all">
              {contact.website}
            </a>
          ) : null}
        </InfoRow>
      </div>
      {profileLink && (
        <Link to={profileLink} className="text-myth-accent text-sm hover:underline inline-block">
          {profileLabel}
        </Link>
      )}
    </div>
  );
}
