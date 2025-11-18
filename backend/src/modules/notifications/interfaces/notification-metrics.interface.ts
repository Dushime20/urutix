export interface NotificationMetrics {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  opened: number;
  clicked: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  channelBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  period: {
    start: Date;
    end: Date;
  };
}

export interface ChannelMetrics {
  channel: string;
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  deliveryRate: number;
  averageResponseTime: number;
}

export interface CategoryMetrics {
  category: string;
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  opened: number;
  clicked: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
}

export interface UserMetrics {
  userId: string;
  totalReceived: number;
  totalRead: number;
  totalClicked: number;
  readRate: number;
  clickRate: number;
  preferredChannels: string[];
  preferredCategories: string[];
}

export interface TemplateMetrics {
  templateId: string;
  totalUsed: number;
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  deliveryRate: number;
  averageResponseTime: number;
  lastUsed: Date;
}

export interface PerformanceMetrics {
  averageDeliveryTime: number;
  averageResponseTime: number;
  errorRate: number;
  retryRate: number;
  cacheHitRate: number;
  queueSize: number;
  activeWorkers: number;
}

export interface TimeSeriesMetrics {
  timestamp: Date;
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  opened: number;
  clicked: number;
}

export interface NotificationAnalytics {
  overview: NotificationMetrics;
  channels: ChannelMetrics[];
  categories: CategoryMetrics[];
  topUsers: UserMetrics[];
  topTemplates: TemplateMetrics[];
  performance: PerformanceMetrics;
  timeSeries: TimeSeriesMetrics[];
}
