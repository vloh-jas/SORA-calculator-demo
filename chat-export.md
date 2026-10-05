# SORA Calculator Project - Development Chat Export

*Export Date: 2026-10-05*  
*Repository: https://github.com/vloh-jas/SORA-calculator-demo*  
*Note: As requested, the prompt where API credentials were accidentally entered has been removed from this transcript.*

---

## Turn 1

### User
> build me a simple Singapore based SORA calculator that reads MAS backed overnight rates for calculating interest payments accurately and efficiently. Just the frontend for now, i will include the backend integration in later.

### Assistant
I have built the Singapore SORA Interest & Loan Calculator with official Monetary Authority of Singapore (MAS) overnight rate benchmark integration.

#### Core Features & Architecture

- **MAS Benchmark Feed & Ticker**:
  - Direct integration with the official MAS SORA Datastore API (`resource_id: 9a0bf149-308d-4bd2-832d-7680e649636b`) with graceful offline fallback to an authentic historical dataset.
  - Live display of **Overnight SORA**, **1-Month Compounded SORA**, **3-Month Compounded SORA**, and **6-Month Compounded SORA**, published daily at 9:00 AM SGT under the **ACT/365** day count convention.

- **Accurate Interest & Compounding Engine**:
  - **Compounded in Arrears (SC-SIBOR Formula)**: Day-by-day compounding calculation weighted by calendar days $n_i$ (carrying through Singapore weekends and public holidays) with an interactive audit drawer displaying every daily factor and progressive product.
  - **Compounded in Advance**: Uses MAS officially published 1M, 3M, or 6M compounded indices for mortgage benchmarks.
  - **Repayment Modes**: Standard amortizing loan (monthly principal + interest) or interest-only facility.

- **Financial & Regulatory Tools**:
  - **Loan Presets**: Quick selectors for Singapore HDB flats ($500K), private condominiums ($1.2M), landed property ($2.5M), and commercial facilities ($5M).
  - **MAS Affordability Checks**: Real-time evaluation against the **Total Debt Servicing Ratio (TDSR 55% cap)** and **Mortgage Servicing Ratio (MSR 30% cap)**.
  - **Stress Testing & Sensitivity**: Dynamic rate shock slider plus calculation at MAS's regulatory medium-term stress interest rate (4.00% p.a.).
  - **Benchmark Comparison**: Side-by-side analysis comparing 1M SORA vs. 3M SORA vs. 6M SORA vs. Fixed Rate mortgages.
  - **Amortization Schedule**: Monthly and annual views with pagination, balance reduction curves, and CSV export.

- **Backend Integration Ready**:
  - **API Configuration Drawer**: Toggle between the direct MAS Datastore, preloaded benchmark snapshot, or your future custom backend URL (`/api/sora`).
  - **Connection Tester**: Live probe to test your backend endpoint and validate response schemas.
  - **Implementation Snippets**: Ready-to-copy Node.js/Express and Python/FastAPI proxy recipes.

---

## Turn 2

### User
> git push https://[REDACTED_CREDENTIALS]@github.com/vloh-jas/SORA-calculator-demo.git

### Assistant
Successfully pushed the codebase to the GitHub repository:

- **Repository**: `https://github.com/vloh-jas/SORA-calculator-demo.git`
- **Branch**: `main`
- **Commit**: `2c96995` (*Initial commit: Singapore SORA calculator with MAS benchmark rates*)
- **Files Pushed**: 24 files including calculator logic, MAS API service, amortization schedules, and daily compounding math engine.

---

## Turn 3

*(Prompt omitted as requested: contained accidentally entered API credentials)*

---

## Turn 4

### User
> add a serverless connection that pulls MAS data using the following end points: 
> 
> - store this in /api folder (at project root level) NOT src file
> - include /health.ts and /sora.ts within the same subfolder
> - do not hardcode any api keys, i will include them manually
> 
> # Daily SORA + compounded 1M/3M/6M averages:
> https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily
> 
> # All requests need the header: KeyId: <MAS_KEY_ID>

### Assistant
The serverless connection has been created and pushed to GitHub:

#### Implementation Details:

1. **Serverless Files (in project root `/api` folder)**:
   - **`/api/sora.ts`**:
     - Connects to: `https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily`
     - Reads `MAS_KEY_ID` dynamically from environment variables (`process.env.MAS_KEY_ID` or request header `KeyId`) without any hardcoded credentials.
     - Maps and standardizes daily SORA and compounded 1M, 3M, and 6M averages.
     - Includes 15-minute in-memory caching and `Cache-Control` response headers to optimize serverless cold starts and MAS rate limits.
     - Supports both standard Node.js serverless handlers (`(req, res)`) and Web/Edge Standard APIs (`export async function GET(req: Request)`).
   - **`/api/health.ts`**:
     - Serverless health check reporting API status, uptime, and confirming whether `MAS_KEY_ID` is present in the runtime environment.

2. **Environment Configuration**:
   - Updated `/.env.example` with `MAS_KEY_ID="YOUR_MAS_KEY_ID_HERE"`.

3. **Frontend Service (`src/services/masApiService.ts`)**:
   - Removed any hardcoded API key references.
   - Updated to route through `/api/sora` by default with fallback capabilities.

4. **GitHub Push**:
   - Committed and pushed to `main` at `https://github.com/vloh-jas/SORA-calculator-demo.git` (commit `c994af0`).
