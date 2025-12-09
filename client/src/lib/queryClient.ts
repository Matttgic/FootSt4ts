import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const [basePath, ...params] = queryKey as string[];
    
    let url = basePath;
    
    if (params.length > 0) {
      if (basePath.includes('/form/')) {
        const queryParams = new URLSearchParams();
        if (params[0]) queryParams.set('period', String(params[0]));
        if (params[1]) queryParams.set('season', String(params[1]));
        const qs = queryParams.toString();
        if (qs) url += `?${qs}`;
      } else if (basePath.includes('/stats/') && basePath.includes('/players/')) {
        const queryParams = new URLSearchParams();
        if (params[0]) queryParams.set('league', String(params[0]));
        if (params[1]) queryParams.set('season', String(params[1]));
        const qs = queryParams.toString();
        if (qs) url += `?${qs}`;
      } else if (basePath === '/api/football/stats/merged') {
        const queryParams = new URLSearchParams();
        if (params[0]) queryParams.set('league', String(params[0]));
        if (params[1]) queryParams.set('season', String(params[1]));
        url = `${basePath}?${queryParams.toString()}`;
      } else if (basePath === '/api/football/players/search') {
        const queryParams = new URLSearchParams();
        if (params[0]) queryParams.set('league', String(params[0]));
        if (params[1]) queryParams.set('season', String(params[1]));
        if (params[2]) queryParams.set('search', String(params[2]));
        url = `${basePath}?${queryParams.toString()}`;
      } else if (basePath === '/api/football/fixtures/date') {
        const queryParams = new URLSearchParams();
        if (params[0]) queryParams.set('date', String(params[0]));
        if (params[1]) queryParams.set('league', String(params[1]));
        if (params[2]) queryParams.set('season', String(params[2]));
        url = `${basePath}?${queryParams.toString()}`;
      } else if (basePath === '/api/football/leagues') {
        const queryParams = new URLSearchParams();
        if (params[0]) queryParams.set('id', String(params[0]));
        url = `${basePath}?${queryParams.toString()}`;
      }
    }
    
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});
