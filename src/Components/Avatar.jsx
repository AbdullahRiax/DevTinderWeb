import { useState } from "react";

const Avatar = ({ user, className = "h-10 w-10 text-sm" }) => {
  const [failedImage, setFailedImage] = useState(null);
  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();
  const showImage = user?.image && user.image !== failedImage;

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-pink-500 to-violet-600 font-semibold text-white ${className}`}
    >
      {showImage ? (
        <img
          src={user.image}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailedImage(user.image)}
        />
      ) : (
        initials
      )}
    </span>
  );
};

export default Avatar;
