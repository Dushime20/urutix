import { cn } from "@/utils/cn";
import React from "react";

export default function SmCard({
  Icon,
  title,
  content,
  className,
}: {
  title: React.ReactNode | string;
  content?: React.ReactNode | string;
  Icon: React.ElementType;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center space-x-3 p-3 bg-gray-50 dark:bg-slate-800 group-hover:shadow rounded-lg shadow-sm min-w-0 overflow-hidden w-full transition-colors duration-300", className)}>
      <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm flex-shrink-0 transition-colors duration-300">
        <Icon className="size-4 text-gray-600 dark:text-slate-400" />
      </div>
      <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
        <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-slate-100 break-words overflow-wrap-anywhere">{title}</span>
        {content && <span className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 break-words overflow-wrap-anywhere">{content}</span>}
      </div>
    </div>
  );
}
