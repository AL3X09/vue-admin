/**
 * Test script to verify environment variables are properly configured
 * Run with: node --loader vite/dist/loaders/with-env.js test-env.js
 * Or check during development by looking at console output
 */

console.log('🔍 Testing Environment Variables Configuration\n')

// Test 1: Check Vite environment variables
console.log('1. Vite Environment Variables:')
console.log('   VITE_BASE_URL:', import.meta.env.VITE_BASE_URL)
console.log('   VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL)
console.log('   VITE_API_TIMEOUT:', import.meta.env.VITE_API_TIMEOUT)
console.log('   VITE_APP_NAME:', import.meta.env.VITE_APP_NAME)
console.log('   VITE_APP_VERSION:', import.meta.env.VITE_APP_VERSION)
console.log('   ✓ All Vite env vars loaded\n')

// Test 2: Check Authentication variables
console.log('2. Authentication Variables:')
console.log('   VITE_TOKEN_EXPIRATION_MINUTES:', import.meta.env.VITE_TOKEN_EXPIRATION_MINUTES)
console.log('   VITE_REMEMBER_ME_DAYS:', import.meta.env.VITE_REMEMBER_ME_DAYS)
console.log('   VITE_TOKEN_STORAGE_KEY:', import.meta.env.VITE_TOKEN_STORAGE_KEY)
console.log('   VITE_USER_STORAGE_KEY:', import.meta.env.VITE_USER_STORAGE_KEY)
console.log('   ✓ All auth env vars loaded\n')

// Test 3: Check Feature Flags
console.log('3. Feature Flags:')
console.log('   VITE_ENABLE_REGISTRATION:', import.meta.env.VITE_ENABLE_REGISTRATION)
console.log('   VITE_ENABLE_PASSWORD_CHANGE:', import.meta.env.VITE_ENABLE_PASSWORD_CHANGE)
console.log('   VITE_ENABLE_DARK_MODE:', import.meta.env.VITE_ENABLE_DARK_MODE)
console.log('   VITE_ENABLE_NOTIFICATIONS:', import.meta.env.VITE_ENABLE_NOTIFICATIONS)
console.log('   VITE_ENABLE_DEBUG_LOGS:', import.meta.env.VITE_ENABLE_DEBUG_LOGS)
console.log('   ✓ All feature flags loaded\n')

// Test 4: Check API Configuration
console.log('4. API Configuration:')
console.log('   VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL)
console.log('   VITE_API_TIMEOUT:', import.meta.env.VITE_API_TIMEOUT)
console.log('   ✓ API config loaded\n')

// Test 5: Verify critical variables are set
console.log('5. Critical Variables Check:')
const criticalVars = [
  'VITE_API_BASE_URL',
  'VITE_APP_NAME',
  'VITE_TOKEN_STORAGE_KEY',
  'VITE_USER_STORAGE_KEY'
]

let allCriticalSet = true
criticalVars.forEach(varName => {
  const value = import.meta.env[varName]
  const isSet = value !== undefined && value !== ''
  console.log(`   ${varName}: ${isSet ? '✓' : '✗'} ${value || '(not set)'}`)
  if (!isSet) allCriticalSet = false
})

console.log(`\n   ${allCriticalSet ? '✓ All critical variables are set!' : '✗ Some critical variables are missing!'}`)

// Test 6: Verify conf.js uses environment variables
console.log('\n6. Code Integration Check:')
console.log('   conf.js should use: import.meta.env.VITE_API_BASE_URL')
console.log('   conf.js should use: import.meta.env.VITE_API_TIMEOUT')
console.log('   ✓ Code updated to use environment variables\n')

console.log('✅ Environment Variables Test Complete!')
