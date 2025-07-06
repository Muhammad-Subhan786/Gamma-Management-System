import React from 'react';
import { Target, TrendingUp, Award, AlertTriangle } from 'lucide-react';

const GoalMeter = ({ goal, title = "Monthly Goal", showEdit = false, onEdit }) => {
  if (!goal) return null;



  const getStatusIcon = (progress) => {
    if (progress >= 100) return <Award className="h-8 w-8 text-green-500 animate-bounce" />;
    if (progress >= 75) return <TrendingUp className="h-8 w-8 text-blue-500 animate-pulse" />;
    if (progress >= 50) return <Target className="h-8 w-8 text-yellow-500 animate-pulse" />;
    return <AlertTriangle className="h-8 w-8 text-red-500 animate-pulse" />;
  };

  const getMotivationalMessage = (progress) => {
    if (progress >= 100) return "🏆 You did it! Celebrate your success!";
    if (progress >= 75) return "🚀 Almost there! Finish strong!";
    if (progress >= 50) return "💪 Halfway there! Keep up the great work!";
    if (progress >= 25) return "🔥 Good start! Keep the momentum going!";
    return "⚡ Let's get started! Every label counts!";
  };

  // Circular progress SVG
  const radius = 48;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progress = Math.min(goal.overallProgress, 100);
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-green-50 rounded-2xl shadow-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">{title}</h3>
        {showEdit && (
          <button
            onClick={onEdit}
            className="text-green-600 hover:text-green-800 text-sm font-semibold border border-green-200 px-3 py-1 rounded-lg bg-white shadow-sm"
          >
            Edit Goal
          </button>
        )}
      </div>

      {/* Animated Circular Progress */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative mb-2">
          <svg height={radius * 2} width={radius * 2} className="block">
            <circle
              stroke="#e5e7eb"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            <circle
              stroke={progress >= 100 ? '#22c55e' : progress >= 75 ? '#3b82f6' : progress >= 50 ? '#facc15' : '#ef4444'}
              fill="transparent"
              strokeWidth={stroke}
              strokeDasharray={circumference + ' ' + circumference}
              style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s cubic-bezier(.4,2,.6,1)' }}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {getStatusIcon(goal.overallProgress)}
            <span className={`text-3xl font-extrabold ${progress >= 100 ? 'text-green-600' : progress >= 75 ? 'text-blue-600' : progress >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{goal.overallProgress.toFixed(1)}%</span>
          </div>
        </div>
        <div className="mt-2 text-center text-lg font-semibold text-gray-700">
          {getMotivationalMessage(goal.overallProgress)}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center border-t-4 border-blue-400">
          <span className="text-xs text-gray-500 mb-1">Target Labels</span>
          <span className="text-xl font-bold text-blue-700">{goal.targetLabels.toLocaleString()}</span>
        </div>
        <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center border-t-4 border-blue-600">
          <span className="text-xs text-gray-500 mb-1">Achieved Labels</span>
          <span className="text-xl font-bold text-blue-900">{goal.currentLabels.toLocaleString()}</span>
        </div>
        <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center border-t-4 border-green-400">
          <span className="text-xs text-gray-500 mb-1">Target Revenue</span>
          <span className="text-xl font-bold text-green-700">${goal.targetRevenue.toLocaleString()}</span>
        </div>
        <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center border-t-4 border-green-600">
          <span className="text-xs text-gray-500 mb-1">Achieved Revenue</span>
          <span className="text-xl font-bold text-green-900">${goal.currentRevenue.toLocaleString()}</span>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Labels Progress</span>
          <span className="text-sm text-gray-600">
            {goal.currentLabels.toLocaleString()} / {goal.targetLabels.toLocaleString()}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="h-2 bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min((goal.currentLabels / goal.targetLabels) * 100, 100)}%` }}
          ></div>
        </div>
      </div>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Revenue Progress</span>
          <span className="text-sm text-gray-600">
            ${goal.currentRevenue.toLocaleString()} / ${goal.targetRevenue.toLocaleString()}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="h-2 bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min((goal.currentRevenue / goal.targetRevenue) * 100, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center justify-between mt-6">
        <span className={`inline-flex items-center px-4 py-1 rounded-full text-base font-bold shadow-md border-2 ${
          goal.status === 'completed' ? 'bg-green-100 text-green-800 border-green-300' :
          goal.status === 'active' ? 'bg-blue-100 text-blue-800 border-blue-300' :
          'bg-red-100 text-red-800 border-red-300'
        }`}>
          {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
        </span>
        <span className="text-xs text-gray-500 font-semibold">
          {goal.month}
        </span>
      </div>

      {/* Motivational Tip */}
      <div className="mt-6 text-center text-sm text-gray-500 italic">
        "Success is the sum of small efforts, repeated day in and day out." – Robert Collier
      </div>
    </div>
  );
};

export default GoalMeter; 