const mongoose = require('mongoose');

// server.js aun registra el modelo activo en runtime. Este archivo se mantiene
// alineado para una extraccion gradual sin divergencias de schema.
const ConductorSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  documento: { type: String, required: true },
  telefono: String,
  categoria: String,
  fechaVencimiento: { type: String, required: true },
  ownerEmail: { type: String, required: true },
});

ConductorSchema.index({ ownerEmail: 1, documento: 1 }, { unique: true });

module.exports = mongoose.model('Conductor', ConductorSchema);
