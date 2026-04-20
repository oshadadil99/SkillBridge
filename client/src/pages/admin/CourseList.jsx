import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";

import api from "../../api/axios";
import CourseTable from "../../components/admin/CourseTable";
import ConfirmModal from "../../components/admin/ConfirmModal";

function CourseList() {
  const location = useLocation();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const fetchCourses = async () => {
    setLoading(true);

    try {
      const response = await api.get("/courses");
      const courseList = Array.isArray(response.data?.data) ? response.data.data : [];

      const structureResults = await Promise.all(
        courseList.map((course) =>
          api
            .get(`/courses/${course._id}/structure`)
            .then((structureResponse) => {
              const modules = Array.isArray(structureResponse.data?.data?.modules)
                ? structureResponse.data.data.modules
                : [];

              const moduleCount = modules.length;
              const lessonCount = modules.reduce(
                (sum, moduleItem) => sum + (Array.isArray(moduleItem.lessonIds) ? moduleItem.lessonIds.length : 0),
                0
              );

              return {
                _id: course._id,
                moduleCount,
                lessonCount
              };
            })
            .catch(() => ({ _id: course._id, moduleCount: 0, lessonCount: 0 }))
        )
      );

      const structureMap = new Map(
        structureResults.map((item) => [item._id, { moduleCount: item.moduleCount, lessonCount: item.lessonCount }])
      );

      const enrichedCourses = courseList.map((course) => ({
        ...course,
        moduleCount: structureMap.get(course._id)?.moduleCount ?? 0,
        lessonCount: structureMap.get(course._id)?.lessonCount ?? 0
      }));

      setCourses(enrichedCourses);
    } catch (error) {
      alert(error.message || "Failed to fetch courses");
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleDelete = async () => {
    if (!selectedCourse) {
      return;
    }

    try {
      setDeleting(true);
      await api.delete(`/courses/${selectedCourse._id}`);
      setSelectedCourse(null);
      await fetchCourses();
      alert("Course deleted successfully");
    } catch (error) {
      alert(error.message || "Failed to delete course");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="space-y-5">
      {location.pathname === "/admin/course" && (
        <div >
          
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-[#d7d2c7] bg-[#fffdfa] p-10 text-center text-sm font-medium text-[#6c7da7] shadow-sm">
          Loading courses...
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#c8c4ba] bg-[#fffdfa] p-10 text-center shadow-sm">
          <p className="text-base font-medium text-[#1c2f6f]">No courses created yet</p>
          <p className="mt-1 text-sm text-[#6c7da7]">Click Create Course in the sidebar to create your first course.</p>
        </div>
      ) : (
        <CourseTable courses={courses} onDelete={setSelectedCourse} />
      )}

      <ConfirmModal
        isOpen={Boolean(selectedCourse)}
        title="Delete Course"
        message={`Are you sure you want to delete "${selectedCourse?.title || "this course"}"?`}
        confirmText="Delete Course"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => {
          if (!deleting) {
            setSelectedCourse(null);
          }
        }}
        loading={deleting}
      />
    </section>
  );
}

export default CourseList;
