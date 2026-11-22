# Schema Transformer, Code Generator & DB Tooling API

[![Sub-Millisecond](https://img.shields.io/badge/Compute-%3C5ms-brightgreen)](#)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%20%7C%20Zod-blue)](#)
[![Database](https://img.shields.io/badge/SQL-PostgreSQL%20%7C%20Prisma-orange)](#)

A high-performance schema inference and code generation engine (<5ms latency). Instantly convert raw JSON into strict TypeScript interfaces, Zod runtime schemas, JSON Schema Draft-07, and PostgreSQL `CREATE TABLE` DDL. Also converts existing SQL schemas into TypeScript and parses database connection URIs.

Built for **developer productivity platforms, CLI scaffolding tools, form generators, and low-code backends**.

---

## 🛠️ Why Developers Use This API

1. **Instant Type Generation**: Transform dynamic API responses or webhook payloads directly into strongly-typed TypeScript interfaces.
2. **Automated Runtime Validation**: Auto-generate Zod schemas (`z.string().uuid()`, `z.string().email()`, `z.number().int()`) to validate inputs in Node.js, Next.js, and Express apps.
3. **Database Migration Scaffolding**: Turn unstructured documents into relational PostgreSQL `CREATE TABLE` DDL with inferred column types and primary keys.
4. **SQL DDL to TypeScript Conversion**: Feed SQL schema definitions into the engine to receive matching TypeScript models and Zod validation objects.

---

## ⚡ Core Endpoints

### 1. `POST /v1/schema/infer`
Translates raw JSON objects or arrays into TypeScript, Zod, JSON Schema, and SQL DDL.

#### Request Example:
```json
{
  "rootName": "UserAccount",
  "jsonInput": {
    "id": "e3a89047-920f-48d6-ba0a-7fb8fbe2a09c",
    "username": "coder42",
    "email": "dev@dangling-dice.com",
    "active": true,
    "reputation": 1420,
    "joinedAt": "2026-11-22T10:00:00.000Z",
    "settings": {
      "theme": "dark",
      "notifications": true
    }
  }
}
```

#### Response Example:
```json
{
  "success": true,
  "engine": "schema",
  "latencyMs": 0.8,
  "data": {
    "typescript": "export interface UserAccountSettings {\n  theme: string;\n  notifications: boolean;\n}\n\nexport interface UserAccount {\n  id: string;\n  username: string;\n  email: string;\n  active: boolean;\n  reputation: number;\n  joinedAt: string;\n  settings: UserAccountSettings;\n}",
    "zod": "import { z } from \"zod\";\n\nexport const UserAccountSchema = z.object({\n  id: z.string().uuid(),\n  username: z.string(),\n  email: z.string().email(),\n  active: z.boolean(),\n  reputation: z.number().int(),\n  joinedAt: z.string().datetime(),\n  settings: z.object({\n    theme: z.string(),\n    notifications: z.boolean()\n  })\n});",
    "jsonSchema": {
      "type": "object",
      "properties": {
        "id": { "type": "string", "format": "uuid" },
        "email": { "type": "string", "format": "email" },
        "active": { "type": "boolean" },
        "reputation": { "type": "integer" }
      }
    },
    "sqlDdl": "CREATE TABLE user_account (\n  id UUID PRIMARY KEY,\n  username VARCHAR(255) NOT NULL,\n  email VARCHAR(255) NOT NULL,\n  active BOOLEAN NOT NULL,\n  reputation INTEGER NOT NULL,\n  joined_at TIMESTAMPTZ NOT NULL,\n  settings JSONB NOT NULL\n);"
  }
}
```

---

### 2. `POST /v1/schema/sql-to-ts`
Converts standard SQL `CREATE TABLE` DDL directly into TypeScript interfaces and Zod schemas, preserving column nullability.

#### Request Example:
```json
{
  "sql": "CREATE TABLE orders (\n  id UUID PRIMARY KEY,\n  customer_email VARCHAR(255) NOT NULL,\n  amount_cents INTEGER NOT NULL,\n  is_paid BOOLEAN NOT NULL,\n  notes TEXT,\n  created_at TIMESTAMPTZ NOT NULL\n);"
}
```

#### Response Example:
```json
{
  "success": true,
  "engine": "schema",
  "latencyMs": 0.45,
  "data": {
    "tableName": "orders",
    "interfaceName": "Orders",
    "columns": [
      { "name": "id", "sqlType": "UUID", "tsType": "string", "nullable": false },
      { "name": "notes", "sqlType": "TEXT", "tsType": "string | null", "nullable": true }
    ],
    "typescript": "export interface Orders {\n  id: string;\n  customer_email: string;\n  amount_cents: number;\n  is_paid: boolean;\n  notes: string | null;\n  created_at: string;\n}",
    "zod": "import { z } from \"zod\";\n\nexport const OrdersSchema = z.object({\n  id: z.string().uuid(),\n  customer_email: z.string(),\n  amount_cents: z.number().int(),\n  is_paid: z.boolean(),\n  notes: z.string().nullable(),\n  created_at: z.string().datetime()\n});"
  }
}
```

---

### 3. `POST /v1/schema/inspect-uri`
Parses database connection URIs (PostgreSQL, MySQL, MongoDB, Redis, CockroachDB) into structured host, port, database, and parameters.

---

## 💻 Quickstart Implementations

### Python (with RapidAPI)
```python
import requests

url = "https://schema-transformer-code-generator-api.p.rapidapi.com/v1/schema/infer"

payload = {
    "rootName": "ProductRecord",
    "jsonInput": {
        "sku": "ITEM-1029",
        "price": 29.99,
        "inStock": True
    }
}

headers = {
    "x-rapidapi-key": "YOUR_RAPIDAPI_KEY",
    "x-rapidapi-host": "schema-transformer-code-generator-api.p.rapidapi.com",
    "Content-Type": "application/json"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())
```

### Node.js (Fetch)
```javascript
const response = await fetch("https://schema-transformer-code-generator-api.p.rapidapi.com/v1/schema/infer", {
  method: "POST",
  headers: {
    "x-rapidapi-key": "YOUR_RAPIDAPI_KEY",
    "x-rapidapi-host": "schema-transformer-code-generator-api.p.rapidapi.com",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    rootName: "Customer",
    jsonInput: { id: 1, name: "Alice", email: "alice@example.com" }
  })
});

const data = await response.json();
console.log(data);
```

---

## ⚡ Latency & Zero Retention
- Average latency: **< 1.0 ms**
- All conversions run transiently in-memory with zero persistent logging.
