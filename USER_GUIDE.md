# SIGAP-IT II - User Guide (New Features)

## 📊 Reports & Analytics
The new **Reports** page is available to **Support** and **Admin** users.

### Features
1.  **Dashboard:**
    - View key metrics: Total Tickets, Resolution Rate, SLA Met %, and Average Resolution Time.
    - Visualize trends with Resolution Time and SLA Compliance charts.
2.  **Filtering:**
    - Filter reports by **Date Range**, **Status**, **Category**, **Priority**, and **Assigned Support Staff**.
    - Click "Apply Filters" to update all charts and tables.
3.  **Exports:**
    - **PDF:** Download a formatted summary report for printing or sharing.
    - **Excel:** Download raw dataset for custom analysis.
4.  **Performance Metrics:**
    - View a detailed table of IT Support performance, including tickets resolved and average handle time.

## 🚨 SLA Escalation System
The system now automatically monitors response and resolution times.

### Escalation Levels
1.  **Warning (75% Time Used):**
    - **Trigger:** When 75% of the SLA time has elapsed.
    - **Notification:** Emails sent to the **Assigned Support Agent** and all **Admins**.
    - **UI:** An orange "SLA Warning" banner appears on the Ticket Detail page.
2.  **Critical (90% Time Used):**
    - **Trigger:** When 90% of the SLA time has elapsed.
    - **Notification:** Emails sent to **All Support Agents** and **All Admins**.
    - **UI:** A red "CRITICAL ESCALATION" banner appears. Requires immediate acknowledgement.

### Managing Escalations (Admin/Support)
1.  **Dashboard Monitor:**
    - A new "SLA Escalation Monitor" widget on the Dashboard shows active alerts.
    - Critical unacknowledged tickets are listed prominently.
2.  **Acknowledgement:**
    - Click **"Acknowledge"** on the Dashboard widget or the Ticket Detail banner.
    - This stops the alert from flashing and records who acknowledged it.

### Background Jobs
- The SLA Monitor runs automatically every **15 minutes**.
- Ensure the system server is running to process these checks.
