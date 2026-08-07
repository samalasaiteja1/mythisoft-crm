import {
  LineChart, Line, PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';

const COLORS = {
  discovery: '#3b82f6',
  negotiation: '#f59e0b',
  proposal: '#10b981',
  quotation: '#8b5cf6',
  requirements: '#06b6d4',
  won: '#22c55e',
  website: '#3b82f6',
  referral: '#ec4899',
  whatsapp: '#22c55e',
  email: '#f97316',
  phone: '#8b5cf6',
};

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#22c55e'];

export default function SalespersonDashboardCharts({ roleStats }) {
  // Monthly Sales Performance Data (Line Chart)
  const monthlySalesData = [
    { month: 'Jan', revenue: 250000 },
    { month: 'Feb', revenue: 320000 },
    { month: 'Mar', revenue: 410000 },
    { month: 'Apr', revenue: 380000 },
    { month: 'May', revenue: 520000 },
    { month: 'Jun', revenue: 580000 },
    { month: 'Jul', revenue: 490000 },
    { month: 'Aug', revenue: 620000 },
    { month: 'Sep', revenue: 550000 },
    { month: 'Oct', revenue: 680000 },
    { month: 'Nov', revenue: 720000 },
    { month: 'Dec', revenue: 850000 },
  ];

  // My Deal Pipeline Data (Pie Chart)
  const myDealPipelineData = [
    { name: 'Discovery', value: 8, color: COLORS.discovery },
    { name: 'Negotiation', value: 5, color: COLORS.negotiation },
    { name: 'Proposal Sent', value: 4, color: COLORS.proposal },
    { name: 'Quotation Sent', value: 6, color: COLORS.quotation },
    { name: 'Requirements', value: 3, color: COLORS.requirements },
    { name: 'Won', value: 12, color: COLORS.won },
  ];

  // My Lead Sources Data (Bar Chart)
  const leadSourcesData = [
    { name: 'Website', count: 25, color: COLORS.website },
    { name: 'Referral', count: 18, color: COLORS.referral },
    { name: 'WhatsApp', count: 12, color: COLORS.whatsapp },
    { name: 'Email', count: 15, color: COLORS.email },
    { name: 'Phone Call', count: 8, color: COLORS.phone },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-myth-card border border-myth-border rounded-lg p-3 shadow-lg">
          {label && <p className="text-xs text-gray-400 mb-1">{label}</p>}
          {payload.map((entry, index) => (
            <p key={index} className="text-xs text-white" style={{ color: entry.color }}>
              Revenue: {entry.value.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-myth-card border border-myth-border rounded-lg p-3 shadow-lg">
          <p className="text-xs font-semibold text-white mb-1" style={{ color: data.color }}>
            {data.name}
          </p>
          <p className="text-xs text-gray-400">{data.value} deals</p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-myth-card border border-myth-border rounded-lg p-3 shadow-lg">
          <p className="text-xs text-gray-400 mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs text-white" style={{ color: entry.color }}>
              Leads: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Monthly Sales Performance - Line Chart */}
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          📈 Monthly Sales Performance
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={monthlySalesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" stroke="#9ca3af" tick={{ fontSize: 10 }} />
            <YAxis stroke="#9ca3af" tick={{ fontSize: 10 }} tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* My Deal Pipeline - Pie Chart */}
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          🥧 My Deal Pipeline
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={myDealPipelineData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
            >
              {myDealPipelineData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomPieTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* My Lead Sources - Bar Chart */}
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          📊 My Lead Sources
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={leadSourcesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 10 }} />
            <YAxis stroke="#9ca3af" tick={{ fontSize: 10 }} />
            <Tooltip content={<CustomBarTooltip />} />
            <Legend />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {leadSourcesData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
