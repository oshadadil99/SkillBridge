# Course & Content Management Module — Project Report

Date: 2026-04-02

---

## 1. Introduction

- **What is an LMS:** A Learning Management System (LMS) is software used to create, manage, and deliver educational courses and materials to learners.
- **Course & Content Management module:** This module lets admins create courses, group content into modules, and add lessons. It supports file attachments (documents, videos), course thumbnails, ordering, and publishing.
- **Problem solved:** It gives instructors a structured way to publish learning content and lets students browse and access that content.
- **Why it's important:** Without this module, content would be unmanaged and learners couldn't reliably find, preview, or consume courses.

## 2. Technologies Used (and why)

- **React (client):** Builds the interactive admin and public UI. See `client/src/App.jsx` and pages in `client/src/pages/`.
- **Vite:** Fast build and dev server for the React client (see `client/package.json`).
- **Tailwind CSS:** Utility-first styling used across pages (`client/index.css`).
- **Axios:** HTTP client used by frontend to call backend APIs: `client/src/api/axios.js`.
- **Node.js + Express:** Backend server and routing: `backend/app.js` and route files in `backend/routes/`.
- **MongoDB + Mongoose:** Stores Course / Module / Lesson documents (models in `backend/models/`).
- **Multer:** Handles file uploads on the server (Multer config in `backend/middleware/uploadMiddleware.js`).
- **docx, pdf-parse, LibreOffice, cloud APIs:** Used in `backend/controllers/toolController.js` to convert PDF → Word with fallbacks.

## 3. System Architecture (simple)

- **MVC on backend:** Models = `backend/models/*`, Controllers = `backend/controllers/*`, Routes = `backend/routes/*`.
- **Frontend ↔ Backend:** Frontend uses Axios (`client/src/api/axios.js`) to call REST endpoints (`/api/courses`, `/api/modules`, etc.).
- **REST idea:** Resources (courses/modules/lessons/files) have endpoints to create/read/update/delete.
- **Simple data flow:**
  1. User fills a form in React.
  2. Axios sends request to backend (Express route).
  3. Controller handles logic and uses Mongoose models to read/write MongoDB.
  4. Files uploaded via Multer are saved under `backend/uploads/` and the file path is stored in DB.

## 4. Folder Structure Explanation (key folders)

- **`backend/models/`** — Mongoose schemas for `Course`, `Module`, `Lesson`.
  - Files: [backend/models/Course.js](backend/models/Course.js), [backend/models/Module.js](backend/models/Module.js), [backend/models/Lesson.js](backend/models/Lesson.js).
- **`backend/controllers/`** — Main logic for resources and tools (conversion): e.g., [backend/controllers/courseController.js](backend/controllers/courseController.js), [backend/controllers/toolController.js](backend/controllers/toolController.js).
- **`backend/routes/`** — Maps HTTP paths to controllers: `courseRoutes.js`, `moduleRoutes.js`, `lessonRoutes.js`, `fileRoutes.js`, `toolRoutes.js`.
- **`backend/middleware/`** — Middleware such as Multer upload config: [backend/middleware/uploadMiddleware.js](backend/middleware/uploadMiddleware.js).
- **`backend/utils/`** — Helpers: `updateOrder.js` (reordering logic), `fileCleanup.js` (safe deletion of files).
- **`backend/config/`** — DB connection helper: [backend/config/db.js](backend/config/db.js).
- **`backend/uploads/`** — Stored uploaded files (documents, videos, thumbnails).
- **`client/src/pages/`** — App pages: `CreateCourse.jsx`, `EditCourse.jsx`, `Courses.jsx`, `CourseDetails.jsx`, `User.jsx`, `WordToPdf.jsx`.
- **`client/src/components/`** — UI components: `CourseCard.jsx`, `CourseTable.jsx`, `ConfirmModal.jsx`.
- **`client/src/api/axios.js`** — Axios instance and `UPLOADS_BASE_URL` used to resolve file URLs.

## 5. Database Models Explanation (simple)

- **Course (`backend/models/Course.js`)**
  - Fields: `title` (required), `description` (required), `category` (required), `thumbnail` (path string), `status` (`draft|published`), `instructorId`, `price`, `isPaid`, `duration`, `level`.
  - Purpose: stores top-level course info used in listings and detail pages.
- **Module (`backend/models/Module.js`)**
  - Fields: `title` (required), `content` (optional description), `courseId` (reference to `Course`), `order` (number).
  - Purpose: groups lessons and keeps display order.
- **Lesson (`backend/models/Lesson.js`)**
  - Fields: `title` (required), `moduleId` (ref to `Module`), `contentType` (`video|pdf|document|text`), `content` (text), `fileUrl` (path or external URL), `order`.
  - Purpose: the smallest learning unit. `fileUrl` points to an uploaded file or an external asset.
- **Relationships:** One Course → many Modules; One Module → many Lessons. `getCourseFullStructure` (in `backend/controllers/courseController.js`) queries these and returns a nested structure for the frontend.

## 6. Backend API Explanation (simple list)

- **Courses** (`backend/routes/courseRoutes.js`):
  - `POST /api/courses` — create course (`createCourse`).
  - `GET /api/courses` — list courses (`getCourses`) with filters (`status`, `category`, `search`).
  - `GET /api/courses/:id/full` — full structure for course detail (`getCourseFullStructure`).
  - `PUT /api/courses/:id` — update course (publish validation inside `updateCourse`).
  - `DELETE /api/courses/:id` — delete course and attached modules/lessons/files.
- **Modules** (`backend/routes/moduleRoutes.js`): create, list by course (`GET /api/modules/:courseId`), reorder (`PUT /api/modules/reorder`), update, delete. Uses `updateOrder` for reordering.
- **Lessons** (`backend/routes/lessonRoutes.js`): create, list by module, reorder (`PUT /api/lessons/reorder`), update, delete. Validation ensures `contentType` matches `content`/`fileUrl` requirements.
- **Files** (`backend/routes/fileRoutes.js`):
  - `POST /api/files/upload` — upload lesson files (documents/videos).
  - `POST /api/files/upload-thumbnail` — upload course thumbnails.
  - `DELETE /api/files/:filename` — remove file.
- **Tools** (`backend/routes/toolRoutes.js`):
  - `POST /api/tools/pdf-to-word` — convert PDF to a Word `.docx`.
  - `POST /api/tools/compress-file` — return a ZIP of the uploaded file.

## 7. File Upload System (how it works)

- **Multer config:** `backend/middleware/uploadMiddleware.js` defines where to save files and enforces size/type limits.
  - Lesson files → `backend/uploads/documents/` or `backend/uploads/videos/` depending on extension.
  - Thumbnails → `backend/uploads/thumbnails/`.
- **UUID filenames:** Filenames are generated with UUID (`uuidv4()`), preventing collisions and avoiding unsafe characters.
- **File URL format:** Controllers return a relative public URL like `/uploads/documents/<uuid>.pdf`. Frontend uses `UPLOADS_BASE_URL` from `client/src/api/axios.js` to build a full URL to open files.
- **Cleanup:** `backend/utils/fileCleanup.js` safely resolves `/uploads/...` paths to absolute disk paths and deletes them.

## 8. Course Creation Flow (step-by-step)

1. Admin opens `Create Course` page (`client/src/pages/admin/CreateCourse.jsx`).
2. Admin submits course form → frontend `POST /api/courses` → backend `createCourse` saves `Course`.
3. Admin adds modules via `POST /api/modules` (UI inside Create/Edit pages); backend saves `Module` with `courseId`.
4. Admin adds lessons: either provide a file URL or upload a file:
   - To upload, frontend calls `POST /api/files/upload` (Multer saves file; controller returns `fileUrl`).
   - Then frontend `POST /api/lessons` with `fileUrl` and `contentType`.
5. Admin reorders modules or lessons using `PUT /modules/reorder` or `PUT /lessons/reorder` which call `updateOrder` util.
6. Admin publishes course by setting `status: "published"` in `PUT /api/courses/:id` — publish validation ensures every module has at least one lesson.

## 9. Admin UI Explanation (pages)

- **Admin Dashboard:** quick stats (files: `client/src/pages/admin/Dashboard.jsx`).
- **Course List page:** `client/src/pages/admin/CourseList.jsx` uses `CourseTable` to show courses and module/lesson counts.
- **Create Course page:** `client/src/pages/admin/CreateCourse.jsx` — main authoring page: create course, upload thumbnail, add modules and lessons, save content, and reorder.
- **Edit Course page:** `client/src/pages/admin/EditCourse.jsx` — edit existing course and its structure. Both pages call the same backend APIs.
- **Module & lesson builder UI:** Inline in Create/Edit pages — create, reorder, save and delete modules/lessons.

## 10. Public UI Explanation

- **Course cards page:** `client/src/pages/Courses.jsx` lists published courses. Each item uses `client/src/components/CourseCard.jsx`.
- **Search & Filter:** `Courses.jsx` implements client-side search and category filter on the fetched published list.
- **Course preview page:** `client/src/pages/CourseDetails.jsx` fetches `GET /api/courses/:id/full` and renders modules + lessons with links to lesson files.
- **User dashboard:** `client/src/pages/User.jsx` shows locally stored enrollments (via `localStorage`) and a confirmation modal for clearing enrollments.

## 11. Document Tools Explanation

- **PDF → Word (`backend/controllers/toolController.js`)**
  - Tries local LibreOffice (`soffice`) first. If not available or fails, tries configured cloud APIs (ConvertAPI or Cloudmersive). If those fail, it uses `pdf-parse` to extract text and `docx` package to create a `.docx` with the text (fallback).
  - Response: returns `{ success: true, fileUrl }` where `fileUrl` points to the generated `.docx` under `uploads/documents/`.
  - This tool is useful to produce editable documents from PDFs when required.
- **File compression:** `compressFile` zips the uploaded file using `archiver` and returns it for download.

## 12. Data Flow Example (Admin creates lesson with upload)

1. Frontend uploads file to `POST /api/files/upload` (FormData).
2. Server saves file to disk and returns `fileUrl` (e.g. `/uploads/documents/<uuid>.pdf`).
3. Frontend then `POST /api/lessons` with `fileUrl` and metadata.
4. Lesson saved in MongoDB with `fileUrl` pointer.
5. Student opens course page; the UI links to the public file URL and browser downloads or opens it.

## 13. Key Features Implemented (short list)

- Course CRUD and publish validation (`backend/controllers/courseController.js`).
- Module & Lesson CRUD plus reorder (`moduleController.js`, `lessonController.js`, `backend/utils/updateOrder.js`).
- File upload endpoints and thumbnail upload (`backend/routes/fileRoutes.js`, `fileController.js`).
- PDF → Word conversion with robust fallbacks (`backend/controllers/toolController.js`).
- Admin authoring UI with create/edit pages (`client/src/pages/admin/CreateCourse.jsx`, `EditCourse.jsx`).
- Public listing and course detail pages (`client/src/pages/Courses.jsx`, `CourseDetails.jsx`).

## 14. Challenges & Notes

- **Upload validation & storage:** Need to handle many file types and size limits — implemented in `uploadMiddleware.js`.
- **Conversion reliability:** LibreOffice may be absent; code includes cloud fallbacks and a text-extraction fallback.
- **Ordering:** `updateOrder.js` enforces IDs/order numeric checks to keep DB consistent.
- **Cleanup:** Files removed when their DB records are deleted via `fileCleanup.js`.

## 15. Conclusion

- **Achieved:** A practical Course & Content Management module with admin tools, file uploads, robust conversion fallbacks, and a usable public UI.
- **Improvements:** Add authentication, server-side enrollments, UI toasts, tests, and cloud storage for files.

---

If you want a PDF, convert this Markdown locally. Suggested commands follow.

### Convert to PDF (suggested commands)

- Using `pandoc` (recommended if installed):

```bash
pandoc REPORT_COURSE_CONTENT_MANAGEMENT.md -o REPORT_COURSE_CONTENT_MANAGEMENT.pdf
```

- Using `wkhtmltopdf` (convert HTML produced from markdown):

```bash
# convert markdown to HTML (example using markdown-it-cli or other), then:
wkhtmltopdf report.html REPORT_COURSE_CONTENT_MANAGEMENT.pdf
```

- Using `npx markdown-pdf` (if Node + internet available):

```bash
npx markdown-pdf REPORT_COURSE_CONTENT_MANAGEMENT.md -o REPORT_COURSE_CONTENT_MANAGEMENT.pdf
```

---

Report file created: `REPORT_COURSE_CONTENT_MANAGEMENT.md`

## 16. Functions, Validations, Toast Messages & Warnings

This section documents the key functions (frontend & backend), the validation rules enforced both client- and server-side, and recommended toast/warning messages for consistent UX.

### 16.1 Key Functions (where to look)
- **Frontend**
  - `client/src/api/axios.js` — Axios instance, `API_BASE_URL`, `UPLOADS_BASE_URL`, and response interceptors (maps no-response to "Network error. Please check your connection.").
  - `client/src/pages/CourseDetails.jsx` — `handleEnroll()` (adds course id to `localStorage` and dispatches `enrollmentsChanged`), and `handleDownloadPdf()` (exports course content to PDF).
  - `client/src/pages/Courses.jsx` — fetch and filtering logic (`fetchCourses()`, `filteredCourses`), type mapping (price === 0 → Course, price > 0 → Additional Course).
  - `client/src/pages/User.jsx` — enrollment management: reads/writes `localStorage` (`enrolledCourses`), `onEnrollmentsChanged()` listener, per-course removal handler.
  - `client/src/components/CourseCard.jsx` — `resolveThumbnailUrl()` and rendering of enrolled remove button.
  - `client/src/pages/admin/CreateCourse.jsx` & `EditCourse.jsx` — handlers: thumbnail upload, lesson file uploads, `handleCourseTypeChange()`, `handlePriceChange()`, submit handlers and `fetchStructure()` (loads modules + lessons).

- **Backend**
  - `backend/controllers/courseController.js` — `createCourse`, `getCourses`, `getCourseById`, `updateCourse`, `deleteCourse`, `getCourseFullStructure`, `getCourseStructure`, plus `validateCourseForPublish()` and `normalizeStatusInput()` utilities.
  - `backend/middleware/uploadMiddleware.js` — Multer configuration and file validation.
  - `backend/utils/fileCleanup.js` — `removeUploadedFilesFromLessons()` and safe path resolution before deletion.
  - `backend/utils/updateOrder.js` — reorder helpers used by module/lesson controllers.

### 16.2 Validations (rules enforced)
- **Server-side validations**
  - Publishing validation: a course cannot be published unless every module contains at least one lesson. (Error message: `Course must contain at least one module and lesson before publishing` — returned as 400.)
  - Mongoose schema validation for required fields (`title`, `description`, `category`) and types.
  - File upload validation (Multer): allowed MIME types, size limits, and destination folders (`uploads/documents`, `uploads/videos`, `uploads/thumbnails`).
  - Input sanitization on search/category filters and guarded query parameters in controllers.

- **Client-side validations**
  - Course forms: required fields (`title`, `description`, `category`) must be present before submit.
  - Price field: numeric-only input with optional two-decimal precision; when `Course` type is selected price is locked to `0` (FREE).
  - Thumbnail/lesson file selection: validate file type and size before uploading; gracefully show error returned by backend.
  - Lesson validation: either `content` or a valid `fileUrl` must be provided depending on `contentType`.
  - Enrollment rules: only one free course allowed per user (enforced client-side by checking enrolled course IDs and their prices before adding another free course).

### 16.3 Toast messages & warnings (recommended)
Use non-blocking toasts for user feedback instead of `alert()` where possible. Recommended library: `react-toastify` or a small in-app `Toast` component.

- **Suggested messages & severity**
  - Warning: `You can select only one free course` — shown when user attempts to enroll in a second free course (currently implemented as `alert()` in `CourseDetails.jsx` — replace with `toast.warn(...)`).
  - Error: `Network error. Please check your connection.` — returned from Axios interceptor when request fails with no response; show as `toast.error(...)`.
  - Error: `Course must contain at least one module and lesson before publishing` — backend publish validation; show as `toast.error(...)` on failed publish.
  - Success: `Enrolled`, `Course saved`, `Course deleted successfully`, `Upload completed` — show as `toast.success(...)`.
  - Info: `Uploading thumbnail...`, `Uploading lesson file...` — show as `toast.info(...)` for long-running uploads.

- **Example snippet**
```js
import { toast } from 'react-toastify';

// warn
toast.warn('You can select only one free course');

// error
toast.error('Course must contain at least one module and lesson before publishing');

// success
toast.success('Enrolled');
```

Add `<ToastContainer />` once (for example in `client/src/App.jsx`) and centralize mapping of backend error messages to toast severities.

### 16.4 Implementation notes / migration tips
- Replace `window.alert(...)` usages with toasts to avoid blocking the main thread and to provide consistent styling and auto-dismiss behavior.
- Centralize network error handling in `client/src/api/axios.js` and convert common server-side validation responses (400) into user-friendly messages via toasts.
- Keep server-side validation authoritative — client-side validation only improves UX but server must return proper 4xx responses for invalid requests.

### 16.5 Regenerating the PDF
After updating this Markdown you can regenerate the PDF locally. Recommended commands (same as earlier):

```bash
pandoc REPORT_COURSE_CONTENT_MANAGEMENT.md -o REPORT_COURSE_CONTENT_MANAGEMENT.pdf
```

Or use `npx markdown-pdf` if you prefer a Node-based converter.

---

_Report updated: 2026-04-19 — added functions, validations, toast/warning guidance._

