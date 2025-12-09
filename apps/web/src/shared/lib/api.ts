const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/auth";

class Api {
  private BASE_URL = DEFAULT_BASE_URL;

  async get(path: string) {
    const res = await fetch(`${this.BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    if (!res.ok) throw new Error("API error");
    return await res.json();
  }

  async post(path: string, data: any) {
    const res = await fetch(`${this.BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });

    if (!res.ok) throw new Error("API error");
    return await res.json();
  }
}

const apiClient = new Api();

export const apiGet = (path: string) => apiClient.get(path);
export const apiPost = (path: string, data: any) => apiClient.post(path, data);

export default apiClient;
