export interface CentralDBConfig {
  baseUrl: string;
  apiKey?: string;
  accessToken?: string;
}

export interface PublicRecord {
  hashId: string;
  publicDataId: string;
  userId: string;
  applicationId: string;
  application: string;
  dataType: string;
  sharing: string;
  content: string;
  blockchain: string;
  verification: string;
  status: string;
  timestamp: string;
  txRef: string;
  blockHeight: number | null;
  dataId: string;
  modelId?: string;
}

export interface VerifyResult {
  verified: boolean;
  status: string;
  record?: PublicRecord;
  principle?: string;
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export class CentralDB {
  constructor(private config: CentralDBConfig) {}

  private headers(): HeadersInit {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (this.config.accessToken) h.Authorization = `Bearer ${this.config.accessToken}`;
    else if (this.config.apiKey) h["X-API-Key"] = this.config.apiKey;
    return h;
  }

  private async req<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.config.baseUrl}${path}`, {
      ...init,
      headers: { ...this.headers(), ...(init?.headers ?? {}) },
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? res.statusText);
    return body as T;
  }

  async createHash(input: {
    content: string;
    dataType: string;
    userId?: string;
    modelId?: string;
    sharing?: string;
  }): Promise<{ record: PublicRecord; commitment: string }> {
    const contentHash = await sha256Hex(input.content);
    return this.req("/api/v1/hash/create", {
      method: "POST",
      body: JSON.stringify({
        contentHash,
        dataType: input.dataType,
        userId: input.userId,
        modelId: input.modelId,
        sharing: input.sharing ?? "PUBLIC_METADATA",
      }),
    });
  }

  async verify(hashId: string): Promise<VerifyResult> {
    return this.req("/api/v1/verify", {
      method: "POST",
      body: JSON.stringify({ hashId }),
    });
  }

  async getMetadata(dataId: string): Promise<{ metadata: PublicRecord }> {
    return this.req(`/api/v1/data/${encodeURIComponent(dataId)}/metadata`);
  }

  async registerApp(input: {
    name: string;
    slug: string;
    developer: string;
    redirectUrls: string[];
    scopes: string[];
    description?: string;
  }) {
    return this.req("/api/v1/apps/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async authorize(clientId: string, redirectUri: string, scopes: string[]) {
    const q = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes.join(" "),
    });
    return this.req(`/api/v1/auth/authorize?${q}`);
  }

  async exchangeCode(code: string) {
    return this.req("/api/v1/auth/token", {
      method: "POST",
      body: JSON.stringify({ grant_type: "authorization_code", code }),
    });
  }

  async search(query: string) {
    return this.req(`/api/v1/explorer/search?q=${encodeURIComponent(query)}`);
  }

  async dashboard() {
    return this.req("/api/v1/dashboard");
  }
}
