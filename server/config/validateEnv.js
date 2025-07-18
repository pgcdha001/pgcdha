/**
 * Environment Variables Validation
 * Ensures all required environment variables are present
 */
const requiredEnvVars = [
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET'
];

const optionalEnvVars = {
  'NODE_ENV': 'development',
  'PORT': '5000',
  'JWT_ACCESS_EXPIRE': '15m',
  'JWT_REFRESH_EXPIRE': '7d',
  'BCRYPT_SALT_ROUNDS': '12',
  'MAX_LOGIN_ATTEMPTS': '5',
  'LOCKOUT_TIME': '30'
};

function validateEnvironment() {
  const missing = [];
  
  // Check required variables
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n💡 Please check your .env file and ensure all required variables are set.');
    process.exit(1);
  }
  
  // Set defaults for optional variables
  Object.entries(optionalEnvVars).forEach(([varName, defaultValue]) => {
    if (!process.env[varName]) {
      process.env[varName] = defaultValue;
      console.log(`⚙️  Using default value for ${varName}: ${defaultValue}`);
    }
  });
  
  console.log('✅ Environment validation passed');
}

module.exports = { validateEnvironment };
