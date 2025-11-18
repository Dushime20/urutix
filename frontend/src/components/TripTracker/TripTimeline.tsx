import React from 'react';

export const TripTimeline = ({ status, milestones }: any) => (
  <div className="mb-4">
    <h2 className="text-lg font-bold mb-2">Status Timeline</h2>
    <ol className="relative border-l border-gray-300">
      {milestones?.map((m: any, i: number) => (
        <li key={i} className="mb-6 ml-4">
          <div className={`absolute w-3 h-3 rounded-full -left-1.5 top-1.5 ${m.completed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          <div className="flex flex-col">
            <span className={`font-semibold ${m.completed ? 'text-green-700' : 'text-gray-700'}`}>{m.label}</span>
            <span className="text-xs text-gray-500">{m.time ? new Date(m.time).toLocaleString() : '-'}</span>
          </div>
        </li>
      ))}
      <li className="ml-4">
        <span className="font-semibold text-blue-700">Current Status: {status}</span>
      </li>
    </ol>
  </div>
);
