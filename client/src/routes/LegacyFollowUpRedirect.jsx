import { Navigate, useLocation } from 'react-router-dom';
import { LEGACY_FOLLOW_UP_PREFIX } from '../constants/followUpPaths';

const MODULE_BASE = {
  lead: '/leads/follow-ups',
  deal: '/deals/follow-ups',
  customer: '/customers/follow-ups',
};

/** Redirect old /follow-ups/{module}/* URLs to module-scoped paths */
export default function LegacyFollowUpRedirect({ module }) {
  const location = useLocation();
  const legacyPrefix = LEGACY_FOLLOW_UP_PREFIX[module];
  const newPath = location.pathname.replace(legacyPrefix, MODULE_BASE[module]);
  return <Navigate to={`${newPath}${location.search}`} replace />;
}
