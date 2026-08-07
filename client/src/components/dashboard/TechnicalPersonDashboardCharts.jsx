import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Briefcase, CheckCircle, Clock, Bug, FolderKanban, FileText } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const taskStatusData = [
  { name: 'New', value: 12, color: '#3b82f6' },
  { name: 'In Progress', value: 8, color: '#f59e0b' },
  { name: 'Code Review', value: 5, color: '#8b5cf6' },
  { name: 'Testing', value: 4, color: '#06b6d4' },
  { name: 'Completed', value: 25, color: '#10b981' },
];

const weeklyCompletionData = [
  { week: 'Week 1', completed: 8 },
  { week: 'Week 2', completed: 12 },
  { week: 'Week 3', completed: 10 },
  { week: 'Week 4', completed: 15 },
  { week: 'Week 5', completed: 18 },
  { week: 'Week 6', completed: 14 },
];

const taskTypeData = [
  { name: 'Development', value: 20 },
  { name: 'Bug Fix', value: 15 },
  { name: 'Testing', value: 8 },
  { name: 'Code Review', value: 7 },
  { name: 'Documentation', value: 4 },
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

export default function TechnicalPersonDashboardCharts() {
  return (
    <div className="space-y-4 lg:space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 lg:gap-4">
        <KPICard icon={Briefcase} label="My Tasks" value={54} color="bg-blue-500/20" />
        <KPICard icon={Clock} label="Active Tasks" value={29} color="bg-amber-500/20" />
        <KPICard icon={CheckCircle} label="Completed Tasks" value={25} color="bg-green-500/20" />
        <KPICard icon={Bug} label="Bugs Assigned" value={8} color="bg-red-500/20" />
        <KPICard icon={FolderKanban} label="Projects Assigned" value={4} color="bg-purple-500/20" />
        <KPICard icon={FileText} label="Pending Reviews" value={5} color="bg-cyan-500/20" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* My Tasks by Status - Pie Chart */}
        <div className="card p-4 lg:p-6 hover:border-myth-accent/30 transition-all duration-300">
          <h3 className="text-sm lg:text-base font-semibold text-white mb-4">My Tasks by Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={taskStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {taskStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Task Completion - Line Chart */}
        <div className="card p-4 lg:p-6 hover:border-myth-accent/30 transition-all duration-300">
          <h3 className="text-sm lg:text-base font-semibold text-white mb-4">Weekly Task Completion</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weeklyCompletionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="week" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="completed" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                dot={{ fill: '#3b82f6', r: 4 }} 
                activeDot={{ r: 6 }}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Task Type Distribution - Bar Chart */}
        <div className="card p-4 lg:p-6 hover:border-myth-accent/30 transition-all duration-300">
          <h3 className="text-sm lg:text-base font-semibold text-white mb-4">Task Type Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={taskTypeData}>
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
      </div>
    </div>
  );
}
