import React from 'react';
import { Truck, User, Calendar, Activity } from 'lucide-react';
import { useUtilizationSummary } from '../../hooks/useAvailability';
import { cn } from '../../utils/cn';

interface Props {
  className?: string;
}

export const UtilizationSummary: React.FC<Props> = ({ className }) => {
  const { data: summary, isLoading } = useUtilizationSummary();

  const cards = [
    {
      label: 'Available Trucks',
      value: summary?.availableTrucks ?? 0,
      icon: Truck,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      label: 'Busy Trucks',
      value: summary?.busyTrucks ?? 0,
      icon: Truck,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
    },
    {
      label: 'Available Drivers',
      value: summary?.availableDrivers ?? 0,
      icon: User,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      label: 'Busy Drivers',
      value: summary?.busyDrivers ?? 0,
      icon: User,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-100',
    },
    {
      label: 'Current Trips',
      value: summary?.currentTrips ?? 0,
      icon: Activity,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100',
    },
    {
      label: 'Upcoming Trips',
      value: summary?.upcomingTrips ?? 0,
      icon: Calendar,
      color: 'text-[#345E85]',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
  ];

  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3', className)}>
      {cards.map((card) => (
        <div
          key={card.label}
          className={cn(
            'rounded-2xl p-4 border flex flex-col items-center text-center gap-2',
            card.bg,
            card.border,
          )}
        >
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center bg-white border', card.border)}>
            <card.icon size={16} className={card.color} />
          </div>
          {isLoading ? (
            <div className="h-6 w-8 bg-slate-200 animate-pulse rounded-lg" />
          ) : (
            <p className={cn('text-2xl font-black', card.color)}>{card.value}</p>
          )}
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-tight">
            {card.label}
          </p>
        </div>
      ))}
    </div>
  );
};
