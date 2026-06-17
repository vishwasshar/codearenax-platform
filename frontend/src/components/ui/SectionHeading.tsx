import Badge from "./Badge";

interface SectionHeadingProps {
  badge?: string;
  title: string;
  subtitle?: string;
}

export default function SectionHeading({
  badge,
  title,
  subtitle,
}: SectionHeadingProps) {
  return (
    <div className="mx-auto mb-16 max-w-3xl text-center">
      {badge && (
        <div className="mb-5 flex justify-center">
          <Badge>{badge}</Badge>
        </div>
      )}

      <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
        {title}
      </h2>

      {subtitle && (
        <p className="mt-5 text-lg leading-8 text-slate-400">{subtitle}</p>
      )}
    </div>
  );
}
