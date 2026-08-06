import Customers from '../Customers';
import { SEGMENT_LABELS } from '../../constants/customerNav';

export default function CustomerSegmentList({ segment = 'all' }) {
  return <Customers segment={segment} title={SEGMENT_LABELS[segment] || 'Customers'} />;
}
