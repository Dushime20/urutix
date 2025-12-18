# Third-Party Lending Integration - Quick Checklist

Fill out this checklist and provide it to your development team.

## 🔗 Basic Information

- [ ] **Third-Party System Name:** _______________________
- [ ] **Base API URL:** _______________________
- [ ] **API Version:** _______________________
- [ ] **Documentation URL:** _______________________

## 🔐 Authentication

- [ ] **Method:** 
  - [ ] API Key
  - [ ] OAuth 2.0
  - [ ] HMAC Signature
  - [ ] Other: _______________________

- [ ] **Credentials:**
  - API Key / Client ID: _______________________
  - Client Secret: _______________________
  - How to obtain: _______________________

## 📡 API Endpoints

- [ ] **Create Loan Request:**
  - Method: `POST`
  - Path: `/api/v1/loan_requests` (or: _______________________)
  - Request Format: JSON / XML / Other: _______________________

- [ ] **Get Loan Status:**
  - Method: `GET`
  - Path: `/api/v1/loan_requests/{id}` (or: _______________________)
  - Available: Yes / No

- [ ] **Webhook Support:**
  - Supported: Yes / No
  - Webhook URL format: _______________________
  - Authentication method: _______________________

## 📊 Data Format

- [ ] **Currency:** _______________________ (e.g., USD, NGN)
- [ ] **Date Format:** _______________________ (e.g., ISO 8601)
- [ ] **Status Mapping:**
  - `pending` → _______________________
  - `approved` → _______________________
  - `rejected` → _______________________
  - `disbursed` → _______________________
  - `repaid` → _______________________
  - `defaulted` → _______________________

## 🔔 Webhook Events

Which events does the third-party system send?

- [ ] Loan Approved
- [ ] Loan Rejected
- [ ] Loan Disbursed
- [ ] Loan Repaid
- [ ] Loan Defaulted
- [ ] Other: _______________________

## 🧪 Testing

- [ ] **Sandbox URL:** _______________________
- [ ] **Test Credentials:**
  - API Key: _______________________
  - Secret: _______________________
- [ ] **Test Data Requirements:** _______________________

## ❓ Special Requirements

- [ ] **Rate Limits:** _______________________ requests per minute/hour
- [ ] **Timeout:** _______________________ seconds
- [ ] **Retry Policy:** _______________________
- [ ] **Error Codes:** (attach documentation)
- [ ] **Special Notes:** _______________________

---

## 📋 What We Need from You

1. **API Documentation** (PDF, URL, or Swagger/OpenAPI spec)
2. **Test Credentials** for sandbox environment
3. **Sample Request/Response** examples
4. **Webhook Payload Examples** (if applicable)
5. **Error Response Examples**

---

## ✅ Once You Provide This

We will:
- ✅ Implement the integration service
- ✅ Set up webhook endpoints
- ✅ Create admin UI for configuration
- ✅ Add error handling and retry logic
- ✅ Write integration tests
- ✅ Provide documentation

---

**Contact:** [Your development team contact]

**Timeline:** [Expected implementation time]

