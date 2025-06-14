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

  // Orders
  static async getOrders() {
    const response = await fetch(`${this.BASE_URL}/orders`, {
      headers: this.getAdminAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch orders')
    return response.json()
  }

  static async getCustomerOrders(customerId) {
    const response = await fetch(`${this.BASE_URL}/orders/customer/${customerId}`, {
      headers: this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch customer orders')
    return response.json()
  }

  static async createOrder(orderData) {
    const response = await fetch(`${this.BASE_URL}/orders`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(orderData)
    })
    if (!response.ok) throw new Error('Failed to create order')
    return response.json()
  }

  static async updateOrderStatus(orderId, status) {
    const response = await fetch(`${this.BASE_URL}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: this.getAdminAuthHeaders(),
      body: JSON.stringify({ status })
    })
    if (!response.ok) throw new Error('Failed to update order status')
    return response.json()
  }

  static async getOrder(orderId) {
    const response = await fetch(`${this.BASE_URL}/orders/${orderId}`, {
      headers: this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch order')
    return response.json()
  }

  // Menu items
  static async getMenuItems() {
    const response = await fetch(`${this.BASE_URL}/menu`)
    if (!response.ok) throw new Error('Failed to fetch menu items')
    return response.json()
  }

  static async addMenuItem(menuData) {
    const response = await fetch(`${this.BASE_URL}/menu`, {
      method: 'POST',
      headers: this.getAdminAuthHeaders(),
      body: JSON.stringify(menuData)
    })
    if (!response.ok) throw new Error('Failed to add menu item')
    return response.json()
  }

  static async updateMenuItem(itemId, updates) {
    const response = await fetch(`${this.BASE_URL}/menu/${itemId}`, {
      method: 'PUT',
      headers: this.getAdminAuthHeaders(),
      body: JSON.stringify(updates)
    })
    if (!response.ok) throw new Error('Failed to update menu item')
    return response.json()
  }

  static async deleteMenuItem(itemId) {
    const response = await fetch(`${this.BASE_URL}/menu/${itemId}`, {
      method: 'DELETE',
      headers: this.getAdminAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to delete menu item')
    return response.json()
  }

  // Locations
  static async getLocations() {
    const response = await fetch(`${this.BASE_URL}/locations`)
    if (!response.ok) throw new Error('Failed to fetch locations')
    return response.json()
  }

  static async addLocation(locationData) {
    const response = await fetch(`${this.BASE_URL}/locations`, {
      method: 'POST',
      headers: this.getAdminAuthHeaders(),
      body: JSON.stringify(locationData)
    })
    if (!response.ok) throw new Error('Failed to add location')
    return response.json()
  }

  static async updateLocation(locationId, updates) {
    const response = await fetch(`${this.BASE_URL}/locations/${locationId}`, {
      method: 'PUT',
      headers: this.getAdminAuthHeaders(),
      body: JSON.stringify(updates)
    })
    if (!response.ok) throw new Error('Failed to update location')
    return response.json()
  }

  static async deleteLocation(locationId) {
    const response = await fetch(`${this.BASE_URL}/locations/${locationId}`, {
      method: 'DELETE',
      headers: this.getAdminAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to delete location')
    return response.json()
  }

  // Stripe payment
  static async createPaymentIntent(orderData) {
    const response = await fetch(`${this.BASE_URL}/create-payment-intent`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(orderData)
    })
    if (!response.ok) throw new Error('Failed to create payment intent')
    return response.json()
  }
}

export default ApiService 