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
  rahul: '#3b82f6',
  priya: '#ec4899',
  arun: '#f97316',
  sneha: '#8b5cf6',
  kiran: '#06b6d4',
};

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#22c55e'];

export default function SalesManagerDashboardCharts({ salesOverview, roleStats }) {
  // Monthly Team Revenue Data (Line Chart)
  const monthlyTeamRevenueData = [
    { month: 'Jan', revenue: 1200000 },
    { month: 'Feb', revenue: 1500000 },
    { month: 'Mar', revenue: 1800000 },
    { month: 'Apr', revenue: 1400000 },
    { month: 'May', revenue: 2100000 },
    { month: 'Jun', revenue: 2400000 },
    { month: 'Jul', revenue: 1900000 },
    { month: 'Aug', revenue: 2600000 },
    { month: 'Sep', revenue: 2300000 },
    { month: 'Oct', revenue: 2800000 },
    { month: 'Nov', revenue: 3100000 },
    { month: 'Dec', revenue: 3500000 },
  ];

  // Deal Pipeline Distribution Data (Pie Chart)
  const dealPipelineData = [
    { name: 'Discovery', value: 15, color: COLORS.discovery },
    { name: 'Negotiation', value: 12, color: COLORS.negotiation },
    { name: 'Proposal', value: 8, color: COLORS.proposal },
    { name: 'Quotation', value: 10, color: COLORS.quotation },
    { name: 'Requirements', value: 6, color: COLORS.requirements },
    { name: 'Won', value: 20, color: COLORS.won },
  ];

  // Sales Team Performance Data (Bar Chart) - Deals Won
  const teamPerformanceData = [
    { name: 'Rahul', dealsWon: 25, color: COLORS.rahul },
    { name: 'Priya', dealsWon: 22, color: COLORS.priya },
    { name: 'Arun', dealsWon: 18, color: COLORS.arun },
    { name: 'Sneha', dealsWon: 15, color: COLORS.sneha },
    { name: 'Kiran', dealsWon: 12, color: COLORS.kiran },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-myth-card border border-myth-border rounded-lg p-3 shadow-lg">
          {label && <p className="text-xs text-gray-400 mb-1">{label}</p>}
          {payload.map((entry, index) => (
            <p key={index} className="text-xs text-white" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
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
              Deals Won: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Sales Team Performance (Deals Won) - Bar Chart */}
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          � Sales Team Performance
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={teamPerformanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 10 }} />
            <YAxis stroke="#9ca3af" tick={{ fontSize: 10 }} />
            <Tooltip content={<CustomBarTooltip />} />
            <Legend />
            <Bar dataKey="dealsWon" radius={[4, 4, 0, 0]}>
              {teamPerformanceData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Team Revenue - Line Chart */}
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          📈 Monthly Team Revenue
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={monthlyTeamRevenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" stroke="#9ca3af" tick={{ fontSize: 10 }} />
            <YAxis stroke="#9ca3af" tick={{ fontSize: 10 }} tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Deal Pipeline Distribution - Pie Chart */}
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          🥧 Deal Pipeline Distribution
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={dealPipelineData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
            >
              {dealPipelineData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomPieTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
