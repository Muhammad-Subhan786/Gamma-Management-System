import React, { useState, useEffect } from 'react';
import { 
  Target, 
  TrendingUp, 
  Award, 
  AlertTriangle, 
  Zap, 
  Rocket, 
  Star, 
  Trophy, 
  Fire, 
  Lightning,
  Calendar,
  Clock,
  DollarSign,
  BarChart3,
  Crown,
  Sparkles,
  ArrowUp,
  CheckCircle,
  Play,
  Pause
} from 'lucide-react';

const GoalMeter = ({ goal, title = "Monthly Goal", showEdit = false, onEdit }) => {
  const [animateProgress, setAnimateProgress] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    // Trigger animations
    setAnimateProgress(true);
    
    // Calculate time remaining in month
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const timeLeft = endOfMonth - now;
    const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
    setTimeRemaining(`${daysLeft} days left`);

    // Simulate streak (in real app, this would come from backend)
    setCurrentStreak(Math.floor(Math.random() * 15) + 5);

    // Show sparkles for high achievers
    if (goal?.overallProgress >= 100) {
      setShowSparkles(true);
    }
  }, [goal]);

  if (!goal) return null;

  const getProgressColor = (progress) => {
    if (progress >= 100) return 'from-emerald-400 to-green-600';
    if (progress >= 75) return 'from-blue-400 to-indigo-600';
    if (progress >= 50) return 'from-yellow-400 to-orange-600';
    return 'from-red-400 to-pink-600';
  };

  const getStatusIcon = (progress) => {
    if (progress >= 100) return <Crown className="h-10 w-10 text-yellow-500 animate-bounce" />;
    if (progress >= 75) return <Rocket className="h-10 w-10 text-blue-500 animate-pulse" />;
    if (progress >= 50) return <Target className="h-10 w-10 text-yellow-500 animate-pulse" />;
    return <Zap className="h-10 w-10 text-red-500 animate-pulse" />;
  };

  const getMotivationalMessage = (progress) => {
    if (progress >= 100) return "🏆 CHAMPION! You've exceeded expectations!";
    if (progress >= 75) return "🚀 EXCELLENT! You're in the elite zone!";
    if (progress >= 50) return "💪 AMAZING! You're halfway to greatness!";
    if (progress >= 25) return "🔥 FANTASTIC! You're building momentum!";
    return "⚡ LET'S GO! Your journey to success starts now!";
  };

  const getUrgencyMessage = (progress, daysLeft) => {
    if (daysLeft <= 7) {
      return "🔥 FINAL PUSH! This is your moment to shine!";
    } else if (daysLeft <= 14) {
      return "⚡ ACCELERATE! Double down on your efforts!";
    } else {
      return "🎯 STEADY PROGRESS! Keep the momentum going!";
    }
  };

  const getPerformanceLevel = (progress) => {
    if (progress >= 100) return { level: "LEGENDARY", color: "text-yellow-600", bg: "bg-yellow-100" };
    if (progress >= 90) return { level: "EXCEPTIONAL", color: "text-purple-600", bg: "bg-purple-100" };
    if (progress >= 75) return { level: "EXCELLENT", color: "text-blue-600", bg: "bg-blue-100" };
    if (progress >= 50) return { level: "GOOD", color: "text-green-600", bg: "bg-green-100" };
    if (progress >= 25) return { level: "PROGRESSING", color: "text-orange-600", bg: "bg-orange-100" };
    return { level: "STARTING", color: "text-red-600", bg: "bg-red-100" };
  };

  // Circular progress SVG
  const radius = 60;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progress = Math.min(goal.overallProgress, 100);
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const performanceLevel = getPerformanceLevel(progress);

  return (
    <div className="relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 animate-pulse"></div>
      
      {/* Sparkles for high achievers */}
      {showSparkles && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <Sparkles 
              key={i}
              className="absolute text-yellow-400 animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            />
          ))}
        </div>
      )}

      <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
        {/* Header with Performance Level */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <Target className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {title}
              </h3>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${performanceLevel.bg} ${performanceLevel.color} mt-2`}>
                <Star className="h-4 w-4 mr-1" />
                {performanceLevel.level}
              </div>
            </div>
          </div>
          
          {showEdit && (
            <button
              onClick={onEdit}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <Target className="h-5 w-5 inline mr-2" />
              Edit Goal
            </button>
          )}
        </div>

        {/* Main Progress Section */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Circular Progress */}
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
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
                  stroke="url(#gradient)"
                  fill="transparent"
                  strokeWidth={stroke}
                  strokeDasharray={circumference + ' ' + circumference}
                  style={{ 
                    strokeDashoffset: animateProgress ? strokeDashoffset : circumference,
                    transition: 'stroke-dashoffset 2s cubic-bezier(.4,2,.6,1)' 
                  }}
                  strokeLinecap="round"
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={progress >= 100 ? "#22c55e" : progress >= 75 ? "#3b82f6" : progress >= 50 ? "#facc15" : "#ef4444"} />
                    <stop offset="100%" stopColor={progress >= 100 ? "#16a34a" : progress >= 75 ? "#1d4ed8" : progress >= 50 ? "#eab308" : "#dc2626"} />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {getStatusIcon(goal.overallProgress)}
                <span className={`text-4xl font-black ${progress >= 100 ? 'text-green-600' : progress >= 75 ? 'text-blue-600' : progress >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {goal.overallProgress.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-800 mb-2">
                {getMotivationalMessage(goal.overallProgress)}
              </div>
              <div className="text-sm text-gray-600 font-medium">
                {getUrgencyMessage(goal.overallProgress, parseInt(timeRemaining))}
              </div>
            </div>
          </div>

          {/* Key Stats */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Labels Progress */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-700 bg-blue-200 px-2 py-1 rounded-full">
                    LABELS
                  </span>
                </div>
                <div className="text-2xl font-black text-blue-900 mb-1">
                  {goal.currentLabels.toLocaleString()}
                </div>
                <div className="text-sm text-blue-700 mb-3">
                  of {goal.targetLabels.toLocaleString()} target
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((goal.currentLabels / goal.targetLabels) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Revenue Progress */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
                <div className="flex items-center justify-between mb-3">
                  <DollarSign className="h-6 w-6 text-green-600" />
                  <span className="text-xs font-semibold text-green-700 bg-green-200 px-2 py-1 rounded-full">
                    REVENUE
                  </span>
                </div>
                <div className="text-2xl font-black text-green-900 mb-1">
                  ${goal.currentRevenue.toLocaleString()}
                </div>
                <div className="text-sm text-green-700 mb-3">
                  of ${goal.targetRevenue.toLocaleString()} target
                </div>
                <div className="w-full bg-green-200 rounded-full h-2">
                  <div 
                    className="h-2 bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((goal.currentRevenue / goal.targetRevenue) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Streak Counter */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
                <div className="flex items-center justify-between mb-3">
                  <Fire className="h-6 w-6 text-orange-600" />
                  <span className="text-xs font-semibold text-orange-700 bg-orange-200 px-2 py-1 rounded-full">
                    STREAK
                  </span>
                </div>
                <div className="text-2xl font-black text-orange-900 mb-1">
                  {currentStreak} days
                </div>
                <div className="text-sm text-orange-700 mb-3">
                  Keep it burning! 🔥
                </div>
                <div className="flex space-x-1">
                  {[...Array(Math.min(currentStreak, 5))].map((_, i) => (
                    <div key={i} className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  ))}
                </div>
              </div>

              {/* Time Remaining */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
                <div className="flex items-center justify-between mb-3">
                  <Clock className="h-6 w-6 text-purple-600" />
                  <span className="text-xs font-semibold text-purple-700 bg-purple-200 px-2 py-1 rounded-full">
                    TIME LEFT
                  </span>
                </div>
                <div className="text-2xl font-black text-purple-900 mb-1">
                  {timeRemaining}
                </div>
                <div className="text-sm text-purple-700 mb-3">
                  Make every day count!
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div className="h-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Achievement Badges */}
        <div className="mb-8">
          <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
            Your Achievements
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {goal.currentLabels >= goal.targetLabels * 0.25 && (
              <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl p-3 text-center border border-blue-300">
                <div className="text-2xl mb-1">🥉</div>
                <div className="text-xs font-bold text-blue-800">Quarter Master</div>
              </div>
            )}
            {goal.currentLabels >= goal.targetLabels * 0.5 && (
              <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-xl p-3 text-center border border-yellow-300">
                <div className="text-2xl mb-1">🥈</div>
                <div className="text-xs font-bold text-yellow-800">Halfway Hero</div>
              </div>
            )}
            {goal.currentLabels >= goal.targetLabels * 0.75 && (
              <div className="bg-gradient-to-r from-orange-100 to-orange-200 rounded-xl p-3 text-center border border-orange-300">
                <div className="text-2xl mb-1">🥇</div>
                <div className="text-xs font-bold text-orange-800">Elite Performer</div>
              </div>
            )}
            {goal.currentLabels >= goal.targetLabels && (
              <div className="bg-gradient-to-r from-green-100 to-green-200 rounded-xl p-3 text-center border border-green-300">
                <div className="text-2xl mb-1">🏆</div>
                <div className="text-xs font-bold text-green-800">Goal Crusher</div>
              </div>
            )}
            {goal.currentLabels >= goal.targetLabels * 1.25 && (
              <div className="bg-gradient-to-r from-purple-100 to-purple-200 rounded-xl p-3 text-center border border-purple-300">
                <div className="text-2xl mb-1">👑</div>
                <div className="text-xs font-bold text-purple-800">Overachiever</div>
              </div>
            )}
            {currentStreak >= 10 && (
              <div className="bg-gradient-to-r from-red-100 to-red-200 rounded-xl p-3 text-center border border-red-300">
                <div className="text-2xl mb-1">🔥</div>
                <div className="text-xs font-bold text-red-800">Streak Master</div>
              </div>
            )}
          </div>
        </div>

        {/* Motivational Call to Action */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white text-center">
          <div className="flex items-center justify-center mb-3">
            <Lightning className="h-8 w-8 mr-3 animate-pulse" />
            <h3 className="text-2xl font-bold">Ready to Level Up?</h3>
          </div>
          <p className="text-lg mb-4 opacity-90">
            {progress >= 100 
              ? "You've crushed your goal! Time to set new heights! 🚀"
              : progress >= 75
              ? "You're so close! Push through to victory! 💪"
              : progress >= 50
              ? "You're halfway there! Double your efforts! 🔥"
              : "Every label counts! Start your journey to success! ⚡"
            }
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm">
            <div className="flex items-center">
              <ArrowUp className="h-4 w-4 mr-1" />
              <span>Keep pushing</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-1" />
              <span>Stay focused</span>
            </div>
            <div className="flex items-center">
              <Star className="h-4 w-4 mr-1" />
              <span>Achieve greatness</span>
            </div>
          </div>
        </div>

        {/* Status and Month */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-lg border-2 ${
              goal.status === 'completed' ? 'bg-green-100 text-green-800 border-green-300' :
              goal.status === 'active' ? 'bg-blue-100 text-blue-800 border-blue-300' :
              'bg-red-100 text-red-800 border-red-300'
            }`}>
              {goal.status === 'completed' ? <CheckCircle className="h-4 w-4 mr-2" /> : 
               goal.status === 'active' ? <Play className="h-4 w-4 mr-2" /> : 
               <Pause className="h-4 w-4 mr-2" />}
              {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
            </span>
            <div className="flex items-center text-gray-600">
              <Calendar className="h-4 w-4 mr-1" />
              <span className="text-sm font-semibold">{goal.month}</span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-xs text-gray-500 font-medium">Performance Score</div>
            <div className="text-lg font-bold text-gray-800">{goal.overallProgress.toFixed(1)}/100</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalMeter; 