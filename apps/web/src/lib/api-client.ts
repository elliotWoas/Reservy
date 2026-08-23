const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export class ApiClient {
  private static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('reservy_token');
  }

  public static setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('reservy_token', token);
    }
  }

  public static removeToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('reservy_token');
      localStorage.removeItem('reservy_active_org');
    }
  }

  public static getActiveOrgId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('reservy_active_org');
  }

  public static setActiveOrgId(orgId: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('reservy_active_org', orgId);
    }
  }

  public static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const activeOrgId = this.getActiveOrgId();

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (activeOrgId) {
      headers['X-Organization-Id'] = activeOrgId;
    }

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

    const res = await fetch(url, {
      ...options,
      headers,
    });

    let data: any = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (!res.ok) {
      const error: ApiError = data.error || {
        code: 'UNKNOWN_ERROR',
        message: 'خطایی در برقراری ارتباط با سرور رخ داد',
      };
      throw error;
    }

    return data.data !== undefined ? data.data : data;
  }

  public static async uploadFile(file: File): Promise<{ fileUrl: string; mimeType: string; size: number }> {
    const formData = new FormData();
    formData.append('receipt', file);

    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/payments/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const json = await res.json();
    if (!res.ok) {
      throw json.error || { code: 'UPLOAD_FAILED', message: 'خطا در بارگذاری فایل' };
    }

    return json.data;
  }
}
