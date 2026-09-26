# Irai – Food Redistribution Platform

Irai is a web-based platform that connects food donors with NGOs, orphanages, food banks, and biogas plants to reduce food waste and support people in need.

## Features

* User authentication and role-based dashboards.
* Food donation and surplus food listing.
* Location-based food discovery.
* Food collection and claim management.
* Food redistribution to reduce food waste.
* Biogas integration for food that is not suitable for human consumption.

## Tech Stack

* **Frontend:** React, Vite
* **Backend:** Python, FastAPI
* **Database:** SQLAlchemy
* **Maps:** Google Maps API

## Getting Started

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Configure the required environment variables in `.env` files. Do not commit API keys or secrets to GitHub.

## Project Status

Currently under development.
