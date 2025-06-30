# Project Structure

```
employee-attendance-system/
├── 📁 client/                          # React Frontend
│   ├── 📁 public/
│   │   ├── index.html                  # Main HTML file
│   │   └── manifest.json               # PWA manifest
│   ├── 📁 src/
│   │   ├── 📁 components/
│   │   │   ├── CheckInPage.js          # Public check-in interface
│   │   │   └── AdminPortal.js          # Admin dashboard
│   │   ├── 📁 services/
│   │   │   └── api.js                  # API service functions
│   │   ├── App.js                      # Main React component
│   │   ├── index.js                    # React entry point
│   │   └── index.css                   # Tailwind CSS styles
│   ├── package.json                    # Frontend dependencies
│   ├── tailwind.config.js              # Tailwind configuration
│   └── postcss.config.js               # PostCSS configuration
│
├── 📁 server/                          # Node.js Backend
│   ├── 📁 models/
│   │   ├── Employee.js                 # Employee data model
│   │   └── Attendance.js               # Attendance data model
│   ├── 📁 routes/
│   │   ├── employees.js                # Employee CRUD routes
│   │   ├── attendance.js               # Attendance routes
│   │   └── analytics.js                # Analytics routes
│   ├── 📁 scripts/
│   │   └── seedData.js                 # Database seeding script
│   ├── index.js                        # Express server entry point
│   ├── package.json                    # Backend dependencies
│   └── env.example                     # Environment variables template
│
├── package.json                        # Root package.json
├── README.md                           # Project documentation
├── DEPLOYMENT.md                       # Deployment guide
├── PROJECT_STRUCTURE.md                # This file
├── setup.sh                           # Linux/Mac setup script
├── setup.bat                          # Windows setup script
└── .gitignore                         # Git ignore rules
```

## 📋 File Descriptions

### Frontend (client/)

#### Core Files
- **`App.js`**: Main React component with routing
- **`index.js`**: React application entry point
- **`index.css`**: Global styles with Tailwind CSS

#### Components
- **`CheckInPage.js`**: Public check-in/out interface
  - Real-time clock display
  - Check-in/out forms
  - Custom modal notifications
  - Late detection alerts
  - Mobile responsive design

- **`AdminPortal.js`**: Admin dashboard and employee management
  - Dashboard analytics with charts
  - Employee CRUD operations
  - Search functionality
  - Performance metrics

#### Services
- **`api.js`**: API service functions
  - Employee management API calls
  - Attendance API calls
  - Analytics API calls
  - Error handling

#### Configuration
- **`tailwind.config.js`**: Tailwind CSS configuration
- **`postcss.config.js`**: PostCSS processing
- **`package.json`**: Frontend dependencies

### Backend (server/)

#### Core Files
- **`index.js`**: Express server setup
  - MongoDB connection
  - Middleware configuration
  - Route registration
  - Error handling

#### Models
- **`Employee.js`**: Employee data schema
  - Personal information fields
  - Contact details
  - Role and employment data
  - Database indexes

- **`Attendance.js`**: Attendance tracking schema
  - Check-in/out timestamps
  - Hours calculation
  - Late detection flags
  - Performance metrics

#### Routes
- **`employees.js`**: Employee management endpoints
  - GET /api/employees - List all employees
  - POST /api/employees - Create employee
  - PUT /api/employees/:id - Update employee
  - DELETE /api/employees/:id - Delete employee
  - GET /api/employees/search/:query - Search employees

- **`attendance.js`**: Attendance tracking endpoints
  - POST /api/attendance/checkin - Employee check-in
  - POST /api/attendance/checkout - Employee check-out
  - GET /api/attendance/status/:id - Get attendance status
  - GET /api/attendance/history/:id - Get attendance history

- **`analytics.js`**: Analytics and reporting endpoints
  - GET /api/analytics/total-hours - Hours per employee
  - GET /api/analytics/top-punctual - Top punctual employees
  - GET /api/analytics/top-hardworking - Top hardworking employees
  - GET /api/analytics/summary - Dashboard summary
  - GET /api/analytics/trends - Attendance trends

#### Scripts
- **`seedData.js`**: Database seeding script
  - Sample employee data
  - Database initialization
  - Development setup helper

#### Configuration
- **`package.json`**: Backend dependencies
- **`env.example`**: Environment variables template

### Root Files

#### Documentation
- **`README.md`**: Comprehensive project documentation
- **`DEPLOYMENT.md`**: Detailed deployment instructions
- **`PROJECT_STRUCTURE.md`**: This file

#### Setup Scripts
- **`setup.sh`**: Linux/Mac automated setup
- **`setup.bat`**: Windows automated setup

#### Configuration
- **`package.json`**: Root package.json with scripts
- **`.gitignore`**: Git ignore patterns

## 🔧 Key Features by File

### Check-In System
- **CheckInPage.js**: Main check-in interface
- **attendance.js**: Check-in/out API endpoints
- **Attendance.js**: Attendance data model

### Admin Dashboard
- **AdminPortal.js**: Admin interface
- **analytics.js**: Analytics API endpoints
- **employees.js**: Employee management API

### Database
- **Employee.js**: Employee data structure
- **Attendance.js**: Attendance tracking
- **seedData.js**: Sample data population

### Styling
- **index.css**: Global styles
- **tailwind.config.js**: Design system configuration
- **CheckInPage.js**: Responsive UI components
- **AdminPortal.js**: Dashboard styling

## 🚀 Development Workflow

1. **Setup**: Run `setup.sh` or `setup.bat`
2. **Database**: Configure MongoDB connection
3. **Seed Data**: Run `npm run seed` in server directory
4. **Development**: Run `npm run dev` for both frontend and backend
5. **Testing**: Access frontend at http://localhost:3000
6. **API Testing**: Backend available at http://localhost:5000

## 📱 Mobile Responsiveness

All components are built with mobile-first design:
- **CheckInPage.js**: Touch-friendly check-in interface
- **AdminPortal.js**: Responsive dashboard and tables
- **Tailwind CSS**: Mobile-first utility classes

## 🔒 Security Features

- **CORS**: Configured in server/index.js
- **Helmet**: Security headers in server/index.js
- **Input Validation**: Server-side validation in routes
- **Error Handling**: Comprehensive error management

## 📊 Analytics & Charts

- **Recharts**: Used in AdminPortal.js
- **Analytics API**: Real-time data aggregation
- **Performance Metrics**: Automatic calculation
- **Visual Dashboards**: Bar charts, pie charts, tables

---

This structure provides a clean separation of concerns, making the codebase maintainable and scalable. 