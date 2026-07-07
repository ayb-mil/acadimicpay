export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "text-center" : "text-left"}>
      {eyebrow && (
        <p
          className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-ocre-600 ${
            align === "center" ? "justify-center" : ""
          }`}
        >
          <span className="h-px w-6 bg-ocre-400" aria-hidden="true" />
          {eyebrow}
        </p>
      )}
      <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-encre sm:text-[2rem]">
        {title}
      </h2>
      {description && (
        <p
          className={`mt-3 max-w-2xl text-base leading-relaxed text-ardoise sm:text-lg ${
            align === "center" ? "mx-auto" : ""
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
