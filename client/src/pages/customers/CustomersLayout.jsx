import { Outlet, Navigate } from 'react-router-dom';
import CustomersSidebar from '../../components/customers/CustomersSidebar';

export default function CustomersLayout() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Customers</h1>
        <p className="text-gray-400 mt-1">Manage customer accounts, delivery, billing, and support</p>
      </div>

      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
        <aside className="w-56 shrink-0 hidden lg:block">
          <CustomersSidebar />
        </aside>
      </div>

      <div className="lg:hidden">
        <CustomersSidebar />
      </div>
    </div>
  );
}

export function CustomersIndex() {
  return <Navigate to="/customers/all" replace />;
}
