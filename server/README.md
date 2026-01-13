# Server Module Layout

This folder contains the Express backend for DataForge. The server is split into small modules to keep routing, configuration, and utilities isolated.

## Modules

- `server.ts`
  - Starts the HTTP server and binds to the configured port.

- `app.ts`
  - Creates the Express app, wires middleware, mounts API routes, and serves the built frontend.

- `config.ts`
  - Central configuration: port, temp directories, python binary resolution, and constants.

- `routes/api.ts`
  - API endpoints for merge, trim, analyze, upload, and download.

- `middleware/uploads.ts`
  - Multer setup for uploads and trim uploads.

- `utils/file-cleanup.ts`
  - Cleanup helpers for temp directories and old outputs.

- `utils/student-analysis.ts`
  - Dataset type detection and single-student analysis helpers.

## Notes

- API endpoints are mounted under `/api` in `app.ts`.
- Python scripts are executed via child processes in `routes/api.ts`.
- Temporary files are stored under `tmp/` and cleaned up periodically.
