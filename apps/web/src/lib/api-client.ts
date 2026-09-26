import { APP_CONFIG, resolveApiUrl } from './config';

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

    const url = resolveApiUrl(endpoint);

    // Development & debugging logger
    console.log(`[ApiClient] Request -> ${options.method || 'GET'} ${url}`, {
      headers,
      body: options.body,
    });

    let res: Response;
    try {
      res = await fetch(url, {
        ...options,
        headers,
      });
    } catch (networkError: any) {
      console.error(`[ApiClient] Network Connection Error on ${url}:`, networkError);
      throw {
        code: 'NETWORK_ERROR',
        message: 'عدم امکان اتصال به سرور. لطفاً ارتباط اینترنت یا تنظیمات Nginx سرور را بررسی فرمایید.',
        details: { originalError: networkError.message },
      };
    }

    const contentType = res.headers.get('content-type') || '';
    let data: any = {};
    let rawText = '';

    if (contentType.includes('application/json')) {
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.warn(`[ApiClient] Failed to parse JSON response:`, jsonErr);
        data = {};
      }
    } else {
      try {
        rawText = await res.text();
      } catch {
        rawText = '';
      }
    }

    if (!res.ok) {
      console.error(`[ApiClient] HTTP Error ${res.status} [${res.statusText}] from ${url}:`, {
        status: res.status,
        statusText: res.statusText,
        contentType,
        data,
        rawText: rawText.slice(0, 500),
      });

      const isHtmlResponse = rawText.includes('<html') || contentType.includes('text/html');
      const errorMessage =
        data.error?.message ||
        data.message ||
        (isHtmlResponse
          ? `پاسخ نامعتبر از سرور یا Nginx (کد وضعیت ${res.status} ${res.statusText}). درخواست به بک‌اند نرسیده است.`
          : `خطای سرور (${res.status}): ${res.statusText}`);

      const error: ApiError = data.error || {
        code: `HTTP_${res.status}`,
        message: errorMessage,
        details: {
          status: res.status,
          statusText: res.statusText,
          rawResponse: rawText.slice(0, 300),
        },
      };
      throw error;
    }

    console.log(`[ApiClient] Response ${res.status} <- ${url}`, data);
    return data.data !== undefined ? data.data : data;
  }

  public static async uploadFile(file: File): Promise<{ fileUrl: string; mimeType: string; size: number }> {
    const formData = new FormData();
    formData.append('receipt', file);

    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(resolveApiUrl('/payments/upload'), {
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
