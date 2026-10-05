/**
 * Serverless Health Check Endpoint
 * Route: GET /api/health
 */

export interface HealthResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptimeSeconds: number;
  environment: {
    masKeyConfigured: boolean;
    nodeEnv: string;
  };
  endpoints: {
    sora: string;
    health: string;
  };
}

export default async function handler(req: any, res?: any) {
  // Support Web Standard Request (Edge / Next.js app router)
  const isWebRequest = typeof Request !== 'undefined' && req instanceof Request;

  const masKeyConfigured = Boolean(
    process.env.MAS_KEY_ID || process.env.VITE_MAS_KEY_ID
  );

  const payload: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: typeof process.uptime === 'function' ? Math.floor(process.uptime()) : 0,
    environment: {
      masKeyConfigured,
      nodeEnv: process.env.NODE_ENV || 'production',
    },
    endpoints: {
      sora: '/api/sora',
      health: '/api/health',
    },
  };

  if (isWebRequest) {
    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }

  // Node.js serverless / Express handler (req, res)
  if (res && typeof res.status === 'function') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(200).json(payload);
  }

  return payload;
}

export async function GET(req: Request) {
  return handler(req);
}
