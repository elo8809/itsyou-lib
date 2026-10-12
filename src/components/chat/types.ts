export type ChatRole =
  | 'ADMIN'
  | 'MEMBER'
  | 'CLIENT'
  | 'USER'
  | 'REMOVED';
export type ChatPerson = {
  id: string;
  name: string;
  role: ChatRole;
  email?: string;
  client?: { name: string } | null;
};
export type ChatViewer = ChatPerson & {
  canManage: boolean;
};
export type ChatSummary = {
  request?: ChatRequest | null;
  id: string;
  title: string;
  description: string;
  revision: number;
  participantCount: number;
  unreadCount: number;
  lastReadSequence: number;
  messageSequence: number;
  lastMessage: {
    senderName: string;
    body: string;
    createdAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};
export type ChatDetail = ChatSummary & {
  participants: ChatPerson[];
};
export type ChatMessage = {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderRole: ChatRole;
  body: string;
  sequence: number;
  clientMessageId: string;
  createdAt: string;
};
export type ChatDraft = {
  clientRequestId?: string | null;
  title: string;
  description: string;
  participantIds: string[];
};
export type ChatLocale = 'en' | 'de';

export type ChatRequest = {
  id: string;
  project: string;
  client: { id: string; name: string };
};
export type ChatGrouping = 'client' | 'none';

export type ChatGroupDefaults = {
  title: string;
  description: string;
  request: ChatRequest | null;
  participants: ChatPerson[];
};
export type ChatRequestDraft = {
  viewer: ChatViewer;
  draft: ChatGroupDefaults;
  missingModelAccounts: number;
  missingClientAccount: boolean;
};
