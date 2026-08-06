import Modal from '../Modal';
import ContactInfoPanel from './ContactInfoPanel';
import { formatContactName } from '../../utils/pipelineContact';

export default function ContactInfoModal({ contact, isOpen, onClose, profileLink }) {
  const name = formatContactName(contact);
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={name ? `Contact — ${name}` : 'Contact information'}
    >
      <p className="text-xs text-gray-500 mb-4">Primary ways to reach this lead — calls, emails, and meetings.</p>
      <ContactInfoPanel contact={contact} profileLink={profileLink} />
    </Modal>
  );
}
