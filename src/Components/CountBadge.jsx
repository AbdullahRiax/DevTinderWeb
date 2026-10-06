import { formatCount } from "../utils/notificationsSlice.js";

const CountBadge = ({ count, label, className = "" }) =>
  count > 0 ? (
    <span
      aria-label={`${count} ${label}`}
      className={`inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-pink-500 px-1.5 text-[11px] font-bold leading-none text-white shadow-sm ${className}`}
    >
      {formatCount(count)}
    </span>
  ) : null;

export default CountBadge;
