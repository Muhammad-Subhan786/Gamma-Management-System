const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Employee = require('../models/Employee');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/profiles';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const employee = await Employee.findById(decoded.employeeId);
    
    if (!employee || !employee.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive employee' });
    }
    
    req.employee = employee;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Middleware to check admin
const requireAdmin = (req, res, next) => {
  if (req.employee && req.employee.role === 'admin') return next();
  return res.status(403).json({ error: 'Admin access required' });
};

// Employee login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find employee by email
    const employee = await Employee.findOne({ email: email.toLowerCase() });

    if (!employee) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!employee.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, employee.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { employeeId: employee._id, email: employee.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return employee data (without password) and token
    const employeeData = {
      _id: employee._id,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      cnic: employee.cnic,
      dob: employee.dob,
      address: employee.address,
      bankAccount: employee.bankAccount,
      role: employee.role,
      profilePicture: employee.profilePicture,
      department: employee.department,
      position: employee.position,
      hireDate: employee.hireDate,
      salary: employee.salary,
      allowedSessions: employee.allowedSessions || []
    };

    res.json({
      success: true,
      message: 'Login successful',
      token,
      employee: employeeData
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get employee profile (authenticated)
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const employee = req.employee;
    
    // Return employee data without password
    const employeeData = {
      _id: employee._id,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      cnic: employee.cnic,
      dob: employee.dob,
      address: employee.address,
      bankAccount: employee.bankAccount,
      role: employee.role,
      profilePicture: employee.profilePicture,
      department: employee.department,
      position: employee.position,
      hireDate: employee.hireDate,
      salary: employee.salary,
      allowedSessions: employee.allowedSessions || []
    };

    res.json(employeeData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update employee profile (authenticated)
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const employee = req.employee;
    const updateData = req.body;

    // Fields that employees can update
    const allowedFields = ['name', 'phone', 'address', 'bankAccount'];
    const updates = {};

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field];
      }
    });

    const updatedEmployee = await Employee.findByIdAndUpdate(
      employee._id,
      updates,
      { new: true, runValidators: true }
    );

    // Return updated employee data without password
    const employeeData = {
      _id: updatedEmployee._id,
      name: updatedEmployee.name,
      email: updatedEmployee.email,
      phone: updatedEmployee.phone,
      cnic: updatedEmployee.cnic,
      dob: updatedEmployee.dob,
      address: updatedEmployee.address,
      bankAccount: updatedEmployee.bankAccount,
      role: updatedEmployee.role,
      profilePicture: updatedEmployee.profilePicture,
      department: updatedEmployee.department,
      position: updatedEmployee.position,
      hireDate: updatedEmployee.hireDate,
      salary: updatedEmployee.salary
    };

    res.json({
      success: true,
      message: 'Profile updated successfully',
      employee: employeeData
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change password (authenticated)
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const employee = req.employee;

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, employee.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await Employee.findByIdAndUpdate(employee._id, { password: hashedPassword });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload profile picture (authenticated)
router.post('/upload-profile-picture', authenticateToken, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const employee = req.employee;

    // Delete old profile picture if exists
    if (employee.profilePicture && employee.profilePicture !== '') {
      const oldPicturePath = path.join(__dirname, '..', employee.profilePicture);
      if (fs.existsSync(oldPicturePath)) {
        fs.unlinkSync(oldPicturePath);
      }
    }

    // Update employee with new profile picture path
    const profilePicturePath = req.file.path.replace(/\\/g, '/'); // Normalize path for cross-platform
    await Employee.findByIdAndUpdate(employee._id, { profilePicture: profilePicturePath });

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      profilePicture: profilePicturePath
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get profile picture
router.get('/profile-picture/:employeeId', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.employeeId);
    
    if (!employee || !employee.profilePicture) {
      return res.status(404).json({ error: 'Profile picture not found' });
    }

    const picturePath = path.join(__dirname, '..', employee.profilePicture);
    
    if (!fs.existsSync(picturePath)) {
      return res.status(404).json({ error: 'Profile picture file not found' });
    }

    res.sendFile(picturePath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all employees (admin only)
router.get('/', async (req, res) => {
  try {
    console.log('👥 Fetching all employees...');
    const employees = await Employee.find({ isActive: true })
      .select('-password')
      .sort({ name: 1 });
    
    console.log(`✅ Found ${employees.length} active employees`);
    res.json(employees);
  } catch (error) {
    console.error('❌ Error fetching employees:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch employees',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get employee by Mongo _id
router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id, '-password');
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    // Add employeeId to response
    const employeeResponse = employee.toObject();
    delete employeeResponse.password;
    res.json(employeeResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get employee by business employeeId
router.get('/by-employee-id/:employeeId', async (req, res) => {
  try {
    const employee = await Employee.findOne({ employeeId: req.params.employeeId }, '-password');
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    const employeeResponse = employee.toObject();
    delete employeeResponse.password;
    res.json(employeeResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new employee
router.post('/', async (req, res) => {
  try {
    const employeeData = req.body;
    
    // Require employeeId
    if (!employeeData.employeeId) {
      return res.status(400).json({ error: 'Employee ID is required' });
    }
    // Hash password if provided, otherwise use default
    if (employeeData.password) {
      employeeData.password = await bcrypt.hash(employeeData.password, 10);
    } else {
      employeeData.password = await bcrypt.hash('password123', 10);
    }

    const employee = new Employee(employeeData);
    await employee.save();

    // Return employee data without password
    const employeeResponse = employee.toObject();
    delete employeeResponse.password;

    res.status(201).json(employeeResponse);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email, CNIC, or Employee ID already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update employee
router.put('/:id', async (req, res) => {
  try {
    // Prevent employeeId from being updated
    if (req.body.employeeId) {
      delete req.body.employeeId;
    }
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    // Return employee data without password
    const employeeResponse = employee.toObject();
    delete employeeResponse.password;
    res.json(employeeResponse);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email or CNIC already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete employee
router.delete('/:id', async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search employees by name, email, or employeeId
router.get('/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    const employees = await Employee.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { employeeId: { $regex: query, $options: 'i' } }
      ]
    });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get salary breakdown for employee (authenticated)
router.get('/profile/salary-breakdown', authenticateToken, async (req, res) => {
  try {
    const employee = req.employee;
    const basicSalary = employee.salary || 0;
    const bonuses = employee.bonuses || [];
    const totalBonuses = bonuses.reduce((sum, b) => sum + b.amount, 0);
    const totalSalary = basicSalary + totalBonuses;
    res.json({ basicSalary, bonuses, totalSalary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 