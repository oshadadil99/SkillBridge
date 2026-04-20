import { useState } from "react";
import { Link } from "react-router-dom";

import { UPLOADS_BASE_URL } from "../api/axios";

const resolveThumbnailUrl = (value) => {
	const raw = String(value || "").trim();

	if (!raw) {
		return "";
	}

	if (/^https?:\/\//i.test(raw)) {
		return raw;
	}

	if (/^www\./i.test(raw)) {
		return `https://${raw}`;
	}

	if (raw.startsWith("/uploads/")) {
		return `${UPLOADS_BASE_URL}${raw.replace(/^\/uploads/, "")}`;
	}

	if (raw.startsWith("uploads/")) {
		return `${UPLOADS_BASE_URL}/${raw.replace(/^uploads\//, "")}`;
	}

	return raw;
};

function CourseCard({ course, isEnrolled = false, onRemove = null }) {
	const [hasImageError, setHasImageError] = useState(false);

	const thumbnail = resolveThumbnailUrl(course?.thumbnail);
	const showImage = thumbnail && !hasImageError;
	const numericPrice = Number(course?.price);
	const displayPrice = Number.isFinite(numericPrice) && numericPrice > 0 ? `$${numericPrice}` : "Free";

	return (
		<Link
			to={`/course/${course._id}`}
			className="group relative block overflow-hidden rounded-2xl border border-[#d7d2c7] bg-[#fffdfa] shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#c1b8a6] hover:shadow-[0_20px_48px_rgba(11,25,87,0.14)]"
		>
			{showImage ? (
				<img
					src={encodeURI(thumbnail)}
					alt={`${course.title} thumbnail`}
					onError={() => setHasImageError(true)}
					loading="lazy"
					className="h-56 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
				/>
			) : (
				<div className="flex h-56 w-full items-center justify-center bg-gradient-to-br from-[#0b1957] via-[#1e3a8a] to-[#2d54b8] text-sm font-semibold text-white/80">
					No Thumbnail
				</div>
			)}

			{isEnrolled && onRemove ? (
				<button
					type="button"
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						try {
							onRemove(course._id);
						} catch {
							// ignore
						}
					}}
					aria-label="Remove enrollment"
					title="Remove enrollment"
					className="absolute left-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-red-600 shadow hover:bg-red-50"
				>
					✕
				</button>
			) : null}

			{isEnrolled ? (
				<span className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow">
					<svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
						<path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd" />
					</svg>
					Purchased
				</span>
			) : null}

			<div className="space-y-3 p-4">
				<p className="inline-flex rounded-full border border-[#d7d2c7] bg-[#f6f2ea] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#112765]">
					{course.category || "Uncategorized"}
				</p>
				<h3 className="line-clamp-2 text-lg font-bold text-[#112765]">{course.title}</h3>
				<div className="flex items-center justify-between border-t border-[#e9e4d8] pt-3">
					<p className="text-lg font-extrabold text-[#112765]">{displayPrice}</p>
					<span className="text-xs font-semibold text-[#6c7da7]">View details →</span>
				</div>
			</div>
		</Link>
	);
}

export default CourseCard;
