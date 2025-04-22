import mongoose from 'mongoose';

/**
 * SystemConfig Schema
 * 
 * Central configuration store for PowerDialer settings and parameters
 * Used for system-wide settings and integration configurations
 */
const systemConfigSchema = new mongoose.Schema({
  // Config key for identification
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Config name for display
  name: {
    type: String,
    required: true
  },
  
  // Config description
  description: {
    type: String
  },
  
  // Config value (can be of various types)
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // Config type for validation and UI rendering
  valueType: {
    type: String,
    enum: ['string', 'number', 'boolean', 'json', 'array'],
    default: 'string'
  },
  
  // Category for grouping configs
  category: {
    type: String,
    enum: ['general', 'aircall', 'dialer', 'notifications', 'scheduling', 'security'],
    default: 'general',
    index: true
  },
  
  // Whether this config is user-editable
  editable: {
    type: Boolean,
    default: true
  },
  
  // Advanced options
  options: {
    // For enum/select types
    possibleValues: [mongoose.Schema.Types.Mixed],
    
    // Validation options
    min: Number,
    max: Number,
    pattern: String,
    
    // UI display options
    uiWidget: {
      type: String,
      enum: ['text', 'textarea', 'select', 'toggle', 'datetime', 'json-editor'],
      default: 'text'
    }
  }
}, {
  timestamps: true
});

// Create initial system configs if none exist
systemConfigSchema.statics.ensureDefaultConfigs = async function() {
  const defaults = [
    // General settings
    {
      key: 'system.name',
      name: 'System Name',
      description: 'Name of the PowerDialer system',
      value: 'PowerDialer',
      valueType: 'string',
      category: 'general'
    },
    
    // Dialer settings
    {
      key: 'dialer.callRateLimit',
      name: 'Call Rate Limit',
      description: 'Maximum number of calls per minute per agent',
      value: 6,
      valueType: 'number',
      category: 'dialer',
      options: {
        min: 1,
        max: 20
      }
    },
    {
      key: 'dialer.retryDelay',
      name: 'Retry Delay',
      description: 'Delay in minutes before retrying a failed call',
      value: 60,
      valueType: 'number',
      category: 'dialer',
      options: {
        min: 5,
        max: 1440
      }
    },
    {
      key: 'dialer.maxRetries',
      name: 'Maximum Retries',
      description: 'Maximum number of retry attempts for failed calls',
      value: 3,
      valueType: 'number',
      category: 'dialer',
      options: {
        min: 0,
        max: 10
      }
    },
    
    // Aircall settings
    {
      key: 'aircall.apiKey',
      name: 'Aircall API Key',
      description: 'API Key for Aircall integration',
      value: '',
      valueType: 'string',
      category: 'aircall',
      options: {
        uiWidget: 'text'
      }
    },
    {
      key: 'aircall.apiSecret',
      name: 'Aircall API Secret',
      description: 'API Secret for Aircall integration',
      value: '',
      valueType: 'string',
      category: 'aircall',
      options: {
        uiWidget: 'text'
      }
    },
    {
      key: 'aircall.defaultNumberId',
      name: 'Default Aircall Number ID',
      description: 'Default number ID to use for outbound calls',
      value: '',
      valueType: 'string',
      category: 'aircall'
    },
    
    // Scheduling settings
    {
      key: 'scheduling.businessHoursStart',
      name: 'Business Hours Start',
      description: 'Start time for business hours (24-hour format, e.g. 09:00)',
      value: '09:00',
      valueType: 'string',
      category: 'scheduling'
    },
    {
      key: 'scheduling.businessHoursEnd',
      name: 'Business Hours End',
      description: 'End time for business hours (24-hour format, e.g. 17:00)',
      value: '17:00',
      valueType: 'string',
      category: 'scheduling'
    },
    {
      key: 'scheduling.businessDays',
      name: 'Business Days',
      description: 'Days of the week when calls can be made (0=Sunday, 6=Saturday)',
      value: [1, 2, 3, 4, 5], // Monday to Friday
      valueType: 'array',
      category: 'scheduling'
    },
    
    // Notification settings
    {
      key: 'notifications.emailEnabled',
      name: 'Email Notifications',
      description: 'Enable email notifications for important events',
      value: true,
      valueType: 'boolean',
      category: 'notifications',
      options: {
        uiWidget: 'toggle'
      }
    }
  ];
  
  for (const config of defaults) {
    await this.findOneAndUpdate(
      { key: config.key },
      config,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
};

// Get config value by key
systemConfigSchema.statics.getConfigValue = async function(key, defaultValue = null) {
  const config = await this.findOne({ key });
  return config ? config.value : defaultValue;
};

// Get all configs by category
systemConfigSchema.statics.getConfigsByCategory = function(category) {
  return this.find({ category })
    .sort('name')
    .exec();
};

// Update config value by key
systemConfigSchema.statics.updateConfigValue = async function(key, value) {
  const config = await this.findOne({ key });
  
  if (!config) {
    throw new Error(`Config key "${key}" not found`);
  }
  
  if (!config.editable) {
    throw new Error(`Config "${key}" is not editable`);
  }
  
  // Type validation
  if (config.valueType === 'number' && typeof value !== 'number') {
    value = Number(value);
    if (isNaN(value)) {
      throw new Error(`Value for "${key}" must be a number`);
    }
  } else if (config.valueType === 'boolean' && typeof value !== 'boolean') {
    value = String(value).toLowerCase() === 'true';
  }
  
  // Range validation for numbers
  if (config.valueType === 'number' && config.options) {
    if (config.options.min !== undefined && value < config.options.min) {
      throw new Error(`Value for "${key}" must be at least ${config.options.min}`);
    }
    if (config.options.max !== undefined && value > config.options.max) {
      throw new Error(`Value for "${key}" must be at most ${config.options.max}`);
    }
  }
  
  // Enum validation
  if (config.options && Array.isArray(config.options.possibleValues) && 
      config.options.possibleValues.length > 0 && 
      !config.options.possibleValues.includes(value)) {
    throw new Error(`Value for "${key}" must be one of: ${config.options.possibleValues.join(', ')}`);
  }
  
  config.value = value;
  return config.save();
};

const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);

export default SystemConfig;