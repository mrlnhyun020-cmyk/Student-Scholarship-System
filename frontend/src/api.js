
const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  const result = await response.json().catch(() => ({}))

  if (!response.ok || result.success === false) {
    throw new Error(result.message || `Request failed (${response.status})`)
  }

  return result
}

export async function getStudents() {
  return request('/students')
}

export async function createStudent(studentData) {
  return request('/students', {
    method: 'POST',
    body: JSON.stringify(studentData),
  })
}

export async function updateStudent(id, studentData) {
  return request(`/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(studentData),
  })
}

export async function deleteStudent(id) {
  return request(`/students/${id}`, {
    method: 'DELETE',
  })
}
