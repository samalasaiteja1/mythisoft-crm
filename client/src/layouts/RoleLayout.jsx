import { useAuth } from '../context/AuthContext';
import AdminLayout from './AdminLayout';
import ManagerLayout from './ManagerLayout';
import SalesLayout from './SalesLayout';
import TechLayout from './TechLayout';
import SupportLayout from './SupportLayout';
import CustomerLayout from './CustomerLayout';

const LAYOUTS = {
  admin: AdminLayout,
  manager: ManagerLayout,
  sales: SalesLayout,
  technical: TechLayout,
  support: SupportLayout,
  customer: CustomerLayout,
};

export default function RoleLayout() {
  const { user } = useAuth();
  const Layout = LAYOUTS[user?.role] || SalesLayout;
  return <Layout />;
}
