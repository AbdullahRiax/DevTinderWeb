export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const NAME_MIN = 3;
export const NAME_MAX = 10;
export const SKILLS_MAX = 20;
export const SKILL_MAX_LENGTH = 30;

export const isValidUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export const validateName = (value, label) => {
  const trimmed = value.trim();
  if (!trimmed) return `${label} is required.`;
  if (trimmed.length < NAME_MIN || trimmed.length > NAME_MAX)
    return `${label} must be ${NAME_MIN} to ${NAME_MAX} characters.`;
  return undefined;
};

export const validateImageUrl = (value) =>
  value.trim() && !isValidUrl(value.trim())
    ? "Enter a valid image URL (http or https)."
    : undefined;
