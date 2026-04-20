import { Link } from "react-router-dom";

const EditIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
  </svg>
);

const DeleteIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString();
};

function CourseTable({ courses, onDelete }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#d7d2c7] bg-[#fffdfa] shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#e9e4d8] text-left text-sm">
          <thead className="bg-[#f8f5ef]">
            <tr>
              <th className="px-5 py-3 font-semibold text-[#4e5f8b]">Title</th>
              <th className="px-5 py-3 font-semibold text-[#4e5f8b]">Category</th>
              <th className="px-5 py-3 font-semibold text-[#4e5f8b]">Type</th>
              <th className="px-5 py-3 font-semibold text-[#4e5f8b]">Modules</th>
              <th className="px-5 py-3 font-semibold text-[#4e5f8b]">Lessons</th>
              <th className="px-5 py-3 font-semibold text-[#4e5f8b]">Status</th>
              <th className="px-5 py-3 font-semibold text-[#4e5f8b]">Created</th>
              <th className="px-5 py-3 font-semibold text-[#4e5f8b]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0ebdf] bg-[#fffdfa]">
            {courses.map((course) => (
              <tr key={course._id} className="transition hover:bg-[#f8f5ef]">
                <td className="px-5 py-4 font-medium text-[#112765]">{course.title}</td>
                <td className="px-5 py-4 text-[#5f719e]">{course.category}</td>
                <td className="px-5 py-4 text-[#5f719e]">
                  <span title={Number(course.price || 0) === 0 ? "Course" : "Additional Course"}>
                    {Number(course.price || 0) === 0 ? "C" : "AC"}
                  </span>
                </td>
                <td className="px-5 py-4 text-[#5f719e]">{course.moduleCount ?? 0}</td>
                <td className="px-5 py-4 text-[#5f719e]">{course.lessonCount ?? 0}</td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
                      course.status === "published"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {course.status || "draft"}
                  </span>
                </td>
                <td className="px-5 py-4 text-[#5f719e]">{formatDate(course.createdAt)}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/admin/course/edit/${course._id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#c8d3ef] bg-[#eef1f7] px-3 py-1.5 text-xs font-semibold text-[#10246d] transition hover:bg-[#e2e9f9]"
                    >
                      <EditIcon />
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => onDelete(course)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      <DeleteIcon />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CourseTable;
