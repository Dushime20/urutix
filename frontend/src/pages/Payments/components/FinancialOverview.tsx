import React from 'react';
import { AlertCircle, Clock, CheckCircle, DollarSign } from 'lucide-react';
import type { FinancialSummary } from '../types';
import { formatCurrency } from '../utils';
import { StatCard } from '@/components/EnliteUI/Cards/StatCard';

interface FinancialOverviewProps {
  summary: FinancialSummary;
  isLoading?: boolean;
}

const FinancialOverview: React.FC<FinancialOverviewProps> = ({ summary, isLoading }) => {
  const cards = [
    { icon: AlertCircle, label: 'Overdue',  amount: summary.overdue.amount,   count: summary.overdue.count },
    { icon: Clock,       label: 'Due Soon', amount: summary.dueSoon.amount,   count: summary.dueSoon.count },
    { icon: CheckCircle, label: 'Paid',     amount: summary.completed.amount, count: summary.completed.count },
    { icon: DollarSign,  label: 'Total',    amount: summary.total.amount,     count: summary.total.count },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-slate-50 rounded-3xl border border-slate-100 p-6 animate-pulse">
            <div className="h-12 w-12 bg-slate-200 rounded-2xl mb-4" />
            <div className="h-4 w-20 bg-slate-200 rounded mb-3" />
            <div className="h-8 w-32 bg-slate-200 rounded mb-2" />
            <div className="h-3 w-24 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map(({ icon: Icon, label, amount, count }) => (
        <StatCard
          key={label}
          title={label}
          value={formatCurrency(amount)}
          subtitle={`${count} payment${count !== 1 ? 's' : ''}`}
          icon={<Icon size={20} />}
          color="primary"
          variant="classic"
        />
      ))}
    </div>
  );
};

export default FinancialOverview;
