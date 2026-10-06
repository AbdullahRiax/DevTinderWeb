const VARIANTS = {
  primary:
    "border-0 bg-gradient-to-r from-pink-500 to-violet-600 text-white shadow-md hover:from-pink-600 hover:to-violet-700 hover:shadow-lg",
  secondary: "btn-outline border-violet-500 text-violet-600 hover:bg-violet-50",
  ghost: "btn-ghost",
  danger: "btn-error text-white",
};

const SIZES = {
  sm: "btn-sm",
  md: "btn-md",
  lg: "btn-lg",
};

const Button = ({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  disabled = false,
  className = "",
  ...rest
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`btn ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? "w-full" : ""} transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...rest}
    >
      {loading && <span className="loading loading-spinner loading-sm" />}
      {children}
    </button>
  );
};

export default Button;
