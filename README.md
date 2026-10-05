# 🍔 Go-Eat Platform

An enterprise-grade, microservices-driven food delivery and hotel booking platform built with a React + Vite frontend and a decoupled backend architecture.

---

## 📸 Screenshots & Demo

| App Dashboard | Food Ordering | Hotel Booking |
| :---: | :---: | :---: |
| ![Dashboard](#) | ![Food Catalog](#) | ![Hotel Listings](#) |

*(Drag and drop your project screenshots directly into this section in the GitHub editor)*

---

## 🌟 Key Features

- **Microservices Architecture:** 14 isolated backend services handling distinct domain logic.
- **Centralized API Routing:** Single point of entry via API Gateway for request routing and security.
- **Real-Time Delivery Tracking:** Geolocation status updates for active orders.
- **AI & Recommendations:** Smart suggestions for dishes and hotels powered by dedicated AI services.
- **Modern Frontend:** React 18 + Vite for fast build times and smooth UI rendering.

---

## 🏗️ System Architecture

```text
                               ┌──────────────────────────┐
                               │     React + Vite Client  │
                               │        (/frontend)       │
                               └────────────┬─────────────┘
                                            │
                                            ▼
                               ┌──────────────────────────┐
                               │       API Gateway        │
                               └────────────┬─────────────┘
                                            │
     ┌───────────────────┬──────────────────┼───────────────────┬───────────────────┐
     ▼                   ▼                  ▼                   ▼                   ▼
┌──────────┐       ┌──────────┐       ┌──────────┐       ┌──────────┐       ┌──────────┐
│  Auth    │       │  User    │       │  Food    │       │  Hotel   │       │  Order   │
│ Service  │       │ Service  │       │ Service  │       │ Service  │       │ Service  │
└──────────┘       └──────────┘       └──────────┘       └──────────┘       └──────────┘
     │                   │                  │                   │                   │
     ▼                   ▼                  ▼                   ▼                   ▼
┌──────────┐       ┌──────────┐       ┌──────────┐       ┌──────────┐       ┌──────────┐
│ Payment  │       │ Tracking │       │   Cart   │       │    AI    │       │ Review & │
│ Service  │       │ Service  │       │ Service  │       │ Service  │       │ Rating   │
└──────────┘       └──────────┘       └──────────┘       └──────────┘       └──────────┘
