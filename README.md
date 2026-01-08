# SIGAP-IT - Sistem Informasi Gangguan & Penanganan IT

IT Support Ticketing System built with Meteor, React, MongoDB, and TailwindCSS.

## Features (Phase 1)

✅ **User Management**
- Role-based access control (User, IT Support, Admin)
- User authentication and authorization
- User profile management

✅ **Ticket Management**
- Create tickets with auto-generated ticket numbers
- Duplicate ticket detection
- Ticket listing and viewing
- Status tracking (Open, In Progress, Pending, Resolved, Closed, Rejected)
- Priority levels (Low, Medium, High, Critical)
- Categories (Hardware, Software, Network, Email, Printer, Other)

✅ **Self-Assignment Workflow**
- IT Support can pick up open tickets
- Automatic status change to "In Progress"
- Active ticket limit enforcement

✅ **Worklog System**
- Mandatory worklogs for status changes
- Complete activity history

✅ **SLA Configuration**
- Multi-level SLA based on priority
- Configurable response and resolution times

✅ **Audit Logging**
- Complete activity tracking
- Login/logout monitoring

## Tech Stack

- **Frontend**: React 18 with React Router
- **Backend**: Meteor 3.3.2
- **Database**: MongoDB
- **Styling**: TailwindCSS 3.x
- **Authentication**: Meteor Accounts
- **Authorization**: alanning:roles

## Installation

1. Install Meteor:
   ```bash
   # Windows
   choco install meteor
   
   # macOS/Linux
   curl https://install.meteor.com/ | sh
   ```

2. Install dependencies:
   ```bash
   cd SIGAP-IT2
   meteor npm install
   ```

3. Start the development server:
   ```bash
   meteor
   ```

4. Open your browser to `http://localhost:3000`

## Default Credentials

**Admin Account:**
- Email: `admin@sigap-it.com`
- Password: `admin123`

⚠️ **Important**: Change the default password after first login!

## Project Structure

```
SIGAP-IT2/
├── client/                 # Client-side entry point
│   ├── main.html
│   ├── main.jsx
│   └── main.css           # TailwindCSS configuration
├── server/                 # Server-side entry point
│   └── main.js            # Server initialization
├── imports/
│   ├── api/               # Meteor collections, methods, and publications
│   │   ├── tickets/
│   │   ├── worklogs/
│   │   ├── comments/
│   │   ├── sla-configs/
│   │   ├── audit-logs/
│   │   └── users/
│   └── ui/                # React components
│       ├── layouts/       # Layout components
│       ├── pages/         # Page components
│       └── App.jsx        # Main App component with routing
├── tailwind.config.js     # TailwindCSS configuration
├── postcss.config.js      # PostCSS configuration
└── package.json
```

## Usage

### Creating a Ticket

1. Login with your credentials
2. Click "Create New Ticket" from the dashboard
3. Fill in the required information:
   - Title
   - Description
   - Category
   - Priority
   - Location/Department
4. Submit the form
5. System will check for duplicates and generate a unique ticket number

### IT Support Workflow

1. Login as IT Support or Admin
2. View "Open Tickets" from the navigation
3. Click "Assign to Self" on any open ticket
4. Ticket status automatically changes to "In Progress"
5. Work on the ticket and add comments
6. Change status with mandatory worklog notes
7. Mark as "Resolved" when complete

### Admin Functions

- Manage users (create, update, deactivate)
- View all tickets across the system
- Configure SLA settings
- Access audit logs
- Generate reports (coming in Phase 2)

## Development

### Running Tests
```bash
meteor test --driver-package meteortesting:mocha
```

### Building for Production
```bash
meteor build ../build --directory
```

## Roadmap

### Phase 2 (Planned)
- File attachments for tickets
- Parent-child ticket relationships
- Advanced SLA monitoring and escalation
- Email notifications
- Pending workflow with timeouts

### Phase 3 (Planned)
- Knowledge base
- Advanced reporting and analytics
- Export to PDF/Excel
- Dashboard charts and graphs
- Rating and feedback system

## License

Proprietary - Internal Use Only

## Support

For issues or questions, please contact the IT Department.
