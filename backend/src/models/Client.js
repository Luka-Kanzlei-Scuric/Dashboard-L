import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    clickupId: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      default: 'Onboarding',
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    // Honorar-Informationen
    honorar: {
      type: Number,
      default: 1111,
    },
    raten: {
      type: Number,
      default: 2,
    },
    ratenStart: {
      type: String,
      default: "01.01.2025",
    },
    monatlicheRate: {
      type: Number,
    },
    caseNumber: {
      type: String,
      default: "",
    },
    // Cache für Formulardaten
    formDataCache: {
      type: String, // JSON-String der Formulardaten
    },
    formDataCacheTime: {
      type: Number, // Timestamp wann der Cache gesetzt wurde
    }
  },
  {
    timestamps: true,
  }
);

const Client = mongoose.model('Client', clientSchema);

export default Client;