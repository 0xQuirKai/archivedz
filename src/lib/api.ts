// API Configuration
// Replace this URL with your Node.js backend URL
const API_BASE_URL = 'http://localhost:3000/api';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  token?: string;
}

export interface Box {
  id: string;
  name: string;
  pdfCount: number;
  createdAt: string;
  qrCode?: string;
}

export interface PDF {
  id: string;
  title: string;
  filename: string | null;
  path: string | null;
  uploadDate: string;
  size: number;
  hasFile?: boolean;
  originalName?: string | null;
}

// Helper function for API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('authToken');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

// Auth API
export const authAPI = {
  login: async (email: string, password: string): Promise<User> => {
    const data = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }
    return data;
  },

  register: async (name: string, email: string, password: string): Promise<User> => {
    const data = await apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem('authToken');
  },

  getCurrentUser: async (): Promise<User> => {
    return apiCall('/auth/me');
  },
};

// Box API
export const boxAPI = {
  getAll: async (): Promise<Box[]> => {
    return apiCall('/boxes');
  },

  getById: async (boxId: string): Promise<Box & { pdfs: PDF[] }> => {
    return apiCall(`/boxes/${boxId}`);
  },

  create: async (name: string): Promise<Box> => {
    return apiCall('/boxes', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  update: async (boxId: string, name: string): Promise<Box> => {
    return apiCall(`/boxes/${boxId}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
  },

  delete: async (boxId: string): Promise<void> => {
    return apiCall(`/boxes/${boxId}`, {
      method: 'DELETE',
    });
  },

  getQRCode: async (boxId: string): Promise<{ qrCode: string }> => {
    return apiCall(`/boxes/${boxId}/qr`);
  },
};

// PDF API
export const pdfAPI = {
  upload: async (boxId: string, files: File[], title: string): Promise<PDF[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('pdfs', file);
    });
    formData.append('title', title);

    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/boxes/${boxId}/pdfs`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  },

  createTitleOnly: async (boxId: string, title: string): Promise<PDF> => {
    return apiCall(`/boxes/${boxId}/titles`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  },

  delete: async (boxId: string, pdfId: string): Promise<void> => {
    return apiCall(`/boxes/${boxId}/pdfs/${pdfId}`, {
      method: 'DELETE',
    });
  },

  getDownloadUrl: (pdfPath: string | null): string | null => {
    return pdfPath ? `${API_BASE_URL}/files/${pdfPath}` : null;
  },
};

// Public API (no auth required)
export const publicAPI = {
  getBoxPublic: async (boxId: string): Promise<Box & { pdfs: PDF[] }> => {
    return apiCall(`/public/boxes/${boxId}`);
  },
};
