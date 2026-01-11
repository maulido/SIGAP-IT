# SIGAP-IT - Sistem Informasi Gangguan & Penanganan IT

IT Support Ticketing System built with Meteor 3.x, React 18, MongoDB, and TailwindCSS.

![SIGAP-IT Dashboard](https://via.placeholder.com/800x400?text=SIGAP-IT+Dashboard+Preview)

## 🚀 Overview

SIGAP-IT is a comprehensive helpdesk ticketing system designed to streamline IT support operations. It features a complete workflow from ticket creation to resolution, with advanced capabilities like SLA tracking, performance analytics, and automated reporting.

**Current Status:** ✅ **Production Ready (v1.0)**

---

## ✨ Features

### 🎫 Core Ticketing
- **Full Life-cycle Management**: Create, track, and manage tickets from Open to Closed.
- **Smart Assignment**: Self-assignment workflow for IT Support staff with active ticket limits.
- **Status Workflow**: Open → In Progress → Pending → Resolved → Closed.
- **Priority Levels**: Critical, High, Medium, Low with color-coding.
- **Categorization**: Specific categories for hardware, software, network, etc.
- **File Attachments**: Upload screenshots and documents to tickets.
- **Ticket Reopen**: Ability to reopen resolved tickets within a configurable timeframe.
- **Parent-Child Tickets**: Link related tickets together.

### 📊 Reports & Analytics (New!)
- **Comprehensive Dashboard**: Real-time overview of ticket status, priority, and trends.
- **Advanced Reports Page**:
  - Filter by date date, status, priority, category, and assignee.
  - Visualize data with interactive charts (Status Distribution, Category Breakdown).
  - Track KPIs: Total Tickets, Resolved %, SLA Compliance, Avg Resolution Time.
- **IT Support Performance**: Monitor individual performance metrics and SLA adherence.
- **Export Functionality**:
  - 📄 **PDF Export**: Professional reports with auto-pagination.
  - 📊 **Excel Export**: Detailed data with multiple sheets.

### 🧠 Knowledge Base
- **Article Management**: Create and manage instructional articles.
- **Public Access**: Users can search and view solutions before creating tickets.
- **Rich Text**: Support for detailed content.

### ⚡ SLA & Workflows
- **SLA Engine**: Configurable response and resolution times based on priority.
- **Business Hours**: Support for business hour calculations.
- **Worklogs**: Mandatory worklogs for every status change to ensure accountability.
- **Pending Workflow**: Specific reasons for pending status (Waiting for User, Vendor, etc.) with timeouts.

### 👥 User Management
- **Role-Based Access Control (RBAC)**:
  - **User**: Create tickets, view own history, access KB.
  - **IT Support**: Manage tickets, view dashboard, access reports.
  - **Admin**: Full system control, user management, configuration.
- **Secure Authentication**: Built on Meteor Accounts with bcrypt.

---

## 🛠️ Tech Stack

- **Framework**: [Meteor 3.3.2](https://www.meteor.com/) (Full-stack JavaScript)
- **Frontend**: [React 18](https://reactjs.org/)
- **Routing**: [React Router v6](https://reactrouter.com/)
- **Database**: [MongoDB](https://www.mongodb.com/)
- **Styling**: [TailwindCSS 3.x](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Chart.js](https://www.chartjs.org/) & [React Chartjs 2](https://react-chartjs-2.js.org/)
- **Reporting**:
  - `jspdf` & `jspdf-autotable` (PDF)
  - `xlsx` (Excel)
- **Access Control**: `alanning:roles`

---

## 📦 Installation

1. **Install Meteor** (if not already installed):
   ```bash
   # Windows (using Chocolatey)
   choco install meteor

   # macOS/Linux
   curl https://install.meteor.com/ | sh
   ```

2. **Clone the repository:**
   ```bash
   git clone https://github.com/maulido/SIGAP-IT.git
   cd SIGAP-IT
   ```

3. **Install dependencies:**
   ```bash
   meteor npm install
   ```

4. **Start the application:**
   ```bash
   meteor
   ```

5. **Access the app:**
   Open http://localhost:3000

---

## 🔐 Default Credentials

The system creates a default admin account on first startup:

- **Email**: `admin@sigap-it.com`
- **Password**: `admin123`

> ⚠️ **IMPORTANT**: Please change this password immediately after logging in!

---

## 📂 Project Structure

```
SIGAP-IT2/
├── client/                 # Client entry point
├── server/                 # Server entry point
├── public/                 # Public assets
├── imports/
│   ├── api/                # Backend logic (Collections, Methods, Pubs)
│   │   ├── tickets/
│   │   ├── reports/        # Analytics logic
│   │   ├── dashboard/
│   │   ├── users/
│   │   └── ...
│   └── ui/                 # Frontend (React Components)
│       ├── components/     # Reusable components
│       ├── layouts/        # Main layouts
│       ├── pages/          # Application pages
│       └── utils/          # Utility functions (Export, formatting)
└── ...
```

---

## 📝 Usage Guide

### Generating Reports
1. Login as **Admin** or **IT Support**.
2. Navigate to **Reports** from the sidebar.
3. Select your desired Date Range and Filters.
4. Click **Apply Filters**.
5. View statistics and charts.
6. Use the **Export to PDF** or **Export to Excel** buttons to download the data.

### IT Support Workflow
1. Find tickets in **Open Tickets**.
2. Click **Assign to Self** to start working.
3. Update status to **Pending** if waiting for external input.
4. Log all activities in the **Worklog**.
5. Mark as **Resolved** when finished.

---

## 🛣️ Roadmap

- [x] **Phase 1: Core System** (Ticketing, Users, SLA, Worklogs)
- [x] **Phase 2: Analytics & Reports** (Dashboard, PDF/Excel Export, Performance)
- [ ] **Phase 3: Automation** (Auto-close, SLA Escalation, Email Notifications)
- [ ] **Phase 4: Mobile App** (React Native)

---

## 📄 License

Proprietary Software - Internal Use Only

---

## 📞 Support

For technical support or feature requests, contact the Development Team.
