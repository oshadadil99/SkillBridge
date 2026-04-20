function PageHeader({ label = "LMS ADMINISTRATION", title }) {
  return (
    <div className="px-6 py-6 md:px-10">
      <p className="text-xs tracking-widest uppercase text-[#6c7da7]">{label}</p>
      <h1 className="mb-4 mt-2 font-serif text-3xl font-bold text-[#112765]">{title}</h1>
    </div>
  );
}

export default PageHeader;
