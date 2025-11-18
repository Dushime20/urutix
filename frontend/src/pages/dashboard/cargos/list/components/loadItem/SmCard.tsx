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
    <div className={cn("flex items-center space-x-3 p-3 bg-gray-50 group-hover:shadow rounded-lg shadow-sm", className)}>
      <div className="p-2 bg-white rounded-lg shadow-sm">
        <Icon className="size-4 text-teal-600" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900">{title}</span>
        {content && <span className="text-sm text-gray-600">{content}</span>}
      </div>
    </div>
  );
}
