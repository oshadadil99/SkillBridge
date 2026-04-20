import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api, { UPLOADS_BASE_URL } from "../../api/axios";

const initialForm = {
  title: "",
  description: "",
  category: "",
  thumbnail: "",
  price: "",
  courseType: "Course",
  status: "draft"
};

const defaultLessonDraft = {
  title: "",
  contentType: "text",
  content: "",
  fileUrl: ""
};

function EditCourse() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [structureLoading, setStructureLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modules, setModules] = useState([]);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [thumbnailError, setThumbnailError] = useState("");
  const [_lessonFileUploadingByModule, setLessonFileUploadingByModule] = useState({});
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleSubmitting, setModuleSubmitting] = useState(false);
  const [moduleContentInput, setModuleContentInput] = useState("");
  const [lessonDraftByModule, setLessonDraftByModule] = useState({});
  const [lessonSubmittingByModule, setLessonSubmittingByModule] = useState({});

  const getLessonDraft = (moduleId) => lessonDraftByModule[moduleId] || defaultLessonDraft;

  const setLessonDraft = (moduleId, payload) => {
    setLessonDraftByModule((prev) => ({
      ...prev,
      [moduleId]: {
        ...getLessonDraft(moduleId),
        ...payload
      }
    }));
  };

  const setLessonFileUploading = (moduleId, value) => {
    setLessonFileUploadingByModule((prev) => ({ ...prev, [moduleId]: value }));
  };

  const handleThumbnailSelect = async (e) => {
    setThumbnailError("");
    const file = e.target?.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!['png','jpg','jpeg','webp'].includes(ext)) {
      setThumbnailError('Invalid image type. Allowed: png, jpg, jpeg, webp.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setThumbnailError('Image size exceeds 5MB limit');
      return;
    }

    const form = new FormData();
    form.append('thumbnail', file);

    try {
      setThumbnailUploading(true);
      const resp = await api.post('/files/upload-thumbnail', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const fileUrl = resp.data?.fileUrl || resp.data?.data?.fileUrl;
      if (fileUrl) {
        setFormData((prev) => ({ ...prev, thumbnail: fileUrl }));
        setThumbnailPreview(`${UPLOADS_BASE_URL}${fileUrl.replace('/uploads','')}`);
        alert('Thumbnail uploaded');
      }
    } catch (err) {
      const msg = err?.message || 'Upload failed';
      setThumbnailError(msg);
      alert(msg);
    } finally {
      setThumbnailUploading(false);
    }
  };

  const _handleLessonFileSelect = async (moduleId, e) => {
    const file = e.target?.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!['pdf','doc','docx','mp4','mov'].includes(ext)) {
      alert('Invalid file type. Allowed: pdf, doc, docx, mp4, mov');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('File size exceeds 50MB limit');
      return;
    }

    const fd = new FormData();
    fd.append('file', file);

    try {
      setLessonFileUploading(moduleId, true);
      const resp = await api.post('/files/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const fileUrl = resp.data?.data?.fileUrl || resp.data?.fileUrl;
      const contentType = resp.data?.data?.contentType || 'document';
      if (fileUrl) {
        setLessonDraft(moduleId, { fileUrl, contentType });
        alert('File uploaded for lesson draft');
      }
    } catch (err) {
      alert(err?.message || 'Upload failed');
    } finally {
      setLessonFileUploading(moduleId, false);
    }
  };

  const setLessonSubmitting = (moduleId, value) => {
    setLessonSubmittingByModule((prev) => ({
      ...prev,
      [moduleId]: value
    }));
  };

  const getNormalizedOrderPayload = (items = []) =>
    items.map((item, index) => ({
      id: item._id,
      order: index + 1
    }));

  const fetchStructure = async (courseId) => {
    setStructureLoading(true);

    try {
      // load modules then load lessons for each module (keeps client-side structure consistent)
      const modulesResponse = await api.get(`/modules/${courseId}`);
      const moduleList = Array.isArray(modulesResponse.data?.data)
        ? modulesResponse.data.data
        : [];

      const lessonResponses = await Promise.all(
        moduleList.map((moduleItem) =>
          api
            .get(`/lessons/${moduleItem._id}`)
            .then((response) => ({
              moduleId: moduleItem._id,
              lessons: Array.isArray(response.data?.data) ? response.data.data : []
            }))
            .catch(() => ({ moduleId: moduleItem._id, lessons: [] }))
        )
      );

      const lessonsMap = {};
      lessonResponses.forEach(({ moduleId, lessons }) => {
        lessonsMap[moduleId] = lessons;
      });

      const modulesWithLessons = moduleList.map((m) => ({ ...m, lessons: lessonsMap[m._id] || [] }));
      setModules(modulesWithLessons);
    } catch {
      setModules([]);
    } finally {
      setStructureLoading(false);
    }
  };

  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);

      try {
        const response = await api.get(`/courses/${id}`);
        const course = response.data?.data;

        if (!course) {
          alert("Course not found");
          navigate("/admin/course");
          return;
        }

        setFormData({
          title: course.title || "",
          description: course.description || "",
          category: course.category || "",
          thumbnail: course.thumbnail || "",
          price: course.price != null ? String(course.price) : "",
          // price === 0 => Course (FREE), otherwise Additional Course
          courseType: course.price === 0 ? "Course" : "Additional Course",
          status: course.status || "draft"
        });

        if (course.thumbnail) {
          setThumbnailPreview(`${UPLOADS_BASE_URL}${course.thumbnail.replace('/uploads','')}`);
        }

        await fetchStructure(id);
      } catch (error) {
        alert(error.message || "Failed to fetch course");
        navigate("/admin/course");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCourseTypeChange = (event) => {
    const value = event.target?.value;
    setFormData((prev) => ({
      ...prev,
      courseType: value,
      // lock price to 0 for Course, clear for Additional Course to allow entry
      price: value === "Course" ? "0" : ""
    }));
  };

  const handlePriceChange = (event) => {
    let value = event.target?.value || "";
    // allow only digits (integer amounts)
    value = value.replace(/[^0-9]/g, "");
    setFormData((prev) => ({ ...prev, price: value }));
  };

  const handleUpdateModuleLocal = (moduleId, field, value) => {
    setModules((prev) =>
      prev.map((moduleItem) =>
        moduleItem._id === moduleId
          ? {
              ...moduleItem,
              [field]: value
            }
          : moduleItem
      )
    );
  };

  const handleCreateModule = async (event) => {
    event.preventDefault();

    if (!moduleTitle.trim()) {
      alert("Module title is required");
      return;
    }

    try {
      setModuleSubmitting(true);

      await api.post("/modules", {
        title: moduleTitle.trim(),
        content: String(moduleContentInput || "").trim(),
        courseId: id,
        order: modules.length + 1
      });

      setModuleTitle("");
      setModuleContentInput("");
      await fetchStructure(id);
    } catch (error) {
      alert(error.message || "Failed to create module");
    } finally {
      setModuleSubmitting(false);
    }
  };

  const handleSaveModule = async (moduleItem, index) => {
    try {
      await api.put(`/modules/${moduleItem._id}`, {
        title: String(moduleItem.title || "").trim(),
        content: String(moduleItem.content || "").trim(),
        order: Number(moduleItem.order) || index + 1
      });

      await fetchStructure(id);
    } catch (error) {
      alert(error.message || "Failed to update module");
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm("Delete this module and all lessons inside it?")) {
      return;
    }

    try {
      await api.delete(`/modules/${moduleId}`);
      await fetchStructure(id);
    } catch (error) {
      alert(error.message || "Failed to delete module");
    }
  };

  const _handleReorderModules = async (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= modules.length) {
      return;
    }

    const reordered = [...modules];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    try {
      await api.put("/modules/reorder", {
        courseId: id,
        modules: getNormalizedOrderPayload(reordered)
      });

      await fetchStructure(id);
    } catch (error) {
      alert(error.message || "Failed to reorder modules");
    }
  };

  const handleLessonLocalChange = (moduleId, lessonId, field, value) => {
    setModules((prev) =>
      prev.map((moduleItem) =>
        moduleItem._id !== moduleId
          ? moduleItem
          : {
              ...moduleItem,
              lessons: (moduleItem.lessons || []).map((lessonItem) =>
                lessonItem._id === lessonId
                  ? {
                      ...lessonItem,
                      [field]: value
                    }
                  : lessonItem
              )
            }
      )
    );
  };

  const handleCreateLesson = async (moduleId) => {
    const draft = getLessonDraft(moduleId);

    if (!draft.title.trim()) {
      alert("Lesson title is required");
      return;
    }

    if (draft.contentType === "text" && !String(draft.content || "").trim()) {
      alert("Text content is required for text lessons");
      return;
    }

    if (
      ["video", "pdf", "document"].includes(draft.contentType) &&
      !String(draft.fileUrl || "").trim()
    ) {
      alert("File URL is required for video/pdf/document lessons");
      return;
    }

    try {
      setLessonSubmitting(moduleId, true);

      const parentModule = modules.find((moduleItem) => moduleItem._id === moduleId);
      const currentLessons = parentModule?.lessons || [];

      await api.post("/lessons", {
        title: draft.title.trim(),
        moduleId,
        contentType: draft.contentType,
        content: String(draft.content || "").trim(),
        fileUrl: String(draft.fileUrl || "").trim(),
        order: currentLessons.length + 1
      });

      setLessonDraft(moduleId, defaultLessonDraft);
      await fetchStructure(id);
    } catch (error) {
      alert(error.message || "Failed to create lesson");
    } finally {
      setLessonSubmitting(moduleId, false);
    }
  };

  const handleSaveLesson = async (moduleId, lessonItem, index) => {
    try {
      await api.put(`/lessons/${lessonItem._id}`, {
        title: String(lessonItem.title || "").trim(),
        moduleId,
        contentType: lessonItem.contentType,
        content: String(lessonItem.content || "").trim(),
        fileUrl: String(lessonItem.fileUrl || "").trim(),
        order: Number(lessonItem.order) || index + 1
      });

      await fetchStructure(id);
    } catch (error) {
      alert(error.message || "Failed to update lesson");
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm("Delete this lesson?")) {
      return;
    }

    try {
      await api.delete(`/lessons/${lessonId}`);
      await fetchStructure(id);
    } catch (error) {
      alert(error.message || "Failed to delete lesson");
    }
  };

  const _handleReorderLessons = async (moduleId, fromIndex, toIndex) => {
    const parentModule = modules.find((moduleItem) => moduleItem._id === moduleId);
    const moduleLessons = parentModule?.lessons || [];

    if (toIndex < 0 || toIndex >= moduleLessons.length) {
      return;
    }

    const reordered = [...moduleLessons];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    try {
      await api.put("/lessons/reorder", {
        moduleId,
        lessons: getNormalizedOrderPayload(reordered)
      });

      await fetchStructure(id);
    } catch (error) {
      alert(error.message || "Failed to reorder lessons");
    }
  };

  const validate = () => {
    if (!formData.title.trim()) {
      alert("Title is required");
      return false;
    }

    if (!formData.description.trim()) {
      alert("Description is required");
      return false;
    }

    // Price is required and must be numeric for Additional Course
    if (formData.courseType === "Additional Course") {
      if (!String(formData.price || "").trim()) {
        alert("Price is required for Additional Course");
        return false;
      }

      if (!/^\d+$/.test(String(formData.price).trim())) {
        alert("Price must be a number");
        return false;
      }
    }

    if (!String(formData.thumbnail || "").trim()) {
      alert("Course image is required");
      return false;
    }

    if (!formData.category.trim()) {
      alert("Category is required");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setSubmitting(true);
      const priceValue = formData.courseType === "Course" ? 0 : Number(formData.price);
      await api.put(`/courses/${id}`, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category.trim(),
        thumbnail: formData.thumbnail.trim(),
        price: priceValue,
        status: formData.status
      });

      alert("Course updated successfully");
      navigate("/admin/course");
    } catch (error) {
      alert(error.message || "Failed to update course");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#d7d2c7] bg-[#fffdfa] p-10 text-center text-sm font-medium text-[#6c7da7] shadow-sm">
        Loading course details...
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6">
      <div className="rounded-2xl border border-[#d7d2c7] bg-[#fffdfa] p-6 shadow-sm md:p-8">
        <h3 className="text-xl font-semibold text-[#112765]">Edit Course</h3>
        <p className="mt-1 text-sm text-[#6c7da7]">Update the course details and save changes.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium text-[#1c2f6f]">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            className="w-full rounded-xl border border-[#c8c4ba] px-4 py-2.5 text-sm outline-none transition focus:border-[#10246d] focus:ring-2 focus:ring-[#10246d]/20"
            placeholder="Enter course title"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium text-[#1c2f6f]">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows="4"
            value={formData.description}
            onChange={handleChange}
            className="w-full rounded-xl border border-[#c8c4ba] px-4 py-2.5 text-sm outline-none transition focus:border-[#10246d] focus:ring-2 focus:ring-[#10246d]/20"
            placeholder="Enter course description"
            required
          />
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium text-[#1c2f6f]">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full rounded-xl border border-[#c8c4ba] px-4 py-2.5 text-sm outline-none transition focus:border-[#10246d] focus:ring-2 focus:ring-[#10246d]/20"
              required
            >
              <option value="">--Select your Category--</option>
              <option value="Software Engineering">Software Engineering</option>
              <option value="Systems Engineering">Systems Engineering</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Cyber Security">Cyber Security</option>
              <option value="Data Science">Data Science</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="courseType" className="text-sm font-medium text-[#1c2f6f]">
              Type
            </label>
            <select
              id="courseType"
              name="courseType"
              value={formData.courseType}
              onChange={handleCourseTypeChange}
              className="w-full rounded-xl border border-[#c8c4ba] px-4 py-2.5 text-sm outline-none transition focus:border-[#10246d] focus:ring-2 focus:ring-[#10246d]/20"
            >
              <option value="Course">Course</option>
              <option value="Additional Course">Additional Course</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="price" className="text-sm font-medium text-[#1c2f6f]">
              Price
            </label>
            {formData.courseType === "Course" ? (
              <input
                id="price"
                name="price"
                type="text"
                value={"FREE"}
                disabled
                className="w-full rounded-xl border border-[#c8c4ba] px-4 py-2.5 text-sm outline-none bg-[#f3f4f6] text-[#6c7da7]"
                placeholder="FREE"
              />
            ) : (
              <input
                id="price"
                name="price"
                type="text"
                inputMode="numeric"
                value={formData.price}
                onChange={handlePriceChange}
                pattern="[0-9]*"
                className="w-full rounded-xl border border-[#c8c4ba] px-4 py-2.5 text-sm outline-none transition focus:border-[#10246d] focus:ring-2 focus:ring-[#10246d]/20"
                placeholder="e.g. 1999"
              />
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="status" className="text-sm font-medium text-[#1c2f6f]">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full rounded-xl border border-[#c8c4ba] px-4 py-2.5 text-sm outline-none transition focus:border-[#10246d] focus:ring-2 focus:ring-[#10246d]/20"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="thumbnail" className="text-sm font-medium text-[#1c2f6f]">
            Course Image
          </label>
          <div className="flex items-center gap-3">
            <label htmlFor="thumbnail" className="cursor-pointer">
              <span style={{ color: '#1e40af', textDecoration: 'underline dotted' }}>
                choose file (no file chosen)
              </span>
            </label>
            <input
              id="thumbnail"
              name="thumbnail"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleThumbnailSelect}
              disabled={thumbnailUploading}
              className="hidden"
            />
            {thumbnailUploading ? <span className="text-sm text-[#6c7da7]">Uploading...</span> : null}
          </div>

          {thumbnailPreview || formData.thumbnail ? (
            <div className="mt-2">
              <img
                src={thumbnailPreview || `${UPLOADS_BASE_URL}${formData.thumbnail.replace('/uploads','')}`}
                alt="thumbnail preview"
                className="h-24 w-24 rounded-md object-cover border"
              />
            </div>
          ) : null}

          {thumbnailError ? <p className="text-sm text-rose-600">{thumbnailError}</p> : null}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-xl bg-[#10246d] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d327f] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Updating..." : "Update Course"}
        </button>
        </form>
      </div>

      <div className="rounded-2xl border border-[#d7d2c7] bg-[#fffdfa] p-6 shadow-sm md:p-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-lg font-semibold text-[#112765]">Modules and Lessons</h4>
            <p className="text-sm text-[#6c7da7]">Add, edit, and delete modules/lessons for this course.</p>
          </div>

          <button
            type="button"
            onClick={() => fetchStructure(id)}
            disabled={structureLoading}
            className="inline-flex items-center justify-center rounded-xl border border-[#c8c4ba] bg-[#fffdfa] px-4 py-2 text-xs font-semibold text-[#1c2f6f] transition hover:border-[#10246d] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {structureLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <form onSubmit={handleCreateModule} className="mt-5 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row items-start">
            <input
              type="text"
              value={moduleTitle}
              onChange={(event) => setModuleTitle(event.target.value)}
              className="w-full rounded-xl border border-[#c8c4ba] px-4 py-2.5 text-sm outline-none transition focus:border-[#10246d] focus:ring-2 focus:ring-[#10246d]/20"
              placeholder="New module title"
            />

            <textarea
              value={moduleContentInput}
              onChange={(event) => setModuleContentInput(event.target.value)}
              rows={2}
              className="w-full min-w-0 rounded-xl border border-[#c8c4ba] px-3 py-2 text-sm outline-none transition focus:border-[#10246d] focus:ring-2 focus:ring-[#10246d]/20"
              placeholder="Optional module content"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={moduleSubmitting}
              className="inline-flex min-w-36 items-center justify-center rounded-xl bg-[#10246d] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d327f] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {moduleSubmitting ? "Adding..." : "Add Module"}
            </button>
          </div>
        </form>

        <div className="mt-4 space-y-4">
          {structureLoading ? (
            <div className="rounded-xl border border-[#d7d2c7] bg-[#f8f5ef] p-4 text-sm text-[#6c7da7]">
              Loading modules and lessons...
            </div>
          ) : modules.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#c8c4ba] p-4 text-sm text-[#6c7da7]">
              No modules or lessons added yet.
            </div>
          ) : (
            modules.map((moduleItem, moduleIndex) => {
              const moduleLessons = Array.isArray(moduleItem.lessons) ? moduleItem.lessons : [];
              const lessonDraft = getLessonDraft(moduleItem._id);

              return (
                <article key={moduleItem._id} className="rounded-xl border border-[#d7d2c7] p-4">
                  <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                    <input
                      type="text"
                      value={moduleItem.title || ""}
                      onChange={(event) =>
                        handleUpdateModuleLocal(moduleItem._id, "title", event.target.value)
                      }
                      className="w-full rounded-lg border border-[#c8c4ba] px-3 py-2 text-sm outline-none ring-indigo-500 focus:border-indigo-500 focus:ring-2"
                      placeholder="Module title"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveModule(moduleItem, moduleIndex)}
                        className="rounded-lg border border-[#c8d3ef] bg-[#eef1f7] px-2.5 py-1.5 text-xs font-semibold text-[#10246d] hover:bg-[#e2e9f9]"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteModule(moduleItem._id)}
                        className="rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <textarea
                      rows={3}
                      value={moduleItem.content || ""}
                      onChange={(event) =>
                        handleUpdateModuleLocal(moduleItem._id, "content", event.target.value)
                      }
                      className="w-full rounded-lg border border-[#c8c4ba] px-3 py-2 text-sm outline-none ring-indigo-500 focus:border-indigo-500 focus:ring-2"
                      placeholder="Optional module content"
                    />
                  </div>

                  <div className="mt-4 rounded-lg border border-[#d7d2c7] bg-[#f8f5ef] p-3">
                    <p className="mb-2 text-sm font-medium text-[#1c2f6f]">Lessons</p>

                    <div className="grid gap-2 md:grid-cols-2">
                      <input
                        type="text"
                        value={lessonDraft.title}
                        onChange={(event) =>
                          setLessonDraft(moduleItem._id, { title: event.target.value })
                        }
                        className="w-full rounded-lg border border-[#c8c4ba] px-3 py-2 text-sm outline-none ring-indigo-500 focus:border-indigo-500 focus:ring-2"
                        placeholder="Lesson title"
                      />

                      <select
                        value={lessonDraft.contentType}
                        onChange={(event) =>
                          setLessonDraft(moduleItem._id, { contentType: event.target.value })
                        }
                        className="w-full rounded-lg border border-[#c8c4ba] px-3 py-2 text-sm outline-none ring-indigo-500 focus:border-indigo-500 focus:ring-2"
                      >
                        <option value="text">Text</option>
                        <option value="video">Video</option>
                        <option value="pdf">PDF</option>
                        <option value="document">Document</option>
                      </select>

                        <textarea
                          value={lessonDraft.content}
                          onChange={(event) =>
                            setLessonDraft(moduleItem._id, { content: event.target.value })
                          }
                          rows={4}
                          className="w-full rounded-lg border border-[#c8c4ba] px-3 py-2 text-sm outline-none ring-indigo-500 focus:border-indigo-500 focus:ring-2"
                          placeholder="Text content (required for text type)"
                        />

                      <input
                        type="text"
                        value={lessonDraft.fileUrl}
                        onChange={(event) =>
                          setLessonDraft(moduleItem._id, { fileUrl: event.target.value })
                        }
                        className="w-full rounded-lg border border-[#c8c4ba] px-3 py-2 text-sm outline-none ring-indigo-500 focus:border-indigo-500 focus:ring-2"
                        placeholder="File URL (required for video/pdf/document)"
                      />
                    </div>

                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => handleCreateLesson(moduleItem._id)}
                        disabled={Boolean(lessonSubmittingByModule[moduleItem._id])}
                        className="rounded-lg bg-[#10246d] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1d327f] disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {lessonSubmittingByModule[moduleItem._id] ? "Adding..." : "Add Lesson"}
                      </button>
                    </div>

                    <div className="mt-3 space-y-2">
                      {moduleLessons.length > 0 ? (
                        moduleLessons.map((lessonItem, lessonIndex) => (
                          <div
                            key={lessonItem._id}
                            className="rounded-lg border border-[#d7d2c7] bg-[#fffdfa] p-3"
                          >
                            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                              <input
                                type="text"
                                value={lessonItem.title || ""}
                                onChange={(event) =>
                                  handleLessonLocalChange(
                                    moduleItem._id,
                                    lessonItem._id,
                                    "title",
                                    event.target.value
                                  )
                                }
                                className="rounded-lg border border-[#c8c4ba] px-3 py-2 text-xs outline-none ring-indigo-500 focus:border-indigo-500 focus:ring-2"
                                placeholder="Lesson title"
                              />

                              <select
                                value={lessonItem.contentType || "text"}
                                onChange={(event) =>
                                  handleLessonLocalChange(
                                    moduleItem._id,
                                    lessonItem._id,
                                    "contentType",
                                    event.target.value
                                  )
                                }
                                className="rounded-lg border border-[#c8c4ba] px-3 py-2 text-xs outline-none ring-indigo-500 focus:border-indigo-500 focus:ring-2"
                              >
                                <option value="text">Text</option>
                                <option value="video">Video</option>
                                <option value="pdf">PDF</option>
                                <option value="document">Document</option>
                              </select>

                              <textarea
                                value={lessonItem.content || ""}
                                onChange={(event) =>
                                  handleLessonLocalChange(
                                    moduleItem._id,
                                    lessonItem._id,
                                    "content",
                                    event.target.value
                                  )
                                }
                                rows={4}
                                className="rounded-lg border border-[#c8c4ba] px-3 py-2 text-xs outline-none ring-indigo-500 focus:border-indigo-500 focus:ring-2"
                                placeholder="Content"
                              />

                              <input
                                type="text"
                                value={lessonItem.fileUrl || ""}
                                onChange={(event) =>
                                  handleLessonLocalChange(
                                    moduleItem._id,
                                    lessonItem._id,
                                    "fileUrl",
                                    event.target.value
                                  )
                                }
                                className="rounded-lg border border-[#c8c4ba] px-3 py-2 text-xs outline-none ring-indigo-500 focus:border-indigo-500 focus:ring-2"
                                placeholder="File URL"
                              />
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleSaveLesson(moduleItem._id, lessonItem, lessonIndex)}
                                className="rounded-lg border border-[#c8d3ef] bg-[#eef1f7] px-2 py-1 text-xs font-semibold text-[#10246d] hover:bg-[#e2e9f9]"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLesson(lessonItem._id)}
                                className="rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-[#6c7da7]">No lessons in this module yet.</p>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

export default EditCourse;
