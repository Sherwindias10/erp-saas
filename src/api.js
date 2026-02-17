// API Service for MySQL Backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getToken = () => {
  return localStorage.getItem('authToken');
};

// Helper function to set auth token
export const setToken = (token) => {
  localStorage.setItem('authToken', token);
};

// Helper function to remove auth token
export const removeToken = () => {
  localStorage.removeItem('authToken');
};

// Helper function to handle API errors
const handleError = (error) => {
  if (error.response) {
    throw new Error(error.response.data.error || 'An error occurred');
  } else if (error.request) {
    throw new Error('No response from server');
  } else {
    throw new Error(error.message);
  }
};

// Auth API
export const authAPI = {
  async login(email, password) {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }
      
      const data = await response.json();
      setToken(data.token);
      return data;
    } catch (error) {
      throw error;
    }
  },

  async register(email, password, companyName) {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, companyName })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }
      
      const data = await response.json();
      setToken(data.token);
      return data;
    } catch (error) {
      throw error;
    }
  },

  logout() {
    removeToken();
  }
};

// Tenants API
export const tenantsAPI = {
  async getAll() {
    try {
      const response = await fetch(`${API_URL}/tenants`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch tenants');
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  async getById(id) {
    try {
      const response = await fetch(`${API_URL}/tenants/${id}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch tenant');
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  }
};

// Customers API
export const customersAPI = {
  async getAll() {
    try {
      const response = await fetch(`${API_URL}/customers`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch customers');
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  async create(customerData) {
    try {
      const response = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(customerData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create customer');
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  async update(id, customerData) {
    try {
      const response = await fetch(`${API_URL}/customers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(customerData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update customer');
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  async delete(id) {
    try {
      const response = await fetch(`${API_URL}/customers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete customer');
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  }
};

// Products API
export const productsAPI = {
  async getAll() {
    try {
      const response = await fetch(`${API_URL}/products`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch products');
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  async create(productData) {
    try {
      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(productData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create product');
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  async update(id, productData) {
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(productData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update product');
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  async delete(id) {
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete product');
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  }
};

// Sales Orders API
export const salesOrdersAPI = {
  async getAll() {
    try {
      const response = await fetch(`${API_URL}/sales-orders`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch sales orders');
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  async create(orderData) {
    try {
      const response = await fetch(`${API_URL}/sales-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(orderData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create sales order');
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  async update(id, orderData) {
    try {
      const response = await fetch(`${API_URL}/sales-orders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(orderData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update sales order');
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  async delete(id) {
    try {
      const response = await fetch(`${API_URL}/sales-orders/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete sales order');
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  }
};

// Ledger Entries API
export const ledgerEntriesAPI = {
  async getAll() {
    try {
      const response = await fetch(`${API_URL}/ledger-entries`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch ledger entries');
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  async create(entryData) {
    try {
      const response = await fetch(`${API_URL}/ledger-entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(entryData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create ledger entry');
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  async update(id, entryData) {
    try {
      const response = await fetch(`${API_URL}/ledger-entries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(entryData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update ledger entry');
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  async delete(id) {
    try {
      const response = await fetch(`${API_URL}/ledger-entries/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete ledger entry');
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  }
};

// Helper to decode JWT token
export const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

// Check if token is expired
export const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  return decoded.exp * 1000 < Date.now();
};
