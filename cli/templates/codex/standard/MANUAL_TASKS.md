# 📋 Manual Tasks Checklist (MANUAL_TASKS.md)

> [!NOTE]
> This document tracks tasks that require **human intervention, external dashboard actions, or manual verification**.
> AI Agents cannot access external third-party consoles or physical devices. When a task requires human intervention, record it here with an actionable `[ ]` checkbox and notify the user.

---

## 1. 🌐 Frontend & Web

- [ ] **1.1 Custom Domain & DNS**
  - [ ] Configure custom domain DNS records (CNAME / A records)
  - [ ] Verify SSL/TLS certificates in hosting dashboard
- [ ] **1.2 Third-Party Authentication & OAuth**
  - [ ] Register OAuth credentials in developer console (Google, GitHub, etc.)
  - [ ] Add production redirect URLs to OAuth allowlist

---

## 2. ⚙️ Backend & Cloud Infrastructure

- [ ] **2.1 Production Database Migration**
  - [ ] Review pending migration scripts
  - [ ] Run production migration command: `<your-migration-command>`
- [ ] **2.2 Production Secrets & Environment Variables**
  - [ ] Inject production secrets into cloud hosting platform
- [ ] **2.3 Webhook Endpoints**
  - [ ] Register callback URLs in external partner dashboards
  - [ ] Save webhook signing secret to server environment

---

## 3. 📱 Mobile App (iOS / Android)

- [ ] **3.1 Developer Accounts & Certificates**
  - [ ] Set up App ID, provisioning profiles, and signing certificates
  - [ ] Configure push notification service keys (APNs / FCM)
- [ ] **3.2 In-App Purchases & Store Metadata**
  - [ ] Create products and pricing tiers in App Store Connect / Play Console
  - [ ] Submit app review credentials (demo account)
- [ ] **3.3 Physical Device Testing**
  - [ ] Test hardware permissions on real devices (Camera, Microphone, Location)
  - [ ] Verify offline behavior and network reconnect flows
