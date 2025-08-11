const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userId: { 
    type: String, 
    required: true, 
    unique: true,
    validate: {
      validator: function(v) {
        return /^\d{6}$/.test(v);
      },
      message: props => `${props.value} is not a valid 6-digit user ID!`
    }
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} is not a valid email!`
    }
  },
  designation: { type: String, required: true },
  cadre: {
    type: String,
    required: true,
    enum: ['drds', 'drtc', 'admin']
  },
  group: { 
    type: String, 
    required: true,
    enum: ['DIR SECT', 'FSEG', 'IT', 'QRS', 'PCM', 'PSEG', 'MMG', 'ADMIN', 
           'FINANCE', 'MT', 'SECURITY', 'TFA', 'CAL', 'SARC', 'ESRG', 'FC&HB']
  },
  password: { type: String, required: true },
  dob: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  phone: { 
    type: String,
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid 10-digit phone number!`
    }
  },
  employmentType: { type: String, enum: ['permanent', 'temporary'], required: true },
  role: {
    type: String,
    enum: ['user', 'inventory_holder', 'admin'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model("User", userSchema);