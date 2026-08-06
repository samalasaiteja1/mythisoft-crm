import { usePermissions } from '../../hooks/usePermissions';
import Projects from '../Projects';
import TechManagerProjectsHome from '../../components/projects/TechManagerProjectsHome';
import CustomerMyProjects from '../customer/CustomerMyProjects';

export default function ProjectList() {
  const { isTechManager, isCustomer } = usePermissions();
  if (isCustomer) return <CustomerMyProjects />;
  if (isTechManager) return <TechManagerProjectsHome filterMode="all" />;
  return <Projects />;
}
