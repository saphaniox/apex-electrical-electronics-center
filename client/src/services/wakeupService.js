/**
 * Server Wake-up Service
 * Ensures the server is awake before making API requests
 * Particularly useful for Render.com free tier which sleeps after inactivity
 * 
 * Features:
 * - Silent wake-up on page load
 * - Periodic keep-alive pings
 * - Activity monitoring with intelligent retry
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SERVER_BASE_URL = API_BASE_URL.replace('/api', ''); // Remove /api to get server base URL

// Configuration
const WAKEUP_TIMEOUT = 20000;           // 20 seconds per ping
const KEEPALIVE_INTERVAL = 10 * 60 * 1000; // 10 minutes between pings
const INACTIVITY_THRESHOLD = 8 * 60 * 1000; // 8 minutes of inactivity before extra wake-up

let keepAliveInterval = null;
let lastActivityTime = Date.now();
let isServerAsleep = false;

/**
 * Ping the server to wake it up
 * @returns {Promise<boolean>} True if server is responsive, false if timeout
 */
export async function wakeUpServer() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WAKEUP_TIMEOUT);

    const response = await fetch(`${SERVER_BASE_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    clearTimeout(timeoutId);
    if (response.ok) {
      isServerAsleep = false;
      return true;
    }
    return false;
  } catch (error) {
    isServerAsleep = true;
    return false;
  }
}

/**
 * Wait for server to be ready with retries
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} delayMs - Delay between retries in milliseconds
 * @returns {Promise<boolean>} True if server became responsive, false if all retries failed
 */
export async function waitForServerReady(maxRetries = 6, delayMs = 3000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const isReady = await wakeUpServer();
    if (isReady) {
      return true;
    }

    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return false;
}

/**
 * Track user activity (mouse, keyboard, touch)
 */
function trackActivity() {
  lastActivityTime = Date.now();
}

/**
 * Check if user is inactive and wake server if needed
 */
async function checkAndWakeIfInactive() {
  const timeSinceActivity = Date.now() - lastActivityTime;
  
  // If user has been inactive for more than threshold, attempt to wake server
  if (timeSinceActivity > INACTIVITY_THRESHOLD) {
    await wakeUpServer();
  }
}

/**
 * Start the keep-alive service
 * Periodically pings the server to prevent it from sleeping
 */
export function startKeepAliveService() {
  if (keepAliveInterval) {
    return; // Already running
  }

  // Add activity listeners
  const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
  events.forEach(event => {
    document.addEventListener(event, trackActivity, { passive: true });
  });

  // Initial wake-up on startup
  wakeUpServer();

  // Set up periodic keep-alive
  keepAliveInterval = setInterval(() => {
    checkAndWakeIfInactive();
  }, KEEPALIVE_INTERVAL);

  console.log('✅ Keep-alive service started');
}

/**
 * Stop the keep-alive service
 */
export function stopKeepAliveService() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach(event => {
      document.removeEventListener(event, trackActivity);
    });

    console.log('✅ Keep-alive service stopped');
  }
}

/**
 * Get server status
 * @returns {boolean} True if server is confirmed awake, false if possibly sleeping
 */
export function getServerStatus() {
  return !isServerAsleep;
}

/**
 * Initialize server wake-up on app load
 */
export async function initializeServerWakeup() {
  console.log('🌍 Initializing server connection...');
  
  const isReady = await waitForServerReady(6, 3000);
  
  if (isReady) {
    console.log('✅ Server is ready for requests');
    return true;
  } else {
    console.warn('⚠️ Server is taking longer than expected to respond');
    return false;
  }
}
