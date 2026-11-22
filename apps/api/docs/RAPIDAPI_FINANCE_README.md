# Financial Math, Loan Amortization & Cashflow API

[![Sub-Millisecond](https://img.shields.io/badge/Compute-%3C1ms-brightgreen)](#)
[![FinTech Ready](https://img.shields.io/badge/Calculations-Amortization%20%7C%20NPV%20%7C%20IRR-blue)](#)
[![Stateless](https://img.shields.io/badge/Architecture-Zero%20Data%20Retention-orange)](#)

A high-precision financial analytics and mortgage computation engine (<1ms latency). Calculate complete month-by-month loan amortization schedules, extra-payment interest savings simulations, compound interest growth with periodic contributions, Net Present Value (NPV), Internal Rate of Return (IRR), payback period, and software development project cost scoping.

Built for **fintech platforms, mortgage lenders, real estate investment apps, banking portals, and SaaS financial dashboards**.

---

## 💰 Why Developers Use This API

1. **Mortgage & Loan Schedules**: Generate full month-by-month principal vs. interest payoff schedules with exact pennies precision.
2. **Accelerated Payoff Simulations**: Calculate exactly how much money and how many months borrowers save by making extra monthly payments towards their principal.
3. **Investment Wealth Projections**: Project wealth growth via compound interest formulas with flexible compounding cycles (monthly, annually, daily).
4. **Commercial Real Estate & NPV**: Compute Net Present Value and IRR across irregular cashflow projections.

---

## ⚡ Core Endpoints

### 1. `POST /v1/finance/amortization`
Calculates fixed monthly payments, total interest paid, total payment amount, and the complete month-by-month amortization schedule.

#### Request Example:
```json
{
  "principal": 350000,
  "annualRatePercent": 6.5,
  "termMonths": 360
}
```

#### Response Example:
```json
{
  "success": true,
  "engine": "finance",
  "latencyMs": 0.42,
  "data": {
    "monthlyPayment": 2212.24,
    "totalInterest": 446405.12,
    "totalPayment": 796405.12,
    "schedule": [
      {
        "month": 1,
        "payment": 2212.24,
        "principal": 316.41,
        "interest": 1895.83,
        "remainingBalance": 349683.59
      }
    ]
  }
}
```

---

### 2. `POST /v1/finance/extra-payments`
Simulates early mortgage payoff and calculates exact interest dollars saved.

#### Request Example:
```json
{
  "principal": 350000,
  "annualRatePercent": 6.5,
  "termMonths": 360,
  "extraMonthlyPayment": 300
}
```

---

### 3. `POST /v1/finance/compound-interest`
Calculates future investment value based on initial deposit, annual return rate, and periodic monthly contributions.

#### Request Example:
```json
{
  "principal": 10000,
  "annualRatePercent": 8.0,
  "years": 20,
  "monthlyContribution": 500,
  "compoundingFrequency": "monthly"
}
```

---

### 4. `POST /v1/finance/cashflow`
Computes Net Present Value (NPV), Internal Rate of Return (IRR), total net profit, and payback period from project cash flows.

#### Request Example:
```json
{
  "discountRatePercent": 8.0,
  "cashFlows": [-50000, 15000, 18000, 22000, 25000]
}
```

---

### 5. `POST /v1/finance/project-scope`
Estimates software development hours, engineering timelines, and cost brackets.

---

## 💻 Quickstart Implementations

### Python (with RapidAPI)
```python
import requests

url = "https://financial-math-loan-amortization-and-cashflow-api.p.rapidapi.com/v1/finance/amortization"

payload = {
    "principal": 250000,
    "annualRatePercent": 5.75,
    "termMonths": 180
}

headers = {
    "x-rapidapi-key": "YOUR_RAPIDAPI_KEY",
    "x-rapidapi-host": "financial-math-loan-amortization-and-cashflow-api.p.rapidapi.com",
    "Content-Type": "application/json"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())
```

---

## ⚡ Latency & Precision
- Average response time: **< 1.0 ms**
- IEEE 754 floating-point rounding safeguards for penny-exact financial accuracy.
