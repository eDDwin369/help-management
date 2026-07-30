export type Role = "customer" | "sub_admin" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  tenantId: string;
  avatarColor: string;
}

export type HelpContentType = "video" | "image" | "pdf" | "text";
export type HelpStatus = "approved" | "unapproved";

export interface HelpItem {
  id: string;
  tenantId: string;
  componentKey: string; // related button/component
  componentLabel: string;
  title: string;
  description: string;
  contentType: HelpContentType;
  url?: string;
  thumbnail?: string;
  body?: string; // for text guides
  tags: string[];
  status: HelpStatus;
  archived: boolean;
  addedBy: string;
  createdAt: string;
  updatedAt: string;
  sectionType: "screen" | "component" | "button";
  durationSec?: number;
  sizeKb?: number;
}

export type TicketStatus = "open" | "in_progress" | "waiting" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";

export interface Ticket {
  id: string;
  tenantId: string;
  userId: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  attachments: { name: string; size: number }[];
  componentKey?: string;
}

export interface MissingHelpArea {
  id: string;
  screen: string;
  componentKey: string;
  componentLabel: string;
  reason: string;
  suggestedAction: string;
  route: string;
}
