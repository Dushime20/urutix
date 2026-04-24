import React from 'react';
import { AlertCircle, Clock, CheckCircle, DollarSign } from 'lucide-react';
import type { FinancialSummary } from '../types';
import { formatCurrency } from '../utils';
import { cn } from '@/utils/cn';

interface FinancialOverviewProps {
  summary: FinancialSummary;
  isLoading?: boolean;
}

const FinancialOverview: React.FC<FinancialOverviewProps> = ({ summary, isLoading }) => {
  const cards = [
    {
      icon: AlertCircle,
      label: 'Overdue',
      amount: summary.overdue.amount,
      count: summary.overdue.count,
      color: 'rose',
      bgColor: 'bg-rose-50',
      iconColor: 'text-rose-600',
      textColor: 'text-rose-900',
      borderColor: 'border-rose-200',
    },
    {
      icon: Clock,
      label: 'Due Soon',
      amount: summary.dueSoon.amount,
      count: summary.dueSoon.count,
      color: 'amber',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
      textColor: 'text-amber-900',
      borderColor: 'border-amber-200',
    },
    {
      icon: CheckCircle,
      label: 'Paid',
      amount: summary.completed.amount,
      count: summary.completed.count,
      color: 'emerald',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      textColor: 'text-emerald-900',
      borderColor: 'border-emerald-200',
    },
    {
      icon: DollarSign,
      label: 'Total',
      amount: summary.total.amount,
      count: summary.total.count,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-900',
      borderColor: 'border-blue-200',
    },
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-in fade-in duration-500">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={cn(
              "rounded-3xl border-2 p-6 transition-all hover:shadow-lg hover:scale-105 duration-300",
              card.bgColor,
              card.borderColor
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-sm",
              card.bgColor === 'bg-rose-50' ? 'bg-rose-100' :
              card.bgColor === 'bg-amber-50' ? 'bg-amber-100' :
              card.bgColor === 'bg-emerald-50' ? 'bg-emerald-100' :
              'bg-blue-100'
            )}>
              <Icon className={cn("w-6 h-6", card.iconColor)} />
            </div>
            
            <div className="space-y-2">
              <p className={cn(
                "text-[10px] font-black uppercase tracking-widest",
                card.textColor,
                "opacity-70"
              )}>
                {card.label}
              </p>
              
              <p className={cn(
                "text-2xl font-black",
                card.textColor
              )}>
                {formatCurrency(card.amount)}
              </p>
              
              <p className={cn(
                "text-xs font-bold",
                card.textColor,
                "opacity-60"
              )}>
                {card.count} payment{card.count !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Pulse animation for overdue */}
            {card.label === 'Overdue' && card.count > 0 && (
              <div className="absolute top-4 right-4">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FinancialOverview;
