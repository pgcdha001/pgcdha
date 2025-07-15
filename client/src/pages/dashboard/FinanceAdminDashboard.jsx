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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Finance Admin Dashboard</h2>
        <p className="text-gray-600">Manage financial operations and budgets</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`${stat.color} rounded-lg p-3`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
            >
              <action.icon className="h-8 w-8 text-blue-600 mb-2" />
              <h4 className="font-medium text-gray-900">{action.title}</h4>
              <p className="text-sm text-gray-600">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {recentTransactions.map((transaction, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{transaction.type}</p>
                  <p className="text-sm text-gray-600">
                    {transaction.student || transaction.staff || transaction.vendor}
                  </p>
                  <p className="text-sm font-medium text-green-600">{transaction.amount}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {transaction.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Income</span>
              <span className="font-semibold text-green-600">₨2,400,000</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Expenses</span>
              <span className="font-semibold text-red-600">₨1,850,000</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Net Profit</span>
              <span className="font-semibold text-blue-600">₨550,000</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between items-center">
              <span className="text-gray-800 font-medium">Budget Remaining</span>
              <span className="font-bold text-purple-600">₨450,000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceAdminDashboard;
