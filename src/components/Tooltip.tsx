interface TooltipProps {
  title: string;
  description?: string;
}

export const Tooltip = ({ title, description }: TooltipProps) => (
  <div className="rounded-xl border border-white/20 bg-black/80 p-4 text-sm text-white shadow-lg">
    <h3 className="text-base font-semibold">{title}</h3>
    {description ? <p className="mt-1 text-white/70">{description}</p> : null}
  </div>
);

export default Tooltip;
