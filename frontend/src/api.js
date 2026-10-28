
const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Attach the login token to requests that need authentication.
function authHeaders(token) {
  return token
    ? { Authorization: `Bearer ${token}` }
    : {}
}


async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(!isFormData && options.body
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    throw new Error(result.message || `Request failed (${response.status})`);
  }

  return result;
}


// Authentication
export async function registerUser(userData) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  })
}

export async function loginUser(credentials) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

// Student management — admin token required
export async function getStudents(token) {
  return request('/students', {
    headers: authHeaders(token),
  })
}

export async function createStudent(studentData, token) {
  return request('/students', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(studentData),
  })
}

export async function updateStudent(id, studentData, token) {
  return request(`/students/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(studentData),
  })
}

export async function deleteStudent(id, token) {
  return request(`/students/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
}


export async function getMyProfile(token) {
  return request('/auth/me', {
    headers: authHeaders(token),
  })
}


export async function getScholarships(token) {
  return request('/scholarship', {
    headers: authHeaders(token),
  });
}

export async function getPublishedScholarships(token) {
  return request('/scholarship/published', {
    headers: authHeaders(token),
  });
}

export async function createScholarship(scholarshipData, token) {
  return request('/scholarship', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(scholarshipData),
  });
}

export async function updateScholarship(id, scholarshipData, token) {
  return request(`/scholarship/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(scholarshipData),
  });
}

export async function deleteScholarship(id, token) {
  return request(`/scholarship/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}




export async function submitApplication(applicationData, token) {
  const formData = new FormData();

  formData.append('scholarshipId', applicationData.scholarshipId);
  formData.append('course', applicationData.course);
  formData.append('yearLevel', applicationData.yearLevel);
  formData.append('gradeAverage', applicationData.gradeAverage);
  formData.append('statement', applicationData.statement);

  (applicationData.documents || []).forEach((document, index) => {
    if (document.file) {
      formData.append(`document_${index}`, document.file);
    }
  });

  return request('/applications', {
    method: 'POST',
    headers: authHeaders(token),
    body: formData,
  });
}


export async function getMyApplications(token) {
  return request('/applications/mine', {
    headers: authHeaders(token),
  });
}

// Admin: retrieve all student applications
export async function getAllApplications(token) {
  return request('/applications', {
    headers: authHeaders(token),
  });
}

// Admin: approve or reject an application
export async function updateApplicationStatus(id, status, adminFeedback, token) {
  return request(`/applications/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ status, adminFeedback }),
  });
}


export async function openApplicationDocument(
  applicationId,
  documentId,
  token
) {
  const response = await fetch(
    `${API_URL}/applications/${applicationId}/documents/${documentId}`,
    {
      headers: authHeaders(token),
    }
  );

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.message || "Unable to open document.");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  const newWindow = window.open(url, "_blank");

  if (!newWindow) {
    const link = document.createElement("a");
    link.href = url;
    link.download = "scholarship-document";
    link.click();
  }

  // Release the temporary browser URL after a delay.
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
