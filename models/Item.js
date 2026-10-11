const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  ledgerNo: { type: String, required: true, unique: true },
  itemName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  unit: { 
    type: String, 
    required: true,
    enum: ['kg', 'dozen', 'packet', 'box', 'piece', 'pairs']
  },
  procurementDate: { type: Date, required: true },
  group: { 
    type: String, 
    required: true,
    enum: ['DIR SECT', 'FSEG', 'IT', 'QRS', 'PCM', 'PSEG', 'MMG', 'ADMIN', 
           'FINANCE', 'MT', 'SECURITY', 'TFA', 'CAL', 'SARC', 'ESRG', 'FC&HB']
  },
  custodian: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  issuedTo: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  issuedDate: { type: Date },
  status: {
    type: String,
    enum: ['available', 'issued', 'deleted', 'condemned'],
    default: 'available'
  },
  deletedAt: { type: Date },
  condemnedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Item", itemSchema);