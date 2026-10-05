/**
 * Serverless SORA Benchmark Endpoint
 * Route: GET /api/sora
 * Pulls MAS data using official MAS APIMG gateway:
 * https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily
 * Header: KeyId: <MAS_KEY_ID>
 */

export const MAS_DOMESTIC_RATES_ENDPOINT =
  'https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily';

// In-memory cache for serverless container reuse (15 minutes)
let cacheState: {
  data: any;
  timestamp: number;
} | null = null;

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 mins

export default async function handler(req: any, res?: any) {
  const isWebRequest = typeof Request !== 'undefined' && req instanceof Request;

  // Retrieve incoming headers and query parameters safely
  let clientHeaders: Record<string, string> = {};
  let queryParamsString = '';

  if (isWebRequest) {
    req.headers.forEach((val: string, key: string) => {
      clientHeaders[key.toLowerCase()] = val;
    });
    const url = new URL(req.url);
    queryParamsString = url.search;
  } else if (req) {
    clientHeaders = req.headers || {};
    if (req.query && Object.keys(req.query).length > 0) {
      const q = new URLSearchParams(req.query as Record<string, string>);
      queryParamsString = `?${q.toString()}`;
    }
  }

  // Read MAS API Key from environment or request header (do not hardcode)
  const masKeyId =
    process.env.MAS_KEY_ID ||
    process.env.VITE_MAS_KEY_ID ||
    clientHeaders['keyid'] ||
    clientHeaders['x-mas-key-id'];

  if (!masKeyId) {
    const errorPayload = {
      success: false,
      error: 'Missing MAS KeyId',
      message:
        'Please set the MAS_KEY_ID environment variable in your serverless configuration or provide a KeyId header.',
      help: 'Register for a KeyId at the MAS Developer Portal (https://eservices.mas.gov.sg/apimg-gw/) and add MAS_KEY_ID="your_key_here" to your environment.',
    };

    if (isWebRequest) {
      return new Response(JSON.stringify(errorPayload, null, 2), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (res && typeof res.status === 'function') {
      return res.status(401).json(errorPayload);
    }

    return errorPayload;
  }

  // Check in-memory cache if no fresh query params requested
  const now = Date.now();
  if (
    cacheState &&
    !queryParamsString &&
    now - cacheState.timestamp < CACHE_TTL_MS
  ) {
    const cachedResponse = {
      ...cacheState.data,
      cached: true,
      cacheAgeSeconds: Math.floor((now - cacheState.timestamp) / 1000),
    };

    if (isWebRequest) {
      return new Response(JSON.stringify(cachedResponse), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
        },
      });
    }

    if (res && typeof res.status === 'function') {
      res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=1800');
      return res.status(200).json(cachedResponse);
    }

    return cachedResponse;
  }

  try {
    const targetUrl = `${MAS_DOMESTIC_RATES_ENDPOINT}${queryParamsString}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000); // 9-second timeout

    const masResponse = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        KeyId: masKeyId,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!masResponse.ok) {
      const errText = await masResponse.text().catch(() => '');
      throw new Error(
        `MAS API upstream returned HTTP ${masResponse.status}: ${masResponse.statusText}. ${errText}`
      );
    }

    const rawJson = await masResponse.json();

    // Standardize record shapes across MAS endpoints
    let rawRecords: any[] = [];
    if (rawJson && rawJson.result && Array.isArray(rawJson.result.records)) {
      rawRecords = rawJson.result.records;
    } else if (rawJson && Array.isArray(rawJson.data)) {
      rawRecords = rawJson.data;
    } else if (rawJson && rawJson.data && Array.isArray(rawJson.data.records)) {
      rawRecords = rawJson.data.records;
    } else if (Array.isArray(rawJson)) {
      rawRecords = rawJson;
    } else if (rawJson && typeof rawJson === 'object') {
      // In case MAS returns direct rows under another key
      const firstArrayProp = Object.values(rawJson).find((val) => Array.isArray(val));
      if (Array.isArray(firstArrayProp)) {
        rawRecords = firstArrayProp;
      }
    }

    const standardizedRecords = rawRecords.map((r: any) => {
      // Map potential variations in MAS field naming
      const dateVal = r.end_of_day || r.date || r.Date || r.end_date || '';
      const soraVal = parseFloat(r.sora || r.SORA || r.overnight_sora || '0');
      const comp1m = r.sora_compound_1m || r.sora_1m || r.compound_1m || r.sora_compound_1M;
      const comp3m = r.sora_compound_3m || r.sora_3m || r.compound_3m || r.sora_compound_3M;
      const comp6m = r.sora_compound_6m || r.sora_6m || r.compound_6m || r.sora_compound_6M;
      const soraIdx = r.sora_index || r.index || r.SORA_index;
      const vol = r.aggregate_volume || r.volume || r.aggr_vol;

      return {
        end_of_day: String(dateVal),
        sora: isNaN(soraVal) ? 0 : soraVal,
        sora_compound_1m: comp1m ? parseFloat(String(comp1m)) : undefined,
        sora_compound_3m: comp3m ? parseFloat(String(comp3m)) : undefined,
        sora_compound_6m: comp6m ? parseFloat(String(comp6m)) : undefined,
        sora_index: soraIdx ? parseFloat(String(soraIdx)) : undefined,
        aggregate_volume: vol ? parseFloat(String(vol)) : undefined,
        calculation_method: r.calculation_method || 'standard',
      };
    });

    const successPayload = {
      success: true,
      source: 'MAS Gateway (domestic_interest_rates_daily)',
      timestamp: new Date().toISOString(),
      count: standardizedRecords.length,
      data: standardizedRecords,
      rawSummary: {
        keysFound: rawRecords.length > 0 ? Object.keys(rawRecords[0]) : [],
      },
    };

    // Store in cache
    if (!queryParamsString && standardizedRecords.length > 0) {
      cacheState = {
        data: successPayload,
        timestamp: now,
      };
    }

    if (isWebRequest) {
      return new Response(JSON.stringify(successPayload), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
        },
      });
    }

    if (res && typeof res.status === 'function') {
      res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=1800');
      return res.status(200).json(successPayload);
    }

    return successPayload;
  } catch (error: any) {
    const errorPayload = {
      success: false,
      error: 'MAS API Fetch Failed',
      message: error?.message || 'Unknown network error',
      endpoint: MAS_DOMESTIC_RATES_ENDPOINT,
    };

    if (isWebRequest) {
      return new Response(JSON.stringify(errorPayload, null, 2), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (res && typeof res.status === 'function') {
      return res.status(502).json(errorPayload);
    }

    return errorPayload;
  }
}

export async function GET(req: Request) {
  return handler(req);
}
