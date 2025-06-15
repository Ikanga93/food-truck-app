import API_BASE_URL from '../config/api.js'

class ApiService {
  static BASE_URL = `${API_BASE_URL}/api`

  // Helper method to get authentication headers
  static getAuthHeaders() {
    // Try admin token first (for admin operations)
    const adminToken = localStorage.getItem('adminAccessToken')
    if (adminToken) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }

    // Fall back to customer token (for customer operations)
    const customerToken = localStorage.getItem('customerAccessToken')
    if (customerToken) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      }
    }

    // No authentication
    return {
      'Content-Type': 'application/json'
    }
  }

  // Helper method specifically for admin operations
  static getAdminAuthHeaders() {
    const adminToken = localStorage.getItem('adminAccessToken')
    if (!adminToken) {
      throw new Error('Admin authentication required')
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  }

  // Helper method to safely parse JSON response
  static async parseResponse(response) {
    const text = await response.text()
    if (!text) {
      throw new Error('Empty response from server')
    }
    try {
      return JSON.parse(text)
    } catch (error) {
      console.error('Failed to parse JSON response:', text)
      throw new Error('Invalid JSON response from server')
    }
  }

  // Orders
  static async getOrders() {
    const response = await fetch(`${this.BASE_URL}/orders`, {
      headers: this.getAdminAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch orders')
    return this.parseResponse(response)
  }

  static async getCustomerOrders(customerId) {
    const response = await fetch(`${this.BASE_URL}/orders/customer/${customerId}`, {
      headers: this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch customer orders')
    return this.parseResponse(response)
  }

  static async createOrder(orderData) {
    const response = await fetch(`${this.BASE_URL}/orders`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(orderData)
    })
    if (!response.ok) throw new Error('Failed to create order')
    return this.parseResponse(response)
  }

  static async updateOrderStatus(orderId, status) {
    const response = await fetch(`${this.BASE_URL}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: this.getAdminAuthHeaders(),
      body: JSON.stringify({ status })
    })
    if (!response.ok) throw new Error('Failed to update order status')
    return this.parseResponse(response)
  }

  static async getOrder(orderId) {
    const response = await fetch(`${this.BASE_URL}/orders/${orderId}`, {
      headers: this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch order')
    return this.parseResponse(response)
  }

  // Menu items
  static async getMenuItems() {
    const response = await fetch(`${this.BASE_URL}/menu`)
    if (!response.ok) throw new Error('Failed to fetch menu items')
    return this.parseResponse(response)
  }

  static async addMenuItem(menuData) {
    const response = await fetch(`${this.BASE_URL}/menu`, {
      method: 'POST',
      headers: this.getAdminAuthHeaders(),
      body: JSON.stringify(menuData)
    })
    if (!response.ok) throw new Error('Failed to add menu item')
    return this.parseResponse(response)
  }

  static async updateMenuItem(itemId, updates) {
    const response = await fetch(`${this.BASE_URL}/menu/${itemId}`, {
      method: 'PUT',
      headers: this.getAdminAuthHeaders(),
      body: JSON.stringify(updates)
    })
    if (!response.ok) throw new Error('Failed to update menu item')
    return this.parseResponse(response)
  }

  static async deleteMenuItem(itemId) {
    const response = await fetch(`${this.BASE_URL}/menu/${itemId}`, {
      method: 'DELETE',
      headers: this.getAdminAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to delete menu item')
    return this.parseResponse(response)
  }

  // Locations
  static async getLocations() {
    const response = await fetch(`${this.BASE_URL}/locations`)
    if (!response.ok) throw new Error('Failed to fetch locations')
    return this.parseResponse(response)
  }

  static async addLocation(locationData) {
    const response = await fetch(`${this.BASE_URL}/locations`, {
      method: 'POST',
      headers: this.getAdminAuthHeaders(),
      body: JSON.stringify(locationData)
    })
    if (!response.ok) throw new Error('Failed to add location')
    return this.parseResponse(response)
  }

  static async updateLocation(locationId, updates) {
    const response = await fetch(`${this.BASE_URL}/locations/${locationId}`, {
      method: 'PUT',
      headers: this.getAdminAuthHeaders(),
      body: JSON.stringify(updates)
    })
    if (!response.ok) throw new Error('Failed to update location')
    return this.parseResponse(response)
  }

  static async deleteLocation(locationId) {
    const response = await fetch(`${this.BASE_URL}/locations/${locationId}`, {
      method: 'DELETE',
      headers: this.getAdminAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to delete location')
    return this.parseResponse(response)
  }

  // Stripe payment
  static async createPaymentIntent(orderData) {
    const response = await fetch(`${this.BASE_URL}/create-payment-intent`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(orderData)
    })
    if (!response.ok) throw new Error('Failed to create payment intent')
    return this.parseResponse(response)
  }
}

export default ApiService 