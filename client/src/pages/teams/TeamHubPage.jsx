import { useParams, Navigate } from 'react-router-dom';
import TeamHub from './TeamHub';

export default function TeamHubPage() {
  const { team, section } = useParams();
  if (!section) {
    return <Navigate to={`/teams/${team}/overview`} replace />;
  }
  return <TeamHub team={team} section={section} />;
}
