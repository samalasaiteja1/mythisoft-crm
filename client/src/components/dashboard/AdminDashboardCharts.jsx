import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = {
  leads: '#3b82f6',
  deals: '#10b981',
  tech: '#06b6d4',
  support: '#f97316',
  customers: '#8b5cf6',
};

const CHART_COLORS = ['#3b82f6', '#10b981', '#06b6d4', '#f97316', '#8b5cf6', '#ec4899'];

export default function AdminDashboardCharts({ stats, adminOverview }) {
  const pipelineData = [
    {
      name: 'Sales',
      value: (adminOverview?.employeesByRole?.sales || 0) + (stats?.totalLeads || 0) + (stats?.totalDeals || 0),
      color: COLORS.leads,
      breakdown: {
        team: adminOverview?.employeesByRole?.sales || 0,
        leads: stats?.totalLeads || 0,
        deals: stats?.totalDeals || 0
      },
      status: 'Active'
    },
    {
      name: 'Tech',
      value: (adminOverview?.employeesByRole?.technical || 0) + (stats?.totalProjects || 0),
      color: COLORS.tech,
      breakdown: {
        team: adminOverview?.employeesByRole?.technical || 0,
        projects: stats?.totalProjects || 0
      },
      status: 'In Progress'
    },
    {
      name: 'Support',
      value: (adminOverview?.employeesByRole?.support || 0) + (stats?.openTickets || 0),
      color: COLORS.support,
      breakdown: {
        team: adminOverview?.employeesByRole?.support || 0,
        tickets: stats?.openTickets || 0
      },
      status: 'Available'
    },
    {
      name: 'Customers',
      value: stats?.totalCustomers || 0,
      color: COLORS.customers,
      breakdown: {
        customers: stats?.totalCustomers || 0
      },
      status: 'Registered'
    },
  ];

  const monthlyData = [
    { month: 'Jan', leads: 12, deals: 8, projects: 5 },
    { month: 'Feb', leads: 19, deals: 12, projects: 8 },
    { month: 'Mar', leads: 15, deals: 10, projects: 7 },
    { month: 'Apr', leads: 22, deals: 15, projects: 10 },
    { month: 'May', leads: 28, deals: 18, projects: 12 },
    { month: 'Jun', leads: 25, deals: 20, projects: 15 },
  ];

  const revenueData = [
    { month: 'Jan', revenue: 45000 },
    { month: 'Feb', revenue: 52000 },
    { month: 'Mar', revenue: 48000 },
    { month: 'Apr', revenue: 61000 },
    { month: 'May', revenue: 55000 },
    { month: 'Jun', revenue: 67000 },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      // Handle pie chart data (with breakdown)
      if (data.breakdown) {
        return (
          <div className="bg-myth-card border border-myth-border rounded-lg p-3 shadow-xl backdrop-blur-sm min-w-[140px]">
            <p className="text-xs font-semibold text-white mb-1" style={{ color: data.color }}>
              {data.name}: {data.value}
            </p>
            <p className="text-[10px] text-green-400 mb-2">{data.status}</p>
            {data.breakdown && (
              <div className="space-y-1">
                {Object.entries(data.breakdown).map(([key, value]) => (
                  <p key={key} className="text-[10px] text-gray-400 font-medium">
                    {key}: {value}
                  </p>
                ))}
              </div>
            )}
          </div>
        );
      }
      
      // Handle bar chart and line chart data (monthly data)
      return (
        <div className="bg-myth-card border border-myth-border rounded-lg p-3 shadow-xl backdrop-blur-sm min-w-[120px]">
          <p className="text-xs font-semibold text-white mb-2">{label || data.month}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-[10px] text-gray-300 font-medium" style={{ color: entry.color }}>
              {entry.dataKey}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Top Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Pipeline Distribution Pie Chart */}
        <div className="card border border-myth-border/80 bg-gradient-to-br from-myth-surface/50 to-myth-surface/30 hover:border-myth-accent/30 transition-all duration-300">
          <h3 className="text-sm lg:text-base font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-myth-accent animate-pulse"></span>
            Pipeline Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pipelineData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {pipelineData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '10px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Performance Bar Chart */}
        <div className="card border border-myth-border/80 bg-gradient-to-br from-myth-surface/50 to-myth-surface/30 hover:border-myth-accent/30 transition-all duration-300">
          <h3 className="text-sm lg:text-base font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            Monthly Performance
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="month" 
                stroke="#9ca3af" 
                fontSize={10}
                tickLine={false}
              />
              <YAxis 
                stroke="#9ca3af" 
                fontSize={10}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '10px' }}
              />
              <Bar dataKey="leads" fill={COLORS.leads} radius={[4, 4, 0, 0]} animationDuration={800} />
              <Bar dataKey="deals" fill={COLORS.deals} radius={[4, 4, 0, 0]} animationDuration={800} />
              <Bar dataKey="projects" fill={COLORS.tech} radius={[4, 4, 0, 0]} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Trend Line Chart */}
        <div className="card border border-myth-border/80 bg-gradient-to-br from-myth-surface/50 to-myth-surface/30 hover:border-myth-accent/30 transition-all duration-300">
          <h3 className="text-sm lg:text-base font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
            Revenue Trend
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="month" 
                stroke="#9ca3af" 
                fontSize={10}
                tickLine={false}
              />
              <YAxis 
                stroke="#9ca3af" 
                fontSize={10}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                dot={{ fill: '#8b5cf6', r: 4 }} 
                activeDot={{ r: 6 }}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
