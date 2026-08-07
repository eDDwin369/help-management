import type { NotificationItem } from './types';

export const mockNotifications: NotificationItem[] = [
  {
    id: '1',
    type: 'info',
    category: 'Team Activity',
    title: 'Alena King and Thomas Partey commented in Dashboard V2',
    description: 'Alena King and Thomas Partey commented in Dashboard V2 to resolve the grid layout issues.',
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
    isRead: false,
    actionRoute: 'overview',
    initials: 'AK',
    actorName: 'Alena King and Thomas Partey',
    actionText: 'commented in',
    targetName: 'Dashboard V2',
    dateText: 'Just now',
    isMention: true
  },
  {
    id: '2',
    type: 'info',
    category: 'Team Activity',
    title: 'Thomas Partey invited you to a project NetNest',
    description: 'Thomas Partey invited you to join the NetNest workspace as a collaborator.',
    timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
    isRead: true,
    actionRoute: 'overview',
    initials: 'TP',
    actorName: 'Thomas Partey',
    actionText: 'invited you to a project',
    targetName: 'NetNest',
    dateText: '2 hours ago',
    hasButtons: true
  },
  {
    id: '3',
    type: 'info',
    category: 'Team Activity',
    title: 'Thomas Partey added new project NetNest',
    description: 'A new repository and dashboard design context has been created for project NetNest.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    isRead: false,
    actionRoute: 'overview',
    initials: 'TP',
    actorName: 'Thomas Partey',
    actionText: 'added new project',
    targetName: 'NetNest',
    dateText: '4 hours ago'
  },
  {
    id: '4',
    type: 'system',
    category: 'System',
    title: 'Google Profile integration enabled successfully',
    description: 'OomniEye profiles can now sync photo uploads with Google Auth account presets.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 10), // 10 hours ago
    isRead: true,
    actionRoute: 'account',
    initials: 'GP',
    actorName: 'System Integration',
    actionText: 'enabled configuration',
    targetName: 'Google Profiles',
    dateText: '10 hours ago',
    subtext: 'API Auth'
  },
  {
    id: '5',
    type: 'warning',
    category: 'System',
    title: 'Server node utilization exceeded 92%',
    description: 'Primary deployment node AWS-USEAST-1 exceeded high load threshold limits.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 22), // 22 hours ago
    isRead: false,
    actionRoute: 'overview',
    initials: 'SW',
    actorName: 'System Warning',
    actionText: 'alerted on node',
    targetName: 'AWS-USEAST-1',
    dateText: 'Yesterday',
    subtext: 'High Load'
  },
  {
    id: '6',
    type: 'info',
    category: 'Team Activity',
    title: 'B Anand updated the theme to Graphite Charcoal',
    description: 'Design preferences updated to use dark grey background scales and graphite colors.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26), // 1.1 days ago
    isRead: true,
    actionRoute: 'overview',
    initials: 'BA',
    actorName: 'B Anand',
    actionText: 'updated the theme to',
    targetName: 'Graphite Charcoal',
    dateText: 'Yesterday'
  },
  {
    id: '7',
    type: 'success',
    category: 'System',
    title: 'Edwin Antony completed deployment to Staging',
    description: 'Vite build compilation completed successfully. Node updated to build version v1.2.45.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    isRead: true,
    actionRoute: 'overview',
    initials: 'EA',
    actorName: 'Edwin Antony',
    actionText: 'completed deployment to',
    targetName: 'Staging environment',
    dateText: '2 days ago',
    subtext: 'Build v1.2.45'
  },
  {
    id: '8',
    type: 'info',
    category: 'Team Activity',
    title: 'Justin Keith added new project Signature Spark',
    description: 'Justin Keith created the Signature Spark workspace files and added initial blueprints.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4), // 4 days ago
    isRead: true,
    actionRoute: 'overview',
    initials: 'JK',
    actorName: 'Justin Keith',
    actionText: 'added new project',
    targetName: 'Signature Spark',
    dateText: 'Apr 10',
    subtext: 'Testing'
  },
  {
    id: '9',
    type: 'info',
    category: 'Team Activity',
    title: 'Maria Joyce mentioned you in Pixel Pulse',
    description: 'Maria Joyce tagged your user profile in a project design discussion on Pixel Pulse layout.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12), // 12 days ago
    isRead: true,
    actionRoute: 'overview',
    initials: 'MJ',
    actorName: 'Maria Joyce',
    actionText: 'mentioned you in',
    targetName: 'Pixel Pulse',
    dateText: 'Apr 02',
    subtext: '3 comments',
    isMention: true
  },
  {
    id: '10',
    type: 'info',
    category: 'Team Activity',
    title: 'Adam Maccall shared a file Design Requirements',
    description: 'Adam Maccall shared the layout checklist file for review before building mock templates.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14), // 14 days ago
    isRead: true,
    actionRoute: 'overview',
    initials: 'AM',
    actorName: 'Adam Maccall',
    actionText: 'shared a file',
    targetName: 'Design Requirements',
    dateText: 'Mar 31',
    subtext: 'Design',
    attachment: {
      name: 'Design_requirements_D2361.pdf',
      size: '4.2MB',
      type: 'pdf'
    }
  }
];
