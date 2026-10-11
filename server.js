require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');
const ejs = require('ejs');
const User = require('./models/User');
const Item = require('./models/Item');

const app = express();

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory_system', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
  initializeAdminUser();
})
.catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Initialize admin user
async function initializeAdminUser() {
  try {
    const adminExists = await User.findOne({ userId: '000000' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin@123', 10);
      await User.create({
        name: 'System Admin',
        userId: '000000',
        email: 'admin@inventorysystem.com',
        designation: 'System Administrator',
        cadre: 'admin',
        group: 'ADMIN',
        password: hashedPassword,
        role: 'admin',
        status: 'approved',
        employmentType: 'permanent'
      });
      console.log('Default admin user created\nUser ID: 000000\nPassword: admin@123');
    }
  } catch (err) {
    console.error('Error creating admin user:', err);
  }
}

// Middleware
const isAuthenticated = (req, res, next) => {
  if (!req.session.userId) return res.redirect('/login');
  next();
};

const isAdmin = (req, res, next) => {
  if (req.session.role !== 'admin') return res.status(403).send('Access denied');
  next();
};

// Routes
app.get('/', (req, res) => {
  req.session.userId ? res.redirect('/dashboard') : res.redirect('/login');
});

// Authentication routes
app.get('/login', (req, res) => {
  res.render('login', {
    successMessage: req.query.registered ? 'Registration successful! Please wait for admin approval.' : null,
    errorMessage: req.query.error || null
  });
});

app.post('/login', async (req, res) => {
  try {
    const { userId, password, rememberMe } = req.body;
    const user = await User.findOne({ userId });
    
    if (!user) return res.redirect('/login?error=Invalid credentials');
    if (user.status !== 'approved') return res.redirect('/login?error=Your account is pending approval');
    if (!await bcrypt.compare(password, user.password)) return res.redirect('/login?error=Invalid credentials');
    
    // Set session
    req.session.userId = user._id;
    req.session.role = user.role;
    req.session.group = user.group;
    req.session.name = user.name;
    req.session.email = user.email;
    req.session.dob = user.dob;
    req.session.employmentType = user.employmentType;
    
    if (rememberMe) req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
    
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.redirect('/login?error=Server error');
  }
});
// Check if User ID exists
app.get('/check-userid', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId || !/^\d{6}$/.test(userId)) {
      return res.status(400).json({ error: 'Invalid User ID format' });
    }
    
    const exists = await User.exists({ userId });
    res.json({ exists });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error checking User ID' });
  }
});

// Check if email exists
app.get('/check-email', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    const exists = await User.exists({ email });
    res.json({ exists });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error checking email' });
  }
});

// Check if phone exists
app.get('/check-phone', async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone format' });
    }
    
    const exists = await User.exists({ phone });
    res.json({ exists });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error checking phone' });
  }
});

app.get('/register', (req, res) => {
  res.render('register', {
    errorMessage: req.query.error || null,
    successMessage: null
  });
});

app.post('/register', async (req, res) => {
  try {
    const { 
      name, userId, email, password, confirmPassword,
      gender, dob, phone, employmentType, group, cadre, designation 
    } = req.body;
    
    // Validate password match
    if (password !== confirmPassword) {
      return res.status(400).json({ 
        errors: { password: 'Passwords do not match' } 
      });
    }

    // Check for existing user with the same userId, email, or phone
    const existingUser = await User.findOne({ 
      $or: [{ userId }, { email }, { phone }] 
    });

    if (existingUser) {
      const errors = {};
      if (existingUser.userId === userId) errors.userId = 'User ID already exists';
      if (existingUser.email === email) errors.email = 'Email already exists';
      if (existingUser.phone === phone) errors.phone = 'Phone number already exists';
      
      return res.status(400).json({ errors });
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));
    await User.create({
      name, userId, email, password: hashedPassword,
      gender, dob, phone, employmentType, group, cadre, designation,
      role: 'user', status: 'pending'
    });
    
    // Return success response
    res.status(201).json({ 
      success: true,
      message: 'Registration successful! Your account is pending approval.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      error: 'Registration failed',
      message: 'An error occurred during registration. Please try again.'
    });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => err ? res.status(500).send('Error logging out') : res.redirect('/login'));
});

// Dashboard routes
app.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.redirect('/logout');
    
    if (user.role === 'admin') return res.redirect('/admin/dashboard');
    if (user.role === 'inventory_holder') return res.redirect('/inventory/dashboard');
    return res.redirect('/user/dashboard');
  } catch (err) {
    console.error(err);
    res.redirect('/logout');
  }
});

// User dashboard
app.get('/user/dashboard', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const items = await Item.find({
      $or: [
        { custodian: req.session.userId },
        { issuedTo: req.session.userId }
      ],
      status: { $in: ['assigned', 'issued'] }
    }).populate('custodian', 'name').populate('issuedTo', 'name');
    
    res.render('user', { user, items });
  } catch (err) {
    console.error(err);
    res.redirect('/logout');
  }
});

// Inventory holder dashboard - UPDATED TO SHOW ALL ITEMS
app.get('/inventory/dashboard', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.redirect('/logout');

    // Get all items in the group (both assigned and unassigned)
    const items = await Item.find({ 
      group: req.session.group,
      status: { $in: ['available', 'assigned'] }
    })
    .populate('custodian', 'name designation')
    .populate('issuedTo', 'name designation');

    const groupUsers = await User.find({ 
      group: req.session.group,
      status: 'approved'
    });

    res.render('inventoryholder', {
      user: {
        _id: req.session.userId,
        name: req.session.name,
        email: user.email,
        dob: user.dob,
        employmentType: user.employmentType,
        group: req.session.group,
        role: req.session.role,
        designation: user.designation
      },
      availableItems: items,  // All active items
      deletedItems: await Item.find({ 
        group: req.session.group,
        status: 'deleted'
      }).populate('custodian', 'name'),
      condemnedItems: await Item.find({ 
        group: req.session.group,
        status: 'condemned'
      }).populate('custodian', 'name'),
      groupUsers
    });
  } catch (err) {
    console.error(err);
    res.redirect('/logout');
  }
});

// Admin dashboard
app.get('/admin/dashboard', isAdmin, async (req, res) => {
  try {
    const [pendingUsers, approvedUsers, items] = await Promise.all([
      User.find({ status: 'pending' }),
      User.find({ status: 'approved' }),
      Item.find().populate('custodian', 'name').populate('issuedTo', 'name')
    ]);
    
    res.render('admin', {
      user: {
        _id: req.session.userId,
        name: req.session.name,
        role: req.session.role,
        designation: 'System Administrator',
        email: req.session.email,
        dob: req.session.dob,
        employmentType: req.session.employmentType
      },
      pendingUsers,
      approvedUsers,
      items
    });
  } catch (err) {
    console.error(err);
    res.redirect('/logout');
  }
});

// Admin user management
app.get('/admin/user-details/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.json(user || { error: 'User not found' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/admin/update-user-status/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json(user ? { success: true } : { error: 'User not found' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/admin/update-user-role/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true }
    );
    res.json(user ? { success: true } : { error: 'User not found' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/admin/delete-user/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    res.json(user ? { success: true } : { error: 'User not found' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Profile routes
app.post('/update-profile', isAuthenticated, async (req, res) => {
  try {
    const { designation, currentPassword, newPassword, confirmPassword } = req.body;
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.designation = designation;
    
    if (newPassword) {
      if (newPassword !== confirmPassword) return res.status(400).json({ error: 'New passwords do not match' });
      if (!await bcrypt.compare(currentPassword, user.password)) return res.status(400).json({ error: 'Current password is incorrect' });
      user.password = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
    }
    
    await user.save();
    req.session.designation = user.designation;
    
    res.json({ 
      success: true,
      user: {
        designation: user.designation,
        email: user.email,
        dob: user.dob,
        employmentType: user.employmentType
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Inventory routes - UPDATED FOR BETTER ITEM MANAGEMENT
app.post('/inventory/add-item', isAuthenticated, async (req, res) => {
  try {
    const { ledgerNo, itemName, quantity, unit, procurementDate, custodian } = req.body;
    
    if (!/^[A-Za-z0-9]+$/.test(ledgerNo)) return res.status(400).json({ error: 'Ledger number must be alphanumeric' });
    if (!/^[A-Za-z\s]+$/.test(itemName)) return res.status(400).json({ error: 'Item name must contain only letters and spaces' });
    if (await Item.findOne({ ledgerNo })) return res.status(400).json({ error: 'Ledger number already exists' });
    
    const item = await Item.create({
      ledgerNo,
      itemName,
      quantity,
      unit,
      procurementDate,
      group: req.session.group,
      custodian: custodian || req.session.userId,
      status: custodian ? 'assigned' : 'available'
    });
    
    res.json({ success: true, item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/inventory/get-item/:id', isAuthenticated, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('custodian', 'name designation');
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.custodian && item.custodian._id.toString() !== req.session.userId && req.session.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/inventory/update-item/:id', isAuthenticated, async (req, res) => {
  try {
    const { ledgerNo, itemName, quantity, unit, procurementDate, custodian } = req.body;
    
    if (ledgerNo && !/^[A-Za-z0-9]+$/.test(ledgerNo)) return res.status(400).json({ error: 'Ledger number must be alphanumeric' });
    if (itemName && !/^[A-Za-z\s]+$/.test(itemName)) return res.status(400).json({ error: 'Item name must contain only letters and spaces' });
    if (ledgerNo && await Item.findOne({ ledgerNo, _id: { $ne: req.params.id } })) {
      return res.status(400).json({ error: 'Ledger number already exists' });
    }
    
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      {
        ledgerNo,
        itemName,
        quantity,
        unit,
        procurementDate,
        custodian: custodian || req.session.userId,
        status: custodian ? 'assigned' : 'available'
      },
      { new: true }
    ).populate('custodian', 'name');
    
    res.json(item ? { success: true, item } : { error: 'Item not found' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// UPDATED TO RETURN FULL ITEM DATA AFTER ASSIGNMENT
app.post('/inventory/assign-custodian/:id', isAuthenticated, async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      {
        custodian: req.body.custodian,
        assignedDate: new Date(),
        status: 'assigned'
      },
      { new: true }
    ).populate('custodian', 'name designation');
    
    res.json(item ? { success: true, item } : { error: 'Item not found' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/inventory/condemn-items', isAuthenticated, async (req, res) => {
  try {
    const { itemIds } = req.body;
    if (!itemIds || !Array.isArray(itemIds)) return res.status(400).json({ error: 'Invalid item IDs' });
    
    await Item.updateMany(
      { _id: { $in: itemIds }, custodian: req.session.userId },
      {
        status: 'condemned',
        condemnedAt: new Date(),
        issuedTo: null
      }
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/inventory/delete-item/:id', isAuthenticated, async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      {
        status: 'deleted',
        deletedAt: new Date(),
        issuedTo: null
      },
      { new: true }
    );
    
    res.json(item ? { success: true } : { error: 'Item not found' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin system settings
app.get('/admin/system-settings', isAdmin, async (req, res) => {
  res.json({
    userRegistration: 'enabled',
    defaultUserRole: 'user',
    itemExpiryNotification: 'enabled',
    expiryWarningDays: 30,
    passwordPolicy: 'standard',
    loginAttempts: 5
  });
});

app.post('/admin/save-settings', isAdmin, (req, res) => {
  console.log(`Saved ${req.body.type} settings:`, req.body.settings);
  res.json({ success: true });
});

// Error handling
app.use((req, res) => res.status(404).send('Page Not Found'));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Internal Server Error');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}\nAdmin credentials:\nUser ID: 000000\nPassword: admin@123`);
});