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
## 🧩 Backend Services (`/backend`)

| Microservice | Description |
| :--- | :--- |
| **`api-gateway`** | Central entry point for request routing, security, and protocol translation |
| **`auth-service`** | Handles user authentication, JWT token issuance, and password security |
| **`user-service`** | Manages user profiles, saved delivery addresses, and settings |
| **`admin-service`** | Administrative dashboard controls, system metrics, and audit logs |
| **`food-service`** | Manages food catalogs, restaurant menus, categories, and dish pricing |
| **`hotel-service`** | Handles hotel directories, room catalogs, and booking availability |
| **`cart-service`** | Persists session shopping cart state and prepares checkout items |
| **`order-service`** | Manages order lifecycles, order states, and fulfillment workflows |
| **`payment-service`** | Handles payment gateway integration and transaction processing |
| **`delivery-tracking-service`** | Provides real-time GPS delivery tracking and driver updates |
| **`notification-service`** | Dispatches automated emails, SMS alerts, and push notifications |
| **`recommendation-service`** | Computes personalized dish suggestions and hotel recommendations |
| **`review-rating-service`** | Processes customer feedback, reviews, and average rating scores |
| **`ai-service`** | Powers intelligent query processing and smart AI features |
