# Employee Attendance & Admin Management System

A full-stack web application for managing employee attendance with biometric-style check-in/out functionality and comprehensive admin analytics.

## Features

### Public Check-in Page
- **Biometric-style Interface**: Clean, modern UI for employee check-ins
- **Multiple Check-ins**: Support for multiple check-ins and check-outs per day
- **Late Detection**: Automatic detection of late arrivals (after 6:20 PM)
- **Real-time Display**: Live clock and today's check-in list
- **Time to Go**: End shift functionality to prevent further check-ins/outs
- **Mobile Responsive**: Works perfectly on all devices

### Admin Portal
- **Employee Management**: Full CRUD operations for employees
- **Attendance Analytics**: Comprehensive charts and statistics
- **Performance Tracking**: Top punctual and hardworking employees
- **Shift Management**: Control shift status and end shifts
- **Real-time Dashboard**: Live attendance data and trends

### Technical Features
- **MongoDB Integration**: Robust data storage with Mongoose ODM
- **RESTful API**: Clean, documented API endpoints
- **Real-time Updates**: Live data synchronization
- **Responsive Design**: Tailwind CSS for beautiful, mobile-first UI
- **Chart Visualizations**: Recharts for data visualization

## New "Time to Go" Feature

The system now includes a "Time to Go" feature that allows ending the shift for all employees:

### How it Works
1. **Shift Status**: The system tracks whether the shift is active or ended
2. **Time to Go Button**: Available on both public check-in page and admin portal
3. **Shift End**: When activated, it prevents any further check-ins or check-outs for that day
4. **Visual Indicators**: Clear status display showing if shift is active or ended

### Usage
- **Public Page**: Employees can see shift status and admins can end the shift
- **Admin Portal**: Admins have full control over shift management
- **Confirmation**: Requires confirmation before ending shift
- **Irreversible**: Once ended, the shift cannot be reactivated for that day

## Shift Management System

The system now includes comprehensive shift management with both individual and overall control:

### Individual Employee Shift Management
- **Employee Control**: Employees can end their own individual shift
- **Personal Status**: Each employee has their own shift status
- **Independent Operation**: One employee ending their shift doesn't affect others
- **Check-in Blocking**: Individual employees cannot check in/out after their shift ends

### Overall Shift Management (Admin Only)
- **Admin Control**: Only admins can start/end overall shifts
- **Global Impact**: Affects all employees simultaneously
- **Start Shift**: Creates attendance records and enables check-ins for all
- **Time to Go**: Ends shift for all employees at once

### How it Works
1. **Individual Status Tracking**: Each employee's shift status is tracked separately
2. **Overall Status Tracking**: System-wide shift status for admin control
3. **Employee "End My Shift"**: Available on check-in page for individual employees
4. **Admin "Time to Go"**: Available on admin portal for overall shift end
5. **Smart Validation**: Check-ins blocked by both individual and overall status

### Usage Flow
1. **Admin starts overall shift**: Enables check-ins for all employees
2. **Employees check in/out**: Normal attendance tracking
3. **Individual employee ends shift**: Only that employee is blocked
4. **Other employees continue**: Can still check in/out normally
5. **Admin ends overall shift**: All remaining employees are blocked

### Access Control
- **Public Page**: 
  - Shows overall shift status
  - Shows individual employee status when name/email entered
  - Employees can end their own shift
  - Admins can start overall shift
- **Admin Portal**: Full overall shift management capabilities
- **Employee View**: Can see both statuses but only control their own

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd employee-attendance-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up MongoDB**
   - Install MongoDB locally, or
   - Use MongoDB Atlas (cloud service)

4. **Configure environment**
   - Copy `.env.example` to `.env` in the server directory
   - Update MongoDB connection string

5. **Seed the database** (optional)
   ```bash
   cd server
   npm run seed
   ```

6. **Start the application**
   ```bash
   npm run dev
   ```

### Access the Application
- **Public Check-in**: http://localhost:3000
- **Admin Portal**: http://localhost:3000/admin
- **Admin Login**: admin / admin123

## API Endpoints

### Attendance
- `POST /api/attendance/checkin` - Employee check-in
- `POST /api/attendance/checkout` - Employee check-out
- `POST /api/attendance/time-to-go` - End overall shift for all employees (Admin)
- `POST /api/attendance/employee-time-to-go` - End individual employee shift
- `POST /api/attendance/start-shift` - Start/reopen overall shift for all employees
- `GET /api/attendance/shift-status` - Get overall shift status
- `GET /api/attendance/employee-shift-status` - Get individual employee shift status
- `GET /api/attendance/today-checkins` - Get today's check-ins
- `GET /api/attendance/history/:employeeId` - Get employee attendance history

### Employees
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Analytics
- `GET /api/analytics/summary` - Get summary statistics
- `GET /api/analytics/total-hours` - Get total hours per employee
- `GET /api/analytics/top-punctual` - Get most punctual employees
- `GET /api/analytics/top-hardworking` - Get hardest working employees

## Database Schema

### Employee Model
```javascript
{
  name: String,
  email: String,
  phone: String,
  cnic: String,
  dob: Date,
  address: String,
  bankAccount: String,
  role: String
}
```

### Attendance Model
```javascript
{
  employeeId: ObjectId,
  date: Date,
  checkIns: [Date],
  checkOuts: [Date],
  totalHours: Number,
  wasLate: Boolean,
  wasAbsentYesterday: Boolean,
  shiftEnded: Boolean,
  shiftEndTime: Date
}
```

## Deployment

### Easy Deployment Options

#### Frontend (Vercel)
1. Push code to GitHub
2. Connect repository to Vercel
3. Deploy automatically

#### Backend (Railway)
1. Connect GitHub repository to Railway
2. Set environment variables
3. Deploy automatically

#### Database (MongoDB Atlas)
1. Create free cluster
2. Get connection string
3. Update environment variables

### Environment Variables
```env
MONGODB_URI=mongodb://localhost:27017/employee-attendance
PORT=5000
NODE_ENV=development
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue on GitHub. 