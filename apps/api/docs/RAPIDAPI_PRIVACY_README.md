# Data Privacy, PII Redactor & LLM Guardrail API

[![Stateless](https://img.shields.io/badge/Architecture-100%25%20Stateless-brightgreen)](#)
[![Zero Data Retention](https://img.shields.io/badge/Compliance-GDPR%20%7C%20CCPA%20%7C%20HIPAA-blue)](#)
[![Latency](https://img.shields.io/badge/Latency-%3C15ms-orange)](#)

A high-performance, stateless privacy firewall and data sanitization engine. Automatically detects and redacts Personally Identifiable Information (PII), validates payment card numbers via Luhn checksums, recursively masks sensitive keys in JSON payloads, and scrubs HIPAA tracking parameters.

**Zero Data Retention Guarantee:** Your requests are processed purely in-memory and immediately returned. No text, logs, or customer payloads are ever stored on disk or in any database.

---

## 🚀 Why Developers Use This API

1. **LLM Privacy Guardrails**: Scrub user inputs *before* sending prompts to OpenAI (ChatGPT), Anthropic (Claude), or external LLMs to avoid leaking sensitive data or violating GDPR/CCPA.
2. **Log Sanitization**: Clean application logs before sending them to Datadog, Sentry, CloudWatch, or Elasticsearch.
3. **Card Pre-Validation**: Run instantaneous Luhn Mod-10 checksum validation and card network detection without handling full PCI-DSS scope.
4. **HIPAA & Telemetry Stripping**: Strip Protected Health Information (PHI) indicators and ad-tech tracking beacons (`gclid`, `fbclid`, `utm_*`).

---

## ⚡ Core Endpoints

### 1. `POST /v1/privacy/redact`
Detects and sanitizes sensitive PII entities from raw unstructured text.

**Detected Entities:**
- Email addresses
- US phone numbers (multiple formats)
- Social Security Numbers (SSNs)
- Payment card numbers (verified via Luhn check)
- IPv4 addresses
- API keys & bearer tokens (`sk-`, `ghp_`, `AKIA...`)

**Modes Supported:**
- `placeholder` (default): Replaces entities with tags like `[REDACTED_EMAIL]`, `[REDACTED_CARD]`.
- `mask`: Obscures characters with asterisks (e.g. `j***@example.com`).
- `hash`: Replaces values with deterministic SHA-256 hashes (ideal for consistent pseudonymous indexing).

#### Request Example:
```json
{
  "text": "Please refund order for John at john.doe@company.org or call 555-234-5678. Card used: 4111 1111 1111 1111.",
  "mode": "placeholder"
}
```

#### Response:
```json
{
  "redacted": "Please refund order for John at [REDACTED_EMAIL] or call [REDACTED_PHONE]. Card used: [REDACTED_CARD].",
  "matchesCount": 3,
  "detectedTypes": ["email", "phone", "credit_card"],
  "mode": "placeholder",
  "processingTimeMs": 2.1
}
```

---

### 2. `POST /v1/privacy/validate-luhn`
Verifies whether a payment card number passes the mathematical Luhn Mod-10 checksum algorithm and identifies the card brand.

**Detected Networks:** Visa, Mastercard, American Express, Discover, JCB, Diners Club.

#### Request Example:
```json
{
  "cardNumber": "4532-0150-1234-5678"
}
```

#### Response:
```json
{
  "valid": true,
  "network": "Visa",
  "length": 16,
  "masked": "************5678"
}
```

---

### 3. `POST /v1/privacy/mask-json`
Recursively traverses any arbitrary nested JSON structure and masks sensitive key-value pairs (e.g., `password`, `token`, `secret`, `ssn`, `apiKey`).

#### Request Example:
```json
{
  "data": {
    "user": "developer_1",
    "credentials": {
      "password": "SuperSecretPassword123!",
      "sessionToken": "98a7sd98f7as9df87"
    },
    "profile": {
      "email": "dev@dangling-dice.com"
    }
  }
}
```

#### Response:
```json
{
  "masked": {
    "user": "developer_1",
    "credentials": {
      "password": "[MASKED]",
      "sessionToken": "[MASKED]"
    },
    "profile": {
      "email": "dev@dangling-dice.com"
    }
  },
  "maskedKeysCount": 2
}
```

---

### 4. `POST /v1/privacy/hipaa-scrub`
Specialized scrubber for healthcare environments and telemetry streams. Removes patient name/MRN patterns, date-of-birth timestamps, and tracking query parameters (`fbclid`, `gclid`, ad-tech click identifiers).

#### Request Example:
```json
{
  "text": "Patient MRN #98412 admitted on 10/12/2024. Visit URL: https://clinic.org/portal?gclid=xyz123&patient=doe"
}
```

---

## 💻 Quickstart Implementations

### Python (with RapidAPI)
```python
import requests

url = "https://data-privacy-and-pii-redactor.p.rapidapi.com/v1/privacy/redact"

payload = {
    "text": "Send secret key sk-live-982348234 to admin@domain.com",
    "mode": "placeholder"
}

headers = {
    "x-rapidapi-key": "YOUR_RAPIDAPI_KEY",
    "x-rapidapi-host": "data-privacy-and-pii-redactor.p.rapidapi.com",
    "Content-Type": "application/json"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())
```

### Node.js / JavaScript (Fetch)
```javascript
const response = await fetch("https://data-privacy-and-pii-redactor.p.rapidapi.com/v1/privacy/redact", {
  method: "POST",
  headers: {
    "x-rapidapi-key": "YOUR_RAPIDAPI_KEY",
    "x-rapidapi-host": "data-privacy-and-pii-redactor.p.rapidapi.com",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    text: "Contact me at 555-0199 or billing@sample.com",
    mode: "placeholder"
  })
});

const data = await response.json();
console.log(data);
```

### cURL
```bash
curl -X POST "https://data-privacy-and-pii-redactor.p.rapidapi.com/v1/privacy/redact" \
  -H "x-rapidapi-key: YOUR_RAPIDAPI_KEY" \
  -H "x-rapidapi-host: data-privacy-and-pii-redactor.p.rapidapi.com" \
  -H "Content-Type: application/json" \
  -d '{"text": "Call me at 555-0199", "mode": "placeholder"}'
```

---

## 🔒 Security & Data Privacy Statement
- **Stateless**: All compute is transient in-memory processing.
- **Zero Storage**: No inputs, logs, or outputs are persisted to databases or disk.
- **TLS 1.3**: All traffic is encrypted in transit over HTTPS.
