# Attendance Register System — End-to-End Guide

## Overview

The Attendance Register is a two-part system:
1. **Kiosk Interface** — Tablet-based check-in/check-out for staff and visitors (authenticated entry point)
2. **Admin Dashboard** — Analytics, reporting, staff management, and anomaly detection (admin-only)

---

## 1. User Entry Points

### 1.1 Kiosk (Protected Tablet)
**URL:** `http://localhost:5173/kiosk`

**Purpose:** Approved owner and sub-admin accounts can unlock the attendance tablet for a limited period before it locks itself again.

**User Flow:**
```
Kiosk Unlock (email + kiosk password + hours)
   ↓
Welcome Screen (select action)
    ↓
    ├─ [CHECK IN] → Type Select (Staff / Visitor)
    │   ├─ Staff → Staff Lookup → Review → Submit ✓
    │   └─ Visitor → Visitor Form → Inspect Link? → Rep Assignment → Submit ✓
    │
    └─ [CHECK OUT] → Open Log Search → Select Log → Add Notes? → Submit ✓

After Success → Auto-reset after 3 seconds
```

**Features:**
- Email and kiosk-password gate; the owner admin always has access, while sub-admins need the `kiosk` permission grant
- The kiosk password is configured only from the owner admin's Settings page
- The selected duration is enforced by both the browser and the server-issued kiosk token (1-24 hours)
- A persistent browser device ID, IP address, and user-agent are recorded with each kiosk check-in for audit review
- 🎯 Tablet-optimized full-screen interface
- 📝 Real-time staff/visitor search
- 🔗 Link visitor check-ins to inspection bookings
- 📱 WhatsApp contact capture
- 🤝 Representative assignment for visitors
- ⏱️ Automatic dwell time calculation on check-out

---

### 1.2 Admin Dashboard
**URL:** `http://localhost:5173/admin/attendance`

**Access:** Click **Attendance** in the admin sidebar (requires `attendance` read permission)

**Default Tab:** Attendance Logs

---

## 2. Admin Dashboard Interface

### 2.1 Navigation Link
The attendance link is now integrated into the admin sidebar:
- **Icon:** Clock ⏱️
- **Label:** Attendance
- **Position:** After Properties in the sidebar menu
- **Permission:** `attendance` (read/write)

### 2.2 Five Main Tabs

#### **Tab 1: Logs** (Default)
**Purpose:** View and manage all check-in/check-out records

**Features:**
- 📊 Paginated table (20 rows per page)
- 🔍 Filters:
  - **Type:** Staff / Visitor
  - **Status:** Checked Out / Pending / No-Show
  - **Purpose:** Free-text search
- 📥 Date range picker (top-right of page)
- 📥 Export CSV button
- ⏸️ Delete individual logs (soft delete with audit trail)
- ✏️ Edit button for notes/status updates

**Columns Displayed:**
1. Date (formatted)
2. Name (staff name or visitor name)
3. Type badge (staff/visitor color-coded)
4. Check-In time
5. Check-Out time
6. Duration in minutes
7. Purpose/reason
8. Device (kiosk device ID/IP or Admin console)
9. Status (checked out / pending / no-show)
10. Actions (edit/delete)

**Loading State:** SkeletonGlass skeleton rows (5 rows × 9 columns) while fetching

---

#### **Tab 2: Staff**
**Purpose:** CRUD management for staff member database

**Features:**
- 📋 Paginated staff directory
- ➕ Add new staff member
- ✏️ Edit staff details:
  - First name, Last name
  - Email, Phone
  - Department
  - Badge ID
  - Role (staff/supervisor)
  - Status (active/inactive)
- 🗑️ Soft delete staff members (maintain audit trail)
- 🔍 Department filter
- 🔍 Status filter (active/inactive)

**Columns Displayed:**
1. Staff ID
2. Name
3. Email
4. Department
5. Status badge
6. Badge ID
7. Actions

**Loading State:** SkeletonGlass skeleton rows (5 rows × 6 columns) while fetching

---

#### **Tab 3: Analytics**
**Purpose:** High-level attendance metrics and trends

**Snapshot Stats (Top Cards):**
- 📊 Total Check-Ins (count)
- 👥 Unique Staff (count)
- 🚶 Unique Visitors (count)
- ⏱️ Average Dwell Time (minutes)

**Charts & Data:**
- 📈 Peak Hour Analysis (e.g., "10:00 AM — 45 visits")
- 📉 No-Show Rate (percentage)
- 📅 Daily Trend Table (last 30 days):
  - Date
  - Check-In Count
  - Unique Visitors
  - Avg Dwell Time (minutes)
  - No-Show Count

---

#### **Tab 4: Anomalies**
**Purpose:** Flag suspicious patterns and no-show alerts

**Detects:**
- 🚩 Repeated no-shows for the same staff/visitor
- ⚠️ Unusual dwell times (too short/too long)
- 🔴 Multiple check-ins without check-out
- 📍 Badge/ID mismatches
- 🌙 Out-of-hours access patterns

**Display:**
- Sortable table of flagged records
- Severity level (Low / Medium / High)
- Recommended action (e.g., "Follow up with staff")
- Mark as reviewed (acknowledge alert)

---

#### **Tab 5: Reports**
**Purpose:** Generate and export CSV reports

**Available Reports:**
1. **Monthly Summary** — Complete attendance overview for date range
2. **No-Show Report** — All visitors with no check-out
3. **Dwell Time Analysis** — Breakdown by visitor type
4. **Department Breakdown** — Staff metrics by department

**Export:**
- Click "Download CSV" on any report
- File format: `attendance-[report-type]-[timestamp].csv`
- Auto-downloads to user's Downloads folder

---

## 3. Date Range Selector

**Location:** Top-right corner of the dashboard header

**Impact:** Filters all 5 tabs to the selected date range
- Default: Last 30 days
- Changes propagate in real-time to all tabs
- Stored in React state (not persistent)

---

## 4. API Endpoints (Backend)

All endpoints require `requireAuth` middleware + `requireAdminPermission("attendance")`.

### **Staff Management**
```
GET    /api/admin/attendance/staff                    — List (paginated, filterable)
POST   /api/admin/attendance/staff                    — Create new staff
GET    /api/admin/attendance/staff/:id                — Get single staff
PATCH  /api/admin/attendance/staff/:id               — Update staff
DELETE /api/admin/attendance/staff/:id               — Soft delete staff
GET    /api/admin/attendance/staff/search?q=name     — Search by name/email/badge
```

### **Attendance Logs**
```
POST   /api/attendance/kiosk/login                    — Unlock kiosk for a selected duration (public login endpoint)
GET    /api/attendance/kiosk/staff-search?q=name     — Search staff (kiosk session required)
GET    /api/attendance/kiosk/open-logs?q=name       — Find open logs (kiosk session required)
POST   /api/attendance/kiosk/check-in                — Record kiosk check-in + device metadata
PATCH  /api/attendance/kiosk/:logId/check-out        — Record kiosk check-out
POST   /api/admin/attendance/check-in                 — Record check-in (kiosk + admin)
PATCH  /api/admin/attendance/:logId/check-out        — Record check-out
GET    /api/admin/attendance/logs                    — List logs (paginated, filterable)
GET    /api/admin/attendance/:logId                  — Get single log
DELETE /api/admin/attendance/:logId                  — Soft delete log
```

### **Analytics**
```
GET    /api/admin/attendance/analytics/summary       — Overall stats snapshot
GET    /api/admin/attendance/analytics/anomalies     — Flagged patterns
GET    /api/admin/attendance/report                  — CSV export
```

### **Query Parameters**
All list endpoints support:
- `page` — Page number (default: 1)
- `limit` — Rows per page (default: 20, max: 100)
- `startDate` — ISO date string (e.g., `2024-01-01T00:00:00Z`)
- `endDate` — ISO date string

Type-specific filters:
- `type` — "staff" | "visitor"
- `department` — Staff department name
- `status` — "active" | "inactive" | "checked-out" | "pending" | "no-show"
- `search` — Free-text (logs only)

---

## 5. Authentication & Permissions

### **Permission System**
```
AdminMenuKey: "attendance"

Owner Admin (role === "admin"):
  ✅ Full read/write access
  ✅ Create/update/delete staff
  ✅ View all reports
  ✅ Manage sub-admin permissions

Sub Admin (role === "staff_admin" with "attendance" grant):
  ✅ Read all logs/staff/analytics
  ⚠️  Write access depends on permission grant:
    - write: true  → Can edit/delete
    - write: false → Read-only
```

The `kiosk` permission is separate from the `attendance` menu permission. The owner grants it in Team & access. A sub-admin may use the kiosk only when this grant is present; the owner-only Kiosk access password segment in Settings cannot be changed by a sub-admin.

### **Access Control Flow**
```
Admin Layout Navigation
    ↓ (Link to /admin/attendance)
AdminLayout filters NAV_ITEMS by user permission
    ↓
canReadAdminMenu(user, "attendance") → admin-access.ts
    ↓
User has permission? → True: Show link | False: Hide link
    ↓
Click link → /admin/attendance route
    ↓
App.tsx renders <AttendancePage /> inside AdminLayout
    ↓
AttendancePage renders 5 tabs with tab selection state
    ↓
Each tab component makes API calls to /api/admin/attendance/*
    ↓
Server requireAdminPermission("attendance") middleware
    ↓
Grants access or 403 Forbidden
```

---

## 6. Data Flow: Check-In Example

### **User: Visitor using Kiosk**

```
1. Kiosk Welcome Screen
   └─ Click [CHECK IN]
   
2. Kiosk Type Select
   └─ Click [VISITOR]
   
3. Visitor Form
   ├─ Enter name: "Jane Smith"
   ├─ Enter email: "jane@example.com"
   ├─ Enter phone: "+234801234567"
   ├─ Enter purpose: "Property inspection"
   └─ Link to inspection? [Optional]
   
4. Review Screen
   └─ Confirm details
   
5. Submit Check-In
   ├─ POST /api/admin/attendance/check-in
   ├─ Payload:
   │  {
   │    type: "visitor",
   │    visitorName: "Jane Smith",
   │    visitorEmail: "jane@example.com",
   │    visitorPhone: "+234801234567",
   │    purpose: "Property inspection",
   │    linkedInspectionId?: "insp-123"
   │  }
   └─ Server creates AttendanceLog document
       ├─ Stores check-in timestamp
       ├─ Generates WhatsApp link
       └─ Returns confirmation + checklist
   
6. Success Screen (3 seconds)
   └─ Display success message + details
   
7. Auto-reset
   └─ Return to Welcome Screen
   
8. Later: Visitor Check-Out (Same Kiosk)
   ├─ Click [CHECK OUT]
   ├─ Search for "Jane Smith"
   ├─ Select from open logs
   ├─ Optionally add notes
   └─ Submit
       ├─ PATCH /api/admin/attendance/:logId/check-out
       ├─ Server calculates:
       │  - checkOutTime = now
       │  - durationMinutes = (checkOut - checkIn) / 60000
       └─ Returns duration + final summary
```

### **Admin: Review in Dashboard**

```
1. Admin clicks Attendance link in sidebar
   └─ Redirected to /admin/attendance
   
2. AttendancePage renders (defaults to Logs tab)
   ├─ Sets date range (last 30 days)
   ├─ Fetches summary stats
   └─ Loads first page of logs
   
3. Logs Tab displays table
   ├─ Row 1: Jane Smith | Visitor | 2:00 PM | 3:15 PM | 75 min | Property inspection
   └─ Action buttons: Edit | Delete
   
4. Admin filters by type = "visitor"
   ├─ Query updates: page=1, type=visitor
   ├─ Table reloads
   └─ Shows only visitor records
   
5. Admin clicks "Export CSV"
   ├─ Triggers GET /api/admin/attendance/report
   ├─ Server returns CSV file
   └─ Browser downloads: attendance-report-[timestamp].csv
   
6. Admin switches to Analytics tab
   ├─ Sees summary cards:
   │  - Total Check-Ins: 342
   │  - Unique Staff: 18
   │  - Unique Visitors: 156
   │  - Avg Dwell: 52 minutes
   └─ Sees daily trend table (last 30 days)
   
7. Admin switches to Anomalies tab
   ├─ Sees flagged records:
   │  - Staff X: No check-out (3 times this month)
   │  - Visitor Y: Dwell time 2 hours (unusual)
   └─ Each row has "Mark as Reviewed" button
   
8. Admin switches to Staff tab
   ├─ Views all staff members (paginated)
   ├─ Click [+ Add Staff] to create new record
   └─ Or click a row to edit details
```

---

## 7. Design System Integration

### **Colors**
- **Background:** `#FFECE4` (warm cream)
- **Primary:** `#5C4033` (brown)
- **Text:** `#181818` (dark)
- **Accent:** `#d4af37` (gold, for badges/premium elements)
- **Border:** `#E8D5C4` (light cream)

### **Typography**
- **Headings:** Manrope (24px, semibold)
- **Body:** Inter (16px, regular)
- **Small text:** Inter (12px, regular)

### **Components**
- **Tables:** White background, light borders, alternating row colors
- **Cards:** White with rounded corners, subtle shadow
- **Buttons:** Brown background (`#5C4033`), white text, hover opacity 0.9
- **Skeleton Loaders:** SkeletonGlass from `@forth-urban/ui` (animated gradient)
- **Icons:** Lucide React (Clock, Users, BarChart3, AlertCircle, FileText, ClipboardList)

---

## 8. Testing

### **E2E Tests** (Playwright)
```bash
cd apps/client
npx playwright test e2e/attendance.spec.ts
```

**Test Scenarios:**
- ✅ Kiosk welcome screen loads
- ✅ Staff check-in with lookup
- ✅ Visitor check-in with email/phone
- ✅ Check-out calculates dwell time
- ✅ Admin views logs table
- ✅ Admin filters by type
- ✅ Admin exports CSV report

### **Unit Tests** (Vitest)
```bash
cd apps/server
npm run test -- attendance
```

**Covered:**
- Check-in/check-out logic
- Dwell time calculation
- Pagination helpers
- Anomaly detection algorithms
- No-show flagging

---

## 9. Known Limitations & Future Improvements

### **Current Limitations**
- ❌ No facial recognition (kiosk uses manual search)
- ❌ No badge/RFID scanner integration
- ❌ No real-time notifications for anomalies
- ❌ Analytics data recomputed on every query (no caching)

### **Future Enhancements**
- 🔮 Biometric integration (fingerprint/face)
- 🔮 QR code scanning
- 🔮 Email alerts for flagged anomalies
- 🔮 GraphQL subscription for live updates
- 🔮 Visitor pre-registration via SMS link
- 🔮 Department-level analytics (break down by sales/ops/admin)

---

## 10. Troubleshooting

### **Admin can't see Attendance link in sidebar**
- ✅ Verify user role: Check if `user.role === "admin"` or has `adminAccess.permissions.attendance.read`
- ✅ Force reload: `Ctrl+Shift+R` to clear cache
- ✅ Check backend: Verify middleware allows access to `/api/admin/attendance/*`

### **Kiosk loads but forms don't submit**
- ✅ Check network tab: Ensure `POST /api/admin/attendance/check-in` returns 200
- ✅ Verify WhatsApp number format: Must start with `+` and country code
- ✅ Check console errors: Look for form validation errors

### **Analytics tab shows "Loading..." forever**
- ✅ Verify date range: Try a shorter range (e.g., last 7 days)
- ✅ Check server logs: Look for errors in `GET /api/admin/attendance/analytics/summary`
- ✅ Ensure data exists: Perform a kiosk check-in first

### **CSV export is empty**
- ✅ Verify date range includes records
- ✅ Check filters: Date range might be excluding records
- ✅ Server logs: Look for any export query errors

---

## 11. Quick Start

**For Users (Kiosk):**
1. Open `http://localhost:5173/kiosk` on a tablet
2. Click [CHECK IN] or [CHECK OUT]
3. Follow prompts to enter details
4. Confirm and submit

**For Admins:**
1. Log in with admin credentials
2. Click **Attendance** in the sidebar
3. Use tabs to navigate different views (Logs, Staff, Analytics, etc.)
4. Use date range picker to filter by date
5. Download CSV reports from Reports tab

---

## 12. Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React 19 + Vite)               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Kiosk Layer (/kiosk)         Admin Layer (/admin/attendance)
│  └─ KioskShell                └─ AttendancePage
│     ├─ WelcomeScreen             ├─ AttendanceLogsTab
│     ├─ CheckInScreen             ├─ StaffManagementTab
│     ├─ CheckOutScreen            ├─ AnalyticsDashboardTab
│     └─ SuccessScreen             ├─ AnomaliesViewTab
│                                   └─ ReportsTab
│
└─────────────────────────────────────────────────────────────┘
                           ↓ (API calls)
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Express + Node LTS)              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  attendance.admin.routes.ts (all /api/admin/attendance/*)   │
│  ├─ Staff CRUD (getStaff, createStaff, updateStaff, etc.)  │
│  ├─ Check-in/Check-out (checkIn, checkOut)                 │
│  ├─ Logs (getAttendanceLog, listAttendanceLogs)            │
│  ├─ Analytics (generateAnalyticsSnapshot)                  │
│  └─ Anomalies (detectAnomalies, flagNoShows)              │
│
│  Database: MongoDB                                         │
│  ├─ Staff collection (staff.model.ts)                      │
│  └─ AttendanceLog collection (attendance-log.model.ts)    │
│
└─────────────────────────────────────────────────────────────┘
```

---

**Last Updated:** 2026-09-01
**Status:** ✅ Complete and linked
