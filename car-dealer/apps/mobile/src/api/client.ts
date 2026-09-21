import { getToken } from "@/auth/tokenStorage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("EXPO_PUBLIC_API_URL is not defined");
}

type ApiErrorBody = {
  data: unknown;
  error: string | null;
  meta: unknown;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: ApiErrorBody
  ) {
    super(body.error ?? `API error: ${status}`);
    this.name = "ApiError";
  }
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
    let data: ApiErrorBody;

    try {
      data = await response.json();
    } catch {
      data = {
        data: null,
        error: response.statusText,
        meta: null,
      };
    }

    throw new ApiError(
      response.status,
      data
    );
  }

  return response.json();
}