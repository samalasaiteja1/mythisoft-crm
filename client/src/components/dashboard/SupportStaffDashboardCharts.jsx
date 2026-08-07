import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Ticket, AlertCircle, Clock, CheckCircle, MessageSquare, TrendingUp } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const ticketStatusData = [
  { name: 'Open', value: 12, color: '#3b82f6' },
  { name: 'In Progress', value: 8, color: '#f59e0b' },
  { name: 'Waiting Customer', value: 5, color: '#8b5cf6' },
  { name: 'Resolved', value: 15, color: '#10b981' },
  { name: 'Closed', value: 28, color: '#06b6d4' },
];

const dailyVolumeData = [
  { day: 'Mon', volume: 8 },
  { day: 'Tue', volume: 12 },
  { day: 'Wed', volume: 10 },
  { day: 'Thu', volume: 15 },
  { day: 'Fri', volume: 11 },
  { day: 'Sat', volume: 6 },
  { day: 'Sun', volume: 4 },
];

const ticketTypeData = [
  { name: 'Technical', value: 25 },
  { name: 'Billing', value: 12 },
  { name: 'Login', value: 15 },
  { name: 'Feature Request', value: 8 },
  { name: 'General Inquiry', value: 8 },
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

export default function SupportStaffDashboardCharts() {
  return (
    <div className="space-y-4 lg:space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 lg:gap-4">
        <KPICard icon={Ticket} label="My Tickets" value={68} color="bg-blue-500/20" />
        <KPICard icon={AlertCircle} label="Open Tickets" value={12} color="bg-red-500/20" />
        <KPICard icon={Clock} label="In Progress" value={8} color="bg-amber-500/20" />
        <KPICard icon={CheckCircle} label="Resolved Today" value={5} color="bg-green-500/20" />
        <KPICard icon={MessageSquare} label="Pending Follow-ups" value={7} color="bg-purple-500/20" />
        <KPICard icon={TrendingUp} label="Closed Tickets" value={28} color="bg-cyan-500/20" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* My Tickets by Status - Pie Chart */}
        <div className="card p-4 lg:p-6 hover:border-myth-accent/30 transition-all duration-300">
          <h3 className="text-sm lg:text-base font-semibold text-white mb-4">My Tickets by Status</h3>
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

        {/* Daily Ticket Volume - Line Chart */}
        <div className="card p-4 lg:p-6 hover:border-myth-accent/30 transition-all duration-300">
          <h3 className="text-sm lg:text-base font-semibold text-white mb-4">Daily Ticket Volume</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dailyVolumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="volume" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                dot={{ fill: '#3b82f6', r: 4 }} 
                activeDot={{ r: 6 }}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Ticket Type Distribution - Bar Chart */}
        <div className="card p-4 lg:p-6 hover:border-myth-accent/30 transition-all duration-300">
          <h3 className="text-sm lg:text-base font-semibold text-white mb-4">Ticket Type Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ticketTypeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="value" 
                fill="#10b981" 
                radius={[4, 4, 0, 0]} 
                animationDuration={800}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
