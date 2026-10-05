import React, { useState } from 'react';
import {
  X,
  Server,
  Code2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  Play,
  Layers,
} from 'lucide-react';
import { ApiConfiguration } from '../types/sora';
import { MAS_OFFICIAL_DATASTORE_URL, MasApiService } from '../services/masApiService';

interface ApiIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ApiConfiguration;
  onSaveConfig: (updated: ApiConfiguration) => void;
  onTestConnection: () => Promise<{ success: boolean; message: string; count: number }>;
}

export const ApiIntegrationModal: React.FC<ApiIntegrationModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onTestConnection,
}) => {
  const [localConfig, setLocalConfig] = useState<ApiConfiguration>({ ...config });
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'testing' | 'success' | 'error';
    message?: string;
    count?: number;
  }>({ status: 'idle' });
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTestResult({ status: 'testing' });
    try {
      const res = await onTestConnection();
      if (res.success) {
        setTestResult({
          status: 'success',
          message: res.message,
          count: res.count,
        });
      } else {
        setTestResult({
          status: 'error',
          message: res.message,
        });
      }
    } catch (err: unknown) {
      setTestResult({
        status: 'error',
        message: err instanceof Error ? err.message : 'Connection test failed',
      });
    }
  };

  const handleSave = () => {
    onSaveConfig(localConfig);
    onClose();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const expressSnippet = `// Node.js + Express / Serverless proxy for MAS SORA API
// Route: /api/sora
import express from 'express';
const router = express.Router();

const MAS_API_URL = 'https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily';

// In-memory cache for 15 minutes to respect MAS rate limits
let cachedData = null;
let lastFetchTime = 0;

router.get('/api/sora', async (req, res) => {
  try {
    const keyId = process.env.MAS_KEY_ID || req.headers['keyid'];
    if (!keyId) {
      return res.status(401).json({ error: 'MAS_KEY_ID environment variable not set' });
    }

    const now = Date.now();
    if (cachedData && now - lastFetchTime < 15 * 60 * 1000) {
      return res.json({ source: 'cache', data: cachedData });
    }

    const response = await fetch(MAS_API_URL, {
      headers: {
        'Accept': 'application/json',
        'KeyId': keyId
      }
    });
    
    if (!response.ok) throw new Error(\`MAS API error: \${response.status}\`);
    const json = await response.json();

    cachedData = json.data || json.result?.records || json;
    lastFetchTime = now;

    res.json({ source: 'mas_official', data: cachedData });
  } catch (error) {
    res.status(502).json({ error: 'Failed to fetch MAS SORA data', details: error.message });
  }
});

export default router;`;

  const pythonSnippet = `# Python (FastAPI / Serverless) MAS SORA Backend Proxy
import os
import httpx
from fastapi import FastAPI, HTTPException, Header

app = FastAPI()
MAS_URL = "https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily"

@app.get("/api/sora")
async def get_sora_rates(keyid: str = Header(default=None)):
    mas_key = os.getenv("MAS_KEY_ID") or keyid
    if not mas_key:
        raise HTTPException(status_code=401, detail="MAS_KEY_ID not configured")

    headers = {"KeyId": mas_key, "Accept": "application/json"}
    async with httpx.AsyncClient() as client:
        resp = await client.get(MAS_URL, headers=headers, timeout=10.0)
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail="MAS API returned error")
        data = resp.json()
        return {"data": data.get("data") or data.get("result", {}).get("records", [])}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Server className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-base font-semibold text-white">
                Backend Integration & MAS API Setup
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Seamlessly connect this calculator to your future custom backend or the official MAS public datastore.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Data Source Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-200 block mb-2">
              Select Data Pipeline Source
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Direct MAS API */}
              <button
                type="button"
                onClick={() => setLocalConfig({ ...localConfig, mode: 'direct_mas' })}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  localConfig.mode === 'direct_mas'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-xs text-slate-200">MAS Public API (Direct)</div>
                <div className="text-[11px] text-slate-400 mt-1 leading-normal">
                  Queries MAS eServices datastore directly from browser with automatic fallback.
                </div>
              </button>

              {/* Option 2: Custom Backend */}
              <button
                type="button"
                onClick={() => setLocalConfig({ ...localConfig, mode: 'custom_backend' })}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  localConfig.mode === 'custom_backend'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-xs text-slate-200">Custom Backend URL</div>
                <div className="text-[11px] text-slate-400 mt-1 leading-normal">
                  Point to your own microservice, Express, FastAPI, or Go proxy server.
                </div>
              </button>

              {/* Option 3: Preloaded Offline Snapshot */}
              <button
                type="button"
                onClick={() => setLocalConfig({ ...localConfig, mode: 'preloaded' })}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  localConfig.mode === 'preloaded'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-xs text-slate-200">Verified MAS Snapshot</div>
                <div className="text-[11px] text-slate-400 mt-1 leading-normal">
                  Preloaded authentic MAS daily records. 100% offline & zero network dependency.
                </div>
              </button>
            </div>
          </div>

          {/* Custom Backend Endpoint Input */}
          {localConfig.mode === 'custom_backend' && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 space-y-3">
              <label className="text-xs font-semibold text-slate-200 block">
                Custom Backend Endpoint URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://your-api-domain.com/api/sora or http://localhost:8080/api/sora"
                  value={localConfig.customBackendUrl}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, customBackendUrl: e.target.value })
                  }
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={testResult.status === 'testing' || !localConfig.customBackendUrl}
                  className="px-3 py-2 text-xs font-medium text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 font-semibold disabled:opacity-50"
                >
                  <Play className="w-3 h-3" />
                  <span>Test Connection</span>
                </button>
              </div>

              {testResult.status !== 'idle' && (
                <div
                  className={`p-3 rounded text-xs flex items-start gap-2 ${
                    testResult.status === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                      : testResult.status === 'error'
                      ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                      : 'bg-slate-850 text-slate-300'
                  }`}
                >
                  {testResult.status === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : testResult.status === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  ) : (
                    <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin shrink-0" />
                  )}
                  <div>
                    {testResult.status === 'testing' && 'Testing connection to endpoint...'}
                    {testResult.status === 'success' && (
                      <div>
                        Connection successful! Retrieved {testResult.count} valid SORA records from backend.
                      </div>
                    )}
                    {testResult.status === 'error' && (
                      <div>
                        Connection failed: {testResult.message}. Verify CORS headers and network connectivity.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MAS Official Resource Information */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 space-y-2 text-xs text-slate-400">
            <div className="text-slate-200 font-semibold flex items-center justify-between">
              <span>Official MAS Datastore Resource Details</span>
              <a
                href="https://eservices.mas.gov.sg/statistics/interest-rates/sora.aspx"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[11px]"
              >
                <span>MAS SORA Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="font-mono text-[11px] bg-slate-900 p-2 rounded border border-slate-850 break-all text-slate-300">
              https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily
            </div>
            <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800 flex items-center justify-between font-mono text-[11px]">
              <span className="text-slate-400">Required Header:</span>
              <span className="text-emerald-400 font-semibold">KeyId: &lt;MAS_KEY_ID&gt;</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Serverless routes configured in <code className="text-slate-300">/api/sora.ts</code> and <code className="text-slate-300">/api/health.ts</code> automatically read <code className="text-slate-300">process.env.MAS_KEY_ID</code>.
            </p>
          </div>

          {/* Ready-to-use Backend Integration Code Snippets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-emerald-400" />
                Backend Proxy Implementation Recipes
              </span>
              <span className="text-[11px] text-slate-400">Use when deploying your backend</span>
            </div>

            {/* Express Snippet */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
              <div className="bg-slate-900/80 px-3 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Node.js + Express Proxy Route</span>
                <button
                  onClick={() => copyToClipboard(expressSnippet, 'express')}
                  className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                >
                  {copiedSnippet === 'express' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48">
                {expressSnippet}
              </pre>
            </div>

            {/* Python Snippet */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
              <div className="bg-slate-900/80 px-3 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Python (FastAPI) Proxy Route</span>
                <button
                  onClick={() => copyToClipboard(pythonSnippet, 'python')}
                  className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                >
                  {copiedSnippet === 'python' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-40">
                {pythonSnippet}
              </pre>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-3 text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors"
          >
            Apply Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
