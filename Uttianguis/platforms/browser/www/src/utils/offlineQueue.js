// Adding offlineQueue.js since it's referenced in api.js

// Storage key for offline requests
const OFFLINE_QUEUE_KEY = "uttiangisOfflineQueue"

/**
 * Queues a request for later execution when online
 * @param {Object} request - Request object with method, endpoint, data, and options
 * @returns {Promise<Object>} - Offline response object
 */
export const queueOfflineRequest = async (request) => {
  try {
    // Generate a unique ID for the request
    const requestId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create offline request object
    const offlineRequest = {
      id: requestId,
      ...request,
      timestamp: Date.now(),
    }

    // Get existing queue
    const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]")

    // Add request to queue
    queue.push(offlineRequest)

    // Save updated queue
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))

    // Return offline response
    return {
      success: true,
      offline: true,
      message: "Request queued for later execution",
      requestId,
      data: null,
    }
  } catch (error) {
    console.error("Failed to queue offline request:", error)
    return {
      success: false,
      offline: true,
      message: "Failed to queue request",
      error: error.message,
    }
  }
}

/**
 * Processes the offline request queue when online
 * @param {Function} apiCall - Function to make API calls
 * @returns {Promise<Object>} - Results of processing the queue
 */
export const processOfflineQueue = async (apiCall) => {
  // Get the queue
  const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]")

  if (queue.length === 0) {
    return {
      success: true,
      message: "No offline requests to process",
      processed: 0,
    }
  }

  const results = []
  const remainingRequests = []

  // Process each request in the queue
  for (const request of queue) {
    try {
      const { method, endpoint, data, options } = request

      // Execute the request
      const response = await apiCall(method, endpoint, data, options)

      results.push({
        requestId: request.id,
        success: true,
        response,
      })
    } catch (error) {
      console.error("Failed to process offline request:", error)

      results.push({
        requestId: request.id,
        success: false,
        error: error.message,
      })

      // Keep failed requests in the queue for retry
      remainingRequests.push(request)
    }
  }

  // Update the queue with remaining requests
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingRequests))

  return {
    success: true,
    message: `Processed ${results.length - remainingRequests.length} of ${queue.length} offline requests`,
    results,
    remaining: remainingRequests.length,
  }
}

/**
 * Gets the current offline request queue
 * @returns {Array} - Array of queued requests
 */
export const getOfflineQueue = () => {
  return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]")
}

/**
 * Clears the offline request queue
 */
export const clearOfflineQueue = () => {
  localStorage.removeItem(OFFLINE_QUEUE_KEY)
}

export default {
  queueOfflineRequest,
  processOfflineQueue,
  getOfflineQueue,
  clearOfflineQueue,
}

