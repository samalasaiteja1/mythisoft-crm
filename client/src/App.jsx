import { useAuth } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import LoadingSpinner from './components/loaders/LoadingSpinner';

export default function App() {
  const { loading } = useAuth();

  if (loading) return <LoadingSpinner fullScreen />;

  return <AppRoutes />;
}
