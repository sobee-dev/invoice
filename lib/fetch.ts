const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function apiFetch(endpoint: string, options: RequestInit = {}
) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      
      ...(options.headers || {}),
    },
    
    ...options,
  });

   if (!res.ok) {
    let message = "Request failed";
    try {
      const data = await res.json();
      message = data.message || data.detail || message;
    } catch {}
    throw new Error(message);
  }

  return res.json();
}
