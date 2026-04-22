# Course Creation and Deletion Validations

This document summarizes the validations added for course creation, publishing, lesson creation, and course deletion in the SkillBridge LMS.

## 1. Course Form Validations

File: `client/src/pages/admin/CreateCourse.jsx`

The admin course creation form validates these fields before sending data to the backend:

- Course title is required.
- Course description is required.
- Category is required.
- Course image is required.
- Additional courses must have a numeric price.

```jsx
const validate = () => {
  if (!formData.title.trim()) {
    alert("Title is required");
    return false;
  }

  if (!formData.description.trim()) {
    alert("Description is required");
    return false;
  }

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
```

## 2. Module Validation

File: `client/src/pages/admin/CreateCourse.jsx`

Before adding a module, the module title is required.

```jsx
if (!moduleTitle.trim()) {
  alert("Module title is required");
  return;
}
```

## 3. Lesson Validation

File: `client/src/pages/admin/CreateCourse.jsx`

Before adding a lesson, the system validates the lesson based on its content type:

- Lesson title is required.
- Text lessons must have text content.
- Video, PDF, and document lessons must have a file URL.

```jsx
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
```

## 4. Publish Validation

File: `backend/controllers/courseController.js`

A course cannot be published unless it has at least one module and every module has at least one lesson.

```js
const PUBLISH_VALIDATION_MESSAGE =
  "Course must contain at least one module and lesson before publishing";

const validateCourseForPublish = async (courseId) => {
  const modules = await Module.find({ courseId }).select("_id").lean();

  if (modules.length === 0) {
    return false;
  }

  const moduleIds = modules.map((moduleItem) => moduleItem._id);

  const lessonCountByModule = await Lesson.aggregate([
    {
      $match: {
        moduleId: { $in: moduleIds }
      }
    },
    {
      $group: {
        _id: "$moduleId",
        count: { $sum: 1 }
      }
    }
  ]);

  return lessonCountByModule.length === moduleIds.length;
};
```

This validation is applied when updating a course status to `published`:

```js
if (payload.status === "published") {
  const canPublish = await validateCourseForPublish(req.params.id);

  if (!canPublish) {
    return res
      .status(400)
      .json({ success: false, message: PUBLISH_VALIDATION_MESSAGE });
  }
}
```

## 5. Course Deletion Validation

File: `backend/controllers/courseController.js`

An admin cannot delete a course if:

- A user has already enrolled in or purchased the course.
- A successful payment record exists for that course.

```js
const courseId = String(course._id);

const [enrolledUser, paymentRecord] = await Promise.all([
  User.findOne({
    purchasedCourses: courseId
  })
    .select("name email")
    .lean(),
  Payment.findOne({
    courseId,
    paymentStatus: "Success"
  })
    .select("transactionId userEmail")
    .lean()
]);

if (enrolledUser || paymentRecord) {
  return res.status(409).json({
    success: false,
    message: "This course cannot be deleted because a user is already enrolled in it."
  });
}
```

## Important Note

The module and lesson requirement is enforced when publishing a course. The current flow allows the admin to create the course first, then add modules and lessons, and then publish it.
