const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new Error(`Cannot connect to the API at ${API_BASE}. Make sure your Express backend is running.`)
  }

  const payload = await response.json().catch(() => ({}))
  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || `Request failed (${response.status})`)
  }
  return payload
}

export const getStudents = () => request('/students')
export const createStudent = (student) => request('/students', {
  method: 'POST',
  body: JSON.stringify(student),
})

// The current Express routes in the linked repository implement GET /students and POST /students.
// Search is performed in the browser using the records returned by GET /students.
// Add update/delete API calls here after those routes are implemented in Express.
