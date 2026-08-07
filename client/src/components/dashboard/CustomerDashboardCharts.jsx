import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { User, Handshake, FolderKanban, Ticket, DollarSign, Headphones } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const dealPipelineData = [
  { name: 'Deal Created', value: 3, color: '#3b82f6' },
  { name: 'Discovery', value: 2, color: '#06b6d4' },
  { name: 'Proposal Sent', value: 4, color: '#8b5cf6' },
  { name: 'Negotiation', value: 2, color: '#f59e0b' },
  { name: 'Contract Signed', value: 3, color: '#f97316' },
  { name: 'Won', value: 5, color: '#10b981' },
];

const projectStatusData = [
  { name: 'In Progress', value: 3, color: '#3b82f6' },
  { name: 'Testing', value: 2, color: '#f59e0b' },
  { name: 'Delivered', value: 4, color: '#10b981' },
  { name: 'Support', value: 2, color: '#8b5cf6' },
];

const monthlyActivityData = [
  { month: 'Jan', leads: 2, deals: 1, projects: 0 },
  { month: 'Feb', leads: 3, deals: 2, projects: 1 },
  { month: 'Mar', leads: 1, deals: 3, projects: 1 },
  { month: 'Apr', leads: 4, deals: 2, projects: 2 },
  { month: 'May', leads: 2, deals: 4, projects: 1 },
  { month: 'Jun', leads: 3, deals: 3, projects: 2 },
];

const KPICard = ({ icon: Icon, label, value, color }) => (
  <div className="card p-4 lg:p-6 hover:border-myth-accent/30 transition-all duration-300 hover:scale-105">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs lg:text-sm text-gray-400 mb-1">{label}</p>
        <p className="text-2xl lg:text-3xl font-bold text-white">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${color} animate-pulse`}>
        <Icon size={20} lg:size={24} className="text-white" />
      </div>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-myth-surface border border-myth-border rounded-lg p-3 shadow-xl backdrop-blur-sm">
        {payload.map((entry, index) => (
          <p key={index} className="text-xs lg:text-sm font-medium" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function CustomerDashboardCharts() {
  return (
    <div className="space-y-4 lg:space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 lg:gap-4">
        <KPICard icon={User} label="My Leads" value={8} color="bg-blue-500/20" />
        <KPICard icon={Handshake} label="My Deals" value={12} color="bg-green-500/20" />
        <KPICard icon={FolderKanban} label="Active Projects" value={4} color="bg-purple-500/20" />
        <KPICard icon={Ticket} label="Open Tickets" value={3} color="bg-orange-500/20" />
        <KPICard icon={DollarSign} label="Total Investment" value="₹25L" color="bg-cyan-500/20" />
        <KPICard icon={Headphones} label="Support Tickets" value={2} color="bg-amber-500/20" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Deal Pipeline - Pie Chart */}
        <div className="card p-4 lg:p-6 hover:border-myth-accent/30 transition-all duration-300">
          <h3 className="text-sm lg:text-base font-semibold text-white mb-4">Deal Pipeline</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={dealPipelineData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {dealPipelineData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Project Status - Bar Chart */}
        <div className="card p-4 lg:p-6 hover:border-myth-accent/30 transition-all duration-300">
          <h3 className="text-sm lg:text-base font-semibold text-white mb-4">Project Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={projectStatusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="value" 
                fill="#8b5cf6" 
                radius={[4, 4, 0, 0]} 
                animationDuration={800}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Activity - Line Chart */}
        <div className="card p-4 lg:p-6 hover:border-myth-accent/30 transition-all duration-300">
          <h3 className="text-sm lg:text-base font-semibold text-white mb-4">Monthly Activity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyActivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="leads" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                dot={{ fill: '#3b82f6', r: 4 }} 
                activeDot={{ r: 6 }}
                animationDuration={1000}
                name="Leads" 
              />
              <Line 
                type="monotone" 
                dataKey="deals" 
                stroke="#10b981" 
                strokeWidth={3} 
                dot={{ fill: '#10b981', r: 4 }} 
                activeDot={{ r: 6 }}
                animationDuration={1000}
                name="Deals" 
              />
              <Line 
                type="monotone" 
                dataKey="projects" 
                stroke="#8b5cf6" 
                strokeWidth={3} 
                dot={{ fill: '#8b5cf6', r: 4 }} 
                activeDot={{ r: 6 }}
                animationDuration={1000}
                name="Projects" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
