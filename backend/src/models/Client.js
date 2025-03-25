import mongoose from 'mongoose';

// Document subschema to track files uploaded by the client
const documentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalFilename: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  documentType: {
    type: String,
    enum: ['invoice', 'creditorLetter', 'other'],
    default: 'other'
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
});

// Creditor subschema for tracking client creditors
const creditorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    default: 0
  },
  contactInfo: {
    type: String
  },
  notes: {
    type: String
  },
  documentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  verified: {
    type: Boolean,
    default: false
  },
  addedDate: {
    type: Date,
    default: Date.now
  }
});

// Portal access schema
const portalAccessSchema = new mongoose.Schema({
  active: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  accessToken: {
    type: String
  },
  tokenExpiry: {
    type: Date
  },
  creditorSubmitted: {
    type: Boolean,
    default: false
  },
  submissionDate: {
    type: Date
  }
});

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
    // Phase tracking information
    currentPhase: {
      type: Number,
      default: 1, // Start with phase 1 (Erstberatung)
    },
    emailSent: {
      type: Boolean,
      default: false, // Whether invoice/document request emails were sent
    },
    documentsUploaded: {
      type: Boolean,
      default: false, // Whether the client has uploaded documents
    },
    firstPaymentReceived: {
      type: Boolean,
      default: false, // Whether the first payment has been received
    },
    // Phase completion timestamps
    phaseCompletionDates: {
      type: Map,
      of: Date,
      default: () => new Map([['1', new Date()]]) // Phase 1 is always completed by default
    },
    // Cache für Formulardaten
    formDataCache: {
      type: String, // JSON-String der Formulardaten
    },
    formDataCacheTime: {
      type: Number, // Timestamp wann der Cache gesetzt wurde
    },
    // Document storage
    documents: {
      type: [documentSchema],
      default: []
    },
    // Latest invoice document reference
    currentInvoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    },
    // Client portal information
    portal: {
      type: portalAccessSchema,
      default: () => ({
        active: true,
        accessToken: null,
        tokenExpiry: null,
        creditorSubmitted: false
      })
    },
    // Creditors list
    creditors: {
      type: [creditorSchema],
      default: []
    },
    // Payment status tracking
    zahlungStatus: {
      type: String,
      enum: ['Ausstehend', 'Teilweise bezahlt', 'Vollständig bezahlt'],
      default: 'Ausstehend'
    },
    zahlung: {
      totalPaid: {
        type: Number, 
        default: 0
      },
      lastPaymentDate: {
        type: Date
      },
      paymentHistory: [{
        amount: Number,
        date: Date,
        method: String,
        notes: String
      }]
    }
  },
  {
    timestamps: true,
  }
);

const Client = mongoose.model('Client', clientSchema);

export default Client;