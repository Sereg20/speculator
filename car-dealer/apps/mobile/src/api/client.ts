import { getToken } from "@/auth/tokenStorage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("EXPO_PUBLIC_API_URL is not defined");
}

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  // const token = await getToken();
  const token = process.env.EXPO_PUBLIC_API_TOKEN;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,

    headers: {
      "Content-Type": "application/json",

      ...(token
        ? {
          Authorization: `Bearer ${token}`,
        }
        : {}),

      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(
      `API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}