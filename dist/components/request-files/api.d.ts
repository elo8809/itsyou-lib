export declare const requestFileUrl: (apiBaseUrl: string, path: string) => string;
export declare function fileRequest<T>(url: string, body?: FormData | Record<string, unknown>, signal?: AbortSignal): Promise<T>;
export declare function useRequestFiles<T>(url: string, active: boolean): {
    data: T[];
    error: string;
    refresh: () => void;
};
export declare function fileSize(size: number): string;
