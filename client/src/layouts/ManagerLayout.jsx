import AppShell from './AppShell';
import { useAuth } from '../context/AuthContext';
import { getPanelLabel } from '../utils/roleContext';

export default function ManagerLayout() {
  const { user } = useAuth();
  return <AppShell panelLabel={getPanelLabel(user)} />;
}
