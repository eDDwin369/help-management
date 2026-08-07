export type NotificationType = 'success' | 'warning' | 'error' | 'info' | 'system' | 'save' | 'share' | 'import';
export type NotificationCategory = 'Themes' | 'Team Activity' | 'System';

export interface NotificationAttachment {
  name: string;
  size: string;
  type: string;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  description: string;
  timestamp: Date;
  isRead: boolean;
  actionRoute: string; // The view to route to when clicked

  // High fidelity extensions for screenshot redesign
  initials?: string;
  actorName?: string;
  actionText?: string;
  targetName?: string;
  dateText?: string;
  subtext?: string;
  hasButtons?: boolean;
  attachment?: NotificationAttachment;
  isMention?: boolean;
}
