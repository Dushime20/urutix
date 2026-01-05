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
    <div className={cn("flex items-center space-x-3 p-3 bg-gray-50 group-hover:shadow rounded-lg shadow-sm min-w-0 overflow-hidden w-full", className)}>
      <div className="p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
        <Icon className="size-4 text-gray-600" />
      </div>
      <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
        <span className="text-xs sm:text-sm font-medium text-gray-900 break-words overflow-wrap-anywhere">{title}</span>
        {content && <span className="text-xs sm:text-sm text-gray-600 break-words overflow-wrap-anywhere">{content}</span>}
      </div>
    </div>
  );
}
