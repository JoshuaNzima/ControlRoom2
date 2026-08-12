interface Props {
  label: string;
  title: string;
  description?: string;
  align?: "center" | "left";
}

export default function SectionHeading({
  label,
  title,
  description,
  align = "center",
}: Props) {
  return (
    <div className={`max-w-3xl ${align === "center" ? "mx-auto text-center" : "text-left"}`}>
      <span className="inline-block text-xs font-semibold tracking-widest uppercase text-coin-gold bg-coin-gold/10 px-4 py-1.5 rounded-full mb-4">
        {label}
      </span>
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-coin-text">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base md:text-lg text-coin-muted leading-relaxed max-w-2xl">
          {description}
        </p>
      )}
    </div>
  );
}
