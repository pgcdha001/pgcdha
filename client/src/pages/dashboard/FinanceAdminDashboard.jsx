import React from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, FileText, TrendingUp, CreditCard, Calculator, PieChart } from 'lucide-react';

const FinanceAdminDashboard = () => {
  const stats = [
    { name: 'Monthly Revenue', value: '₨2.4M', icon: DollarSign, color: 'bg-green-500' },
    { name: 'Pending Payments', value: '₨186K', icon: CreditCard, color: 'bg-orange-500' },
    { name: 'Financial Reports', value: '12', icon: FileText, color: 'bg-blue-500' },
    { name: 'Budget Utilization', value: '78%', icon: PieChart, color: 'bg-purple-500' },
  ];

  const quickActions = [
    { title: 'Fee Management', href: '/finance/fees', icon: DollarSign, description: 'Manage student fees' },
    { title: 'Financial Reports', href: '/finance/reports', icon: FileText, description: 'Generate reports' },
    { title: 'Budget Planning', href: '/finance/budget', icon: Calculator, description: 'Plan and track budget' },
    { title: 'Analytics', href: '/finance/analytics', icon: TrendingUp, description: 'Financial analytics' },
  ];

  const recentTransactions = [
    { type: 'Fee Payment', student: 'Ahmed Hassan', amount: '₨25,000', status: 'completed' },
    { type: 'Salary Payment', staff: 'Dr. Khan', amount: '₨85,000', status: 'pending' },
    { type: 'Facility Payment', vendor: 'Tech Solutions', amount: '₨15,000', status: 'completed' },
  ];

  return (
    <div className="space-y-8">
      {/* Header Card */}
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-border/50 p-8 transition-all duration-300 hover:shadow-2xl hover:bg-white/70" style={{boxShadow: '0 12px 48px 0 rgba(26,35,126,0.12)'}}>
        <div className="flex items-center gap-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/90 to-green-600/80 text-white shadow-lg">
            <DollarSign className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-primary mb-2 font-[Sora,Inter,sans-serif] tracking-tight">Finance Admin Dashboard</h2>
            <p className="text-muted-foreground font-medium">Manage financial operations and budgets</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={stat.name} className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg border border-border/50 p-6 transition-all duration-300 hover:shadow-xl hover:bg-white/70 hover:scale-[1.02] group" style={{boxShadow: '0 8px 32px 0 rgba(26,35,126,0.10)'}}>
            <div className="flex items-center">
              <div className={`${stat.color} rounded-2xl p-4 shadow-lg transition-transform duration-200 group-hover:scale-110`}>
                <stat.icon className="h-7 w-7 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-primary/70 mb-1">{stat.name}</p>
                <p className="text-3xl font-bold text-primary font-[Sora,Inter,sans-serif]">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-border/50 p-8 transition-all duration-300 hover:shadow-2xl hover:bg-white/70" style={{boxShadow: '0 12px 48px 0 rgba(26,35,126,0.12)'}}>
        <h3 className="text-2xl font-bold text-primary mb-6 font-[Sora,Inter,sans-serif] flex items-center gap-3">
          <div className="w-1 h-8 bg-gradient-to-b from-primary to-accent rounded-full"></div>
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className="group bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-border/30 transition-all duration-300 hover:shadow-xl hover:bg-white/80 hover:scale-[1.02] hover:border-primary/20"
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/15 mb-4 transition-all duration-200 group-hover:from-green-500/30 group-hover:to-green-600/25 group-hover:scale-110">
                  <action.icon className="h-7 w-7 text-green-600" />
                </div>
                <h4 className="text-lg font-bold text-primary mb-2 font-[Sora,Inter,sans-serif] group-hover:text-green-600 transition-colors duration-200">{action.title}</h4>
                <p className="text-sm text-muted-foreground font-medium">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Transactions */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-border/50 p-6 transition-all duration-300 hover:shadow-2xl hover:bg-white/70" style={{boxShadow: '0 12px 48px 0 rgba(26,35,126,0.12)'}}>
          <h3 className="text-xl font-bold text-primary mb-6 font-[Sora,Inter,sans-serif] flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
            Recent Transactions
          </h3>
          <div className="space-y-4">
            {recentTransactions.map((transaction, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-border/30 transition-all duration-200 hover:bg-white/70 hover:shadow-md">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/80 to-green-600/70 flex items-center justify-center text-white font-bold shadow-lg">
                    ₨
                  </div>
                  <div>
                    <p className="font-semibold text-primary font-[Sora,Inter,sans-serif]">{transaction.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.student || transaction.staff || transaction.vendor}
                    </p>
                    <p className="text-sm font-bold text-green-600">{transaction.amount}</p>
                  </div>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                  transaction.status === 'completed' ? 'bg-green-100/80 text-green-800' : 'bg-yellow-100/80 text-yellow-800'
                }`}>
                  {transaction.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-border/50 p-6 transition-all duration-300 hover:shadow-2xl hover:bg-white/70" style={{boxShadow: '0 12px 48px 0 rgba(26,35,126,0.12)'}}>
          <h3 className="text-xl font-bold text-primary mb-6 font-[Sora,Inter,sans-serif] flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
            Monthly Summary
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-white/50 rounded-xl border border-border/30">
              <span className="text-primary/80 font-semibold">Total Income</span>
              <span className="font-bold text-green-600 text-lg">₨2,400,000</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white/50 rounded-xl border border-border/30">
              <span className="text-primary/80 font-semibold">Total Expenses</span>
              <span className="font-bold text-red-600 text-lg">₨1,850,000</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white/50 rounded-xl border border-border/30">
              <span className="text-primary/80 font-semibold">Net Profit</span>
              <span className="font-bold text-blue-600 text-lg">₨550,000</span>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-4"></div>
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50/80 to-purple-100/60 rounded-xl border border-purple-200/50">
              <span className="text-primary font-bold">Budget Remaining</span>
              <span className="font-bold text-purple-600 text-xl">₨450,000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceAdminDashboard;
