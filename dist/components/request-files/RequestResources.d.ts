export type RequestResource = {
    id: string;
    label: string;
    description: string;
    fileName: string;
    contentType: string;
    size: number;
    createdAt: string;
};
export default function RequestResources({ apiBaseUrl, clientRequestId, canManage, active, }: {
    apiBaseUrl: string;
    clientRequestId: string;
    canManage?: boolean;
    active?: boolean;
}): import("react/jsx-runtime").JSX.Element;
