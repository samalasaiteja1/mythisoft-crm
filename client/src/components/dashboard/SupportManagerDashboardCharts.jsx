import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Ticket, AlertCircle, Clock, CheckCircle, Users, TrendingUp } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const teamResolutionData = [
  { name: 'Rajesh', resolved: 45 },
  { name: 'Priya', resolved: 38 },
  { name: 'Amit', resolved: 52 },
  { name: 'Sneha', resolved: 41 },
  { name: 'Vikram', resolved: 35 },
];

const ticketVolumeData = [
  { month: 'Jan', volume: 120 },
  { month: 'Feb', volume: 145 },
  { month: 'Mar', volume: 132 },
  { month: 'Apr', volume: 168 },
  { month: 'May', volume: 155 },
  { month: 'Jun', volume: 180 },
];

const ticketStatusData = [
  { name: 'Open', value: 45, color: '#3b82f6' },
  { name: 'In Progress', value: 32, color: '#f59e0b' },
  { name: 'Waiting Customer', value: 18, color: '#8b5cf6' },
  { name: 'Resolved', value: 28, color: '#10b981' },
  { name: 'Closed', value: 67, color: '#06b6d4' },
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

export default function SupportManagerDashboardCharts() {
  return (
    <div className="space-y-4 lg:space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 lg:gap-4">
        <KPICard icon={Ticket} label="Total Tickets" value={190} color="bg-blue-500/20" />
        <KPICard icon={AlertCircle} label="Open Tickets" value={45} color="bg-red-500/20" />
        <KPICard icon={Clock} label="In Progress" value={32} color="bg-amber-500/20" />
        <KPICard icon={CheckCircle} label="Resolved Today" value={8} color="bg-green-500/20" />
        <KPICard icon={TrendingUp} label="Closed Tickets" value={67} color="bg-cyan-500/20" />
        <KPICard icon={Users} label="Support Executives" value={5} color="bg-purple-500/20" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Team Ticket Resolution - Bar Chart */}
        <div className="card p-4 lg:p-6 hover:border-myth-accent/30 transition-all duration-300">
          <h3 className="text-sm lg:text-base font-semibold text-white mb-4">Team Ticket Resolution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={teamResolutionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="resolved" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]} 
                animationDuration={800}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Ticket Volume Trend - Line Chart */}
        <div className="card p-4 lg:p-6 hover:border-myth-accent/30 transition-all duration-300">
          <h3 className="text-sm lg:text-base font-semibold text-white mb-4">Ticket Volume Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={ticketVolumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="volume" 
                stroke="#10b981" 
                strokeWidth={3} 
                dot={{ fill: '#10b981', r: 4 }} 
                activeDot={{ r: 6 }}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Ticket Status Distribution - Pie Chart */}
        <div className="card p-4 lg:p-6 hover:border-myth-accent/30 transition-all duration-300">
          <h3 className="text-sm lg:text-base font-semibold text-white mb-4">Ticket Status Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={ticketStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {ticketStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
