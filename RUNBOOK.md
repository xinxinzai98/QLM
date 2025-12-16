# System Runbook

## 1. Local Startup

### Prerequisites
*   Node.js >= 16.0.0
*   npm >= 8.0.0

### Quick Start
**Mac/Linux:**
```bash
./scripts/start.sh
```

**Windows:**
```powershell
.\scripts\windows\start.ps1
```

### Manual Start
**Backend:**
```bash
cd backend
npm install
cp .env.example .env # Modify JWT_SECRET!
npm start
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 2. Smoke Testing (Automated)
We have provided an automated script to verify the core backend status.

**Run Smoke Test:**
```bash
# Ensure backend is running on localhost:3000
node scripts/smoke_test.js
```

**Expected Output:**
```text
🔥 Starting Smoke Tests...
✅ Health Check: PASS
✅ Admin Login: PASS
✅ Get Profile: PASS
✨ All Smoke Tests PASSED
```

## 3. Manual Verification Steps (P0 Features)

| Feature | Action | Expected Result |
| :--- | :--- | :--- |
| **Login** | POST `/api/auth/login` with `admin`/`admin123` | Returns 200 & JWT Token |
| **Static Assets** | Open `http://localhost:3000/` (Prod Mode) | Loads Vue App (Check Title) |
| **Inventory** | POST `/api/inventory` (Create Receipt) | Returns 201 & Transaction ID |
