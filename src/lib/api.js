// API configuration for connecting to FastAPI backend
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

// Authentication utilities
export const getAuthToken = () => {
  return localStorage.getItem("access_token");
};

export const setAuthToken = (token) => {
  localStorage.setItem("access_token", token);
};

export const removeAuthToken = () => {
  localStorage.removeItem("access_token");
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};

// API request utilities
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    ...options.headers,
  };

  // Don't set Content-Type for FormData (let browser set it with boundary)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Authentication API calls
export const authAPI = {
  register: async (userData) => {
    return apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  login: async (email, password) => {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Login failed");
    }

    return response.json();
  },

  getCurrentUser: async () => {
    return apiRequest("/auth/me");
  },

  logout: async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } finally {
      removeAuthToken();
    }
  },
};

// Analysis API calls
export const analysisAPI = {
  triggerAnalysis: async (logIds) => {
    return apiRequest("/analysis/trigger", {
      method: "POST",
      body: JSON.stringify({ log_ids: logIds }),
    });
  },

  getAnalysisStatus: async (analysisId) => {
    return apiRequest(`/analysis/status/${analysisId}`);
  },

  getAnalysisResults: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/analysis/results?${queryParams}`);
  },

  deleteAnalysisResult: async (resultId) => {
    return apiRequest(`/analysis/results/${resultId}`, {
      method: "DELETE",
    });
  },
};

// Logs API calls
export const logsAPI = {
  uploadLog: async (file, uploadType = "text") => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_type', uploadType);
    return apiRequest("/logs/upload", {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type, let browser set it with boundary
      }
    });
  },

  uploadChunked: async (file, uploadType = "text", chunkSize = 1024 * 1024) => {
    // For files larger than 50MB, use chunked upload
    if (file.size <= 50 * 1024 * 1024) {
      return logsAPI.uploadLog(file, uploadType);
    }

    const fileId = crypto.randomUUID();
    const totalChunks = Math.ceil(file.size / chunkSize);
    const uploadPromises = [];

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('chunk_number', i + 1);
      formData.append('total_chunks', totalChunks);
      formData.append('file_id', fileId);
      formData.append('filename', file.name);
      formData.append('upload_type', uploadType);

      uploadPromises.push(
        apiRequest("/logs/upload-chunk", {
          method: 'POST',
          body: formData,
          headers: {
            // Don't set Content-Type, let browser set it with boundary
          }
        })
      );
    }

    // Upload chunks in parallel with progress tracking
    const results = await Promise.all(uploadPromises);
    
    // Return the final result (last chunk contains the complete file info)
    return results[results.length - 1];
  },

  uploadStreaming: async (file, uploadType = "text", onProgress = null) => {
    // For files larger than 1GB, use streaming upload
    if (file.size <= 1024 * 1024 * 1024) {
      return logsAPI.uploadChunked(file, uploadType);
    }

    const uploadId = crypto.randomUUID();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_type', uploadType);
    formData.append('upload_id', uploadId);

    // Create a custom XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress(percentComplete, event.loaded, event.total);
        }
      });

      // Handle response
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status} - ${xhr.statusText}`));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload was aborted'));
      });

      // Send the request
      xhr.open('POST', `${API_BASE_URL}/logs/upload-streaming`);
      xhr.setRequestHeader('Authorization', `Bearer ${getAuthToken()}`);
      xhr.send(formData);
    });
  },

  resumeUpload: async (uploadId) => {
    const formData = new FormData();
    formData.append('upload_id', uploadId);
    return apiRequest("/logs/upload-resume", {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type, let browser set it with boundary
      }
    });
  },

  cancelUpload: async (uploadId) => {
    return apiRequest(`/logs/upload-cancel/${uploadId}`, {
      method: 'DELETE'
    });
  },

  getUploadProgress: async (fileId) => {
    return apiRequest(`/logs/upload-progress/${fileId}`);
  },

  uploadFolder: async (files, uploadType = "text") => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('upload_type', uploadType);
    return apiRequest("/logs/upload-folder", {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type, let browser set it with boundary
      }
    });
  },

  getLogs: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/logs?${queryParams}`);
  },

  getLogDetail: async (logId) => {
    return apiRequest(`/logs/${logId}`);
  },
};

// Dashboard API calls
export const dashboardAPI = {
  getSystemMetrics: async () => {
    return apiRequest("/dashboard/metrics");
  },

  getThreatSummary: async () => {
    return apiRequest("/dashboard/threats");
  },

  getPerformanceMetrics: async () => {
    return apiRequest("/dashboard/performance");
  },

  getActivityTimeline: async () => {
    return apiRequest("/dashboard/activity");
  },
}; 