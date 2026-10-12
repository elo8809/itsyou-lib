export type RequestClientContract = {
    id: string;
    orderId: string;
    project: string;
    createdAt: string;
    status: string;
    signed: boolean;
    canUpload: boolean;
};
export default function RequestContracts({ apiBaseUrl, clientRequestId, active, }: {
    apiBaseUrl: string;
    clientRequestId: string;
    active?: boolean;
}): import("react/jsx-runtime").JSX.Element;
