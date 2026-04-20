import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import CourseList from "./pages/admin/CourseList";
import CreateCourse from "./pages/admin/CreateCourse";
import EditCourse from "./pages/admin/EditCourse";
import Courses from "./pages/Courses";
import CourseDetails from "./pages/CourseDetails";
import Homepage from "./pages/home/homepage";
import User from "./pages/User";
import UserLayout from "./pages/UserLayout";
import WordToPdf from "./pages/WordToPdf";
import CompressSize from "./pages/CompressSize";
import Login from "./pages/Login";
import RequireRole from "./components/RequireRole";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/course" element={<Courses />} />
        <Route path="/course/:id" element={<CourseDetails />} />
        <Route path="/user" element={<UserLayout />}>
          <Route index element={<User />} />
          <Route path="word-to-pdf" element={<WordToPdf />} />
          <Route path="compress-size" element={<CompressSize />} />
        </Route>

        <Route
          path="/admin"
          element={(
            <RequireRole allowedRoles={["admin"]}>
              <AdminLayout />
            </RequireRole>
          )}
        >
          <Route index element={<Dashboard />} />
          <Route path="course" element={<CourseList />} />
          <Route path="course/new" element={<CreateCourse />} />
          <Route path="course/edit/:id" element={<EditCourse />} />
        </Route>

        <Route path="*" element={<Navigate to="/course" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
