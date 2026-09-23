# Smart Solar Microgrid Trading System

SE4040 Enterprise Application Development — Assignment 1 (2026)
BSc (Hons) in Information Technology Specialized in Software Engineering, SLIIT

A client-server system for trading stored solar energy between microgrid
hubs and prosumers, built as three tiers:

- **`api/`** — C# ASP.NET Core Web API (FAT-service pattern), MongoDB, JWT auth, hosted on IIS
- **`web/`** — React + Tailwind CSS web app for Backoffice administrators and Grid Operators
- **`mobile/`** — Pure native Android app (Kotlin, SQLite for local persistence only) for Prosumers and Grid Operators

See each folder's own README for setup/build/run instructions, and
`docs/report/SE4040_Project_Report.docx` for the full project report
(architecture, use case and DFD diagrams, database design, all UI
screenshots, and the complete source code listing).

`OpeningScreen.png` (project root) is the required standalone screenshot
of the app's main opening menu/screen, per the assignment brief's
submission checklist.

## Git Repository

https://github.com/Nisal2522/Solar_Microgrid.git

## Demo Video

[INSERT VIDEO LINK — YouTube or OneDrive, max 5 minutes]

## Individual Contribution

Each member owns a vertical slice spanning the web app, mobile app, API
and one MongoDB collection. Full detail is in Section 8 of the project
report; summary below.

| IT Number | Name | Module |
|---|---|---|
| IT23325050 (Leader) | Weerasinghe G.A.A.I (Avishka) | Identity & Access — login/role-based auth, staff user management, prosumer registration & activation workflow (web + mobile + API), plus overall API architecture and IIS hosting |
| IT23334892 | Amarasekara S W N (Nisal) | Microgrid Nodes & Maps — station CRUD and scheduling, nearby-stations map (web + mobile + API) |
| IT23386136 | Vinoshan A G S (Sampath) | Reservations & Booking Workflow — slot booking, reservation create/modify/cancel, booking history and dashboards (web + mobile + API) |
| IT23135734 | Dias M T D (Tharindu) | Grid Operator Operations & Service Integration — battery availability, QR scan/verify/complete, shared API client and local persistence layer (web + mobile + API) |
