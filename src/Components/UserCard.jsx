import { useRef, useState } from "react";

const SWIPE_THRESHOLD = 110;
const EXIT_DURATION_MS = 280;

const UserCard = ({ user, onSwipe, disabled = false }) => {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exitDirection, setExitDirection] = useState(null);
  const [failedImage, setFailedImage] = useState(null);
  const startXRef = useRef(0);

  const swipeable = typeof onSwipe === "function" && !disabled;
  const { firstName = "", lastName = "", image, skills = [] } = user;
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  const swipe = (direction) => {
    if (!swipeable || exitDirection) return;
    setExitDirection(direction);
    setTimeout(() => onSwipe(direction), EXIT_DURATION_MS);
  };

  const handlePointerDown = (e) => {
    if (!swipeable || exitDirection) return;
    startXRef.current = e.clientX;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!dragging) return;
    setDragX(e.clientX - startXRef.current);
  };

  const handlePointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    if (dragX > SWIPE_THRESHOLD) swipe("right");
    else if (dragX < -SWIPE_THRESHOLD) swipe("left");
    else setDragX(0);
  };

  const offsetX = exitDirection ? (exitDirection === "right" ? 1 : -1) * window.innerWidth : dragX;
  const likeOpacity = Math.min(Math.max(offsetX / SWIPE_THRESHOLD, 0), 1);
  const nopeOpacity = Math.min(Math.max(-offsetX / SWIPE_THRESHOLD, 0), 1);

  return (
    <div className="w-full max-w-sm">
      <article
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          transform: `translateX(${offsetX}px) rotate(${offsetX / 18}deg)`,
          transition: dragging ? "none" : `transform ${EXIT_DURATION_MS}ms ease-out`,
        }}
        className={`relative overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-xl select-none ${
          swipeable ? "cursor-grab touch-pan-y active:cursor-grabbing" : ""
        }`}
      >
        <div className="relative aspect-[4/5] w-full bg-gradient-to-br from-pink-500 to-violet-600">
          {image && image !== failedImage ? (
            <img
              src={image}
              alt={`${firstName} ${lastName}`}
              draggable={false}
              onError={() => setFailedImage(image)}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-7xl font-bold text-white/90">
              {initials}
            </span>
          )}

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 pt-16 text-white">
            <p className="text-2xl font-bold leading-tight">
              {firstName} {lastName}
            </p>
            {skills.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Skills">
                {skills.map((skill) => (
                  <li
                    key={skill}
                    className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-white/70">No skills added yet</p>
            )}
          </div>

          {swipeable && (
            <>
              <span
                style={{ opacity: likeOpacity }}
                className="pointer-events-none absolute left-5 top-6 -rotate-12 rounded-lg border-4 border-green-400 px-3 py-1 text-2xl font-extrabold tracking-wider text-green-400"
              >
                INTERESTED
              </span>
              <span
                style={{ opacity: nopeOpacity }}
                className="pointer-events-none absolute right-5 top-6 rotate-12 rounded-lg border-4 border-red-500 px-3 py-1 text-2xl font-extrabold tracking-wider text-red-500"
              >
                IGNORE
              </span>
            </>
          )}
        </div>
      </article>

      {typeof onSwipe === "function" && (
        <div className="mt-6 flex items-center justify-center gap-8">
          <button
            type="button"
            onClick={() => swipe("left")}
            disabled={!swipeable || !!exitDirection}
            aria-label={`Ignore ${firstName}`}
            className="btn btn-circle btn-lg border-red-200 bg-white text-red-500 shadow-md transition hover:scale-110 hover:bg-red-50 disabled:opacity-50"
          >
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => swipe("right")}
            disabled={!swipeable || !!exitDirection}
            aria-label={`Interested in ${firstName}`}
            className="btn btn-circle btn-lg border-0 bg-gradient-to-br from-pink-500 to-violet-600 text-white shadow-md transition hover:scale-110 disabled:opacity-50"
          >
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 21s-7.5-4.6-10-9.3C.4 8.4 2.3 4 6.3 4c2.3 0 3.9 1.4 5.7 3.4C13.8 5.4 15.4 4 17.7 4c4 0 5.9 4.4 4.3 7.7C19.5 16.4 12 21 12 21Z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserCard;
