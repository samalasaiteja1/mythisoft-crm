import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { dashboardAPI, formatCurrency } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  AdminPageShell,
  AdminPageHeader,
  AdminContentCard,
} from '../components/admin/adminUi';

const COLORS = ['#3ABEF9', '#6366F1', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6'];

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getReports().then(({ data: d }) => setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data) return <div className="text-center text-gray-400 py-12">Failed to load reports</div>;

  const { salesReport, leadConversion, customerGrowth, revenueByMonth } = data;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenueData = (revenueByMonth || []).map((r) => ({
    name: `${monthNames[(r._id?.month || 1) - 1]} ${r._id?.year || ''}`,
    revenue: r.revenue,
    deals: r.deals,
  }));
  const leadData = (leadConversion || []).map((l) => ({ name: l._id?.charAt(0).toUpperCase() + l._id?.slice(1), count: l.count, value: l.value }));

  return (
    <AdminPageShell>
      <AdminPageHeader
        icon={BarChart3}
        title="Reports & Analytics"
        subtitle="Business intelligence — sales performance, lead conversion, customer growth, and revenue trends"
        workflow={['Review metrics', 'Identify trends', 'Assign actions', 'Track outcomes']}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AdminContentCard title="Sales Report by Rep">
          {salesReport?.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={salesReport}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A3050" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={11} />
                <YAxis stroke="#6B7280" fontSize={11} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                <Tooltip contentStyle={{ background: '#0F1D32', border: '1px solid #1A3050', borderRadius: 8 }} formatter={(v) => formatCurrency(v)} />
                <Bar dataKey="totalRevenue" fill="#3ABEF9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-500 text-center py-12">No sales data</p>}
        </AdminContentCard>

        <AdminContentCard title="Lead Conversion">
          {leadData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={leadData} cx="50%" cy="50%" outerRadius={100} dataKey="count" label={({ name, count }) => `${name}: ${count}`}>
                  {leadData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0F1D32', border: '1px solid #1A3050', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-500 text-center py-12">No lead data</p>}
        </AdminContentCard>

        <AdminContentCard title="Customer Growth">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={(customerGrowth || []).map((c) => ({ name: monthNames[c._id - 1], count: c.count }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A3050" />
              <XAxis dataKey="name" stroke="#6B7280" fontSize={11} />
              <YAxis stroke="#6B7280" fontSize={11} />
              <Tooltip contentStyle={{ background: '#0F1D32', border: '1px solid #1A3050', borderRadius: 8 }} />
              <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </AdminContentCard>

        <AdminContentCard title="Revenue Dashboard">
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A3050" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={11} />
                <YAxis stroke="#6B7280" fontSize={11} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                <Tooltip contentStyle={{ background: '#0F1D32', border: '1px solid #1A3050', borderRadius: 8 }} formatter={(v) => formatCurrency(v)} />
                <Line type="monotone" dataKey="revenue" stroke="#3ABEF9" strokeWidth={2} dot={{ fill: '#3ABEF9' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-500 text-center py-12">No revenue data yet</p>}
        </AdminContentCard>
      </div>
    </AdminPageShell>
  );
}
