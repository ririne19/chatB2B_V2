export interface Organization {
  id: string;
  name: string;
  slug: string;
  isAdminCompany?: boolean;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organization: Organization;
}

export interface MessageSender {
  id?: string;
  firstName: string;
  lastName: string;
}

export interface Message {
  id: string;
  content: string;
  conversationId: string;
  senderId: string;
  createdAt: string;
  updatedAt: string;
  sender: MessageSender;
}

export interface Conversation {
  id: string;
  title: string | null;
  organizationId: string;
  partnerOrganizationId?: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
  /** Organisation initiatrice de la conversation */
  organization?: { id: string; name: string; slug: string } | null;
  /** Organisation partenaire (l'autre côté) */
  partnerOrganization?: { id: string; name: string; slug: string } | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
