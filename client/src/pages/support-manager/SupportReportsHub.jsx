import { Link } from 'react-router-dom';
import {
  BarChart3, Truck, UserCheck, Headphones, Clock, Star, FileEdit, Users,
} from 'lucide-react';
import {
  SupportManagerPageShell,
  SupportManagerPageHeader,
  SupportManagerInfoBanner,
} from '../../components/supportManager/supportManagerUi';

const REPORT_SECTIONS = [
  {
    id: 'delivery',
    title: 'Project Delivery Report',
    description: 'Handoffs submitted, reviewed, and delivered to customers.',
    icon: Truck,
    link: '/projects/support-closed',
  },
  {
    id: 'acceptance',
    title: 'Customer Acceptance Report',
    description: 'Projects awaiting and completed customer acceptance.',
    icon: UserCheck,
    link: '/support/customer-acceptance',
  },
  {
    id: 'tickets',
    title: 'Ticket Report',
    description: 'Open, assigned, escalated, and closed ticket volumes.',
    icon: Headphones,
    link: '/support/tickets/all',
  },
  {
    id: 'sla',
    title: 'SLA Report',
    description: 'Response times, SLA breaches, and resolution metrics.',
    icon: Clock,
    link: '/teams/support/performance',
  },
  {
    id: 'changes',
    title: 'Change Request Report',
    description: 'Customer change requests by status and priority.',
    icon: FileEdit,
    link: '/support/change-requests',
  },
  {
    id: 'team',
    title: 'Team Performance Report',
    description: 'Support executive workload, ratings, and resolution rates.',
    icon: Users,
    link: '/teams/support/performance',
  },
];

export default function SupportReportsHub() {
  return (
    <SupportManagerPageShell>
      <SupportManagerPageHeader
        icon={BarChart3}
        title="Reports"
        subtitle="Delivery, acceptance, ticket, SLA, and team performance reports."
        workflow={['Select report', 'Review metrics', 'Identify trends', 'Take action']}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORT_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.id}
              id={section.id}
              to={section.link}
              className="card border border-myth-border/80 hover:border-orange-500/40 transition-colors flex gap-4 group"
            >
              <div className="p-3 rounded-xl bg-orange-500/10 h-fit group-hover:bg-orange-500/15 transition-colors">
                <Icon size={22} className="text-orange-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">{section.title}</h3>
                <p className="text-sm text-gray-400 mt-1">{section.description}</p>
              </div>
            </Link>
          );
        })}
      </div>

      <SupportManagerInfoBanner className="flex items-center gap-3">
        <Star size={20} className="text-yellow-400 shrink-0" />
        <p>
          Customer satisfaction ratings are included in the{' '}
          <Link to="/teams/support/performance" className="text-myth-accent hover:underline">Team Performance</Link> report.
        </p>
      </SupportManagerInfoBanner>
    </SupportManagerPageShell>
  );
}
