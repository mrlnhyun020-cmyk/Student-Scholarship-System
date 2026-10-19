# Student Scholarship System — Frontend

React + Vite + Tailwind CSS frontend for the Student Scholarship System Express API.

## Requirements

- Node.js LTS
- Your Express backend running at `http://localhost:5000`
- MongoDB running and connected through the backend

## Install and run

From the repository root, create the frontend folder using this package, or unzip this frontend folder into the existing repository.

```bash
cd frontend
npm install
```

Create `frontend/.env` if your backend uses another URL:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Open the Vite URL shown in the terminal (usually `http://localhost:5173`).

## Included interface

- Student dashboard and status summary cards
- Student list using `GET /api/students`
- Add student form using `POST /api/students`
- Client-side search and status filtering
- CSV export of filtered rows
- Responsive layout styled with Tailwind CSS
- API error handling and refresh button

## Current backend route compatibility

The repository's current `routes/student.js` exposes these endpoints:

| Method | Endpoint | Used by frontend |
|---|---|---|
| GET | `/api/students` | Loads student list |
| POST | `/api/students` | Creates student |

Search is currently performed in the browser using the fetched list. The current backend does not yet expose dedicated `GET /:id`, `PUT /:id`, `DELETE /:id`, or search routes. Those actions should not be presented as working until the matching Express routes are implemented.

## CORS

The existing Express server uses `app.use(cors())`, so the Vite development server can call the API at `localhost:5000`.

## Notes

- Student records are stored by the Express API in MongoDB.
- Never place database credentials in frontend environment variables. The frontend `.env` contains only the public API base URL.
