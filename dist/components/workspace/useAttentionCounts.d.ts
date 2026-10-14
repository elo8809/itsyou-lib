export type AttentionKey = 'notifications' | 'chat' | 'applications' | 'contact' | 'clientAccess' | 'offers' | 'bookings';
export type AttentionCounts = Partial<Record<AttentionKey, number>>;
export type WorkspaceAttention = {
    apiBaseUrl: string;
    /** Include the account and role so switching accounts clears old counts. */
    identity: string;
    /** Refresh after workspace mutations settle. */
    refreshKey?: number;
};
export default function useAttentionCounts(attention: WorkspaceAttention | undefined, navigationKey: string): Partial<Record<AttentionKey, number>>;
