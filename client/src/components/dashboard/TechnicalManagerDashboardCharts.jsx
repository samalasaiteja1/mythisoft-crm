import {
  LineChart, Line, PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';

const COLORS = {
  teamA: '#3b82f6',
  teamB: '#10b981',
  teamC: '#f59e0b',
  teamD: '#8b5cf6',
  planning: '#3b82f6',
  development: '#10b981',
  codeReview: '#8b5cf6',
  testing: '#f59e0b',
  bugFixing: '#ef4444',
  completed: '#22c55e',
};

export default function TechnicalManagerDashboardCharts({ roleStats }) {
  // Team Performance Data (Bar Chart)
  const teamPerformanceData = [
    { name: 'Team A', tasksCompleted: 120, color: COLORS.teamA },
    { name: 'Team B', tasksCompleted: 105, color: COLORS.teamB },
    { name: 'Team C', tasksCompleted: 95, color: COLORS.teamC },
    { name: 'Team D', tasksCompleted: 80, color: COLORS.teamD },
  ];

  // Project Progress Data (Line Chart)
  const projectProgressData = [
    { month: 'Jan', completed: 20 },
    { month: 'Feb', completed: 35 },
    { month: 'Mar', completed: 50 },
    { month: 'Apr', completed: 65 },
    { month: 'May', completed: 82 },
    { month: 'Jun', completed: 100 },
  ];

  // Task Status Data (Pie Chart)
  const taskStatusData = [
    { name: 'Planning', value: 10, color: COLORS.planning },
    { name: 'Development', value: 40, color: COLORS.development },
    { name: 'Code Review', value: 15, color: COLORS.codeReview },
    { name: 'Testing', value: 20, color: COLORS.testing },
    { name: 'Bug Fixing', value: 10, color: COLORS.bugFixing },
    { name: 'Completed', value: 5, color: COLORS.completed },
  ];

  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-myth-card border border-myth-border rounded-lg p-3 shadow-lg">
          <p className="text-xs text-gray-400 mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs text-white" style={{ color: entry.color }}>
              Tasks Completed: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomLineTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-myth-card border border-myth-border rounded-lg p-3 shadow-lg">
          <p className="text-xs text-gray-400 mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs text-white" style={{ color: entry.color }}>
              Completed: {entry.value}%
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
          <p className="text-xs text-gray-400">{data.value}% of tasks</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Team Performance - Bar Chart */}
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          📊 Team Performance
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={teamPerformanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 10 }} />
            <YAxis stroke="#9ca3af" tick={{ fontSize: 10 }} />
            <Tooltip content={<CustomBarTooltip />} />
            <Legend />
            <Bar dataKey="tasksCompleted" radius={[4, 4, 0, 0]}>
              {teamPerformanceData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Task Status - Pie Chart */}
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          🥧 Task Status
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={taskStatusData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
            >
              {taskStatusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomPieTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Project Progress - Line Chart */}
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          📈 Project Progress
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={projectProgressData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" stroke="#9ca3af" tick={{ fontSize: 10 }} />
            <YAxis stroke="#9ca3af" tick={{ fontSize: 10 }} tickFormatter={(value) => `${value}%`} />
            <Tooltip content={<CustomLineTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="completed" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
