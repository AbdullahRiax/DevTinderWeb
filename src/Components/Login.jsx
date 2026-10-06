import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import Button from "./Button.jsx";
import InputField from "./InputField.jsx";
import api, { fetchProfile, getErrorMessage } from "../utils/api.js";
import { storeUser } from "../utils/userSlice.js";
import {
  EMAIL_REGEX,
  STRONG_PASSWORD_REGEX,
  validateImageUrl,
  validateName,
} from "../utils/validation.js";
import { ICONS } from "./icons.jsx";

const INITIAL_FORM = {
  firstName: "",
  lastName: "",
  email: "babar@gmail.com",
  password: "Babar123!",
  image: "",
  skills: "",
};

const parseSkills = (skills) =>
  [...new Set(skills.split(",").map((s) => s.trim()).filter(Boolean))];

const validate = (form, isSignup) => {
  const errors = {};

  if (isSignup) {
    const firstNameError = validateName(form.firstName, "First name");
    const lastNameError = validateName(form.lastName, "Last name");
    if (firstNameError) errors.firstName = firstNameError;
    if (lastNameError) errors.lastName = lastNameError;
  }

  const email = form.email.trim();
  if (!email) errors.email = "Email is required.";
  else if (!EMAIL_REGEX.test(email)) errors.email = "Enter a valid email address.";

  if (!form.password) errors.password = "Password is required.";
  else if (isSignup && !STRONG_PASSWORD_REGEX.test(form.password))
    errors.password =
      "Use at least 8 characters with uppercase, lowercase, a number and a symbol.";

  const imageError = isSignup ? validateImageUrl(form.image) : undefined;
  if (imageError) errors.image = imageError;

  return errors;
};

const Login = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const toggleMode = () => {
    setIsSignup((prev) => !prev);
    setFieldErrors({});
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const errors = validate(form, isSignup);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const credentials = { email: form.email.trim(), password: form.password };

    setLoading(true);
    try {
      if (isSignup) {
        await api.post("/signup", {
          ...credentials,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          image: form.image.trim() || null,
          skills: parseSkills(form.skills),
        });
        setIsSignup(false);
        setSuccess("Account created successfully! Please log in.");
      } else {
        await api.post("/login", credentials);
        const profile = await fetchProfile();
        dispatch(storeUser(profile));
        navigate("/feed", { replace: true });
      }
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors && typeof serverErrors === "object") {
        setFieldErrors(serverErrors);
      } else {
        setError(
          getErrorMessage(
            err,
            isSignup ? "Could not create your account." : "Invalid email or password."
          )
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (user) return <Navigate to="/feed" replace />;

  const skillList = parseSkills(form.skills);

  return (
    <section className="flex min-h-[calc(100svh-4rem)] items-center justify-center px-4 py-10 text-left sm:px-6">
      <div className="w-full max-w-md rounded-2xl border border-base-300 bg-base-100 p-6 shadow-xl sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-violet-600 text-3xl shadow-md">
            👩‍💻
          </div>
          <h2>{isSignup ? "Create your account" : "Welcome back"}</h2>
          <p className="text-sm text-base-content/60">
            {isSignup
              ? "Join DevTinder and connect with developers"
              : "Log in to continue to DevTinder"}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {isSignup && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField
                id="firstName"
                name="firstName"
                label="First name"
                icon={ICONS.user}
                placeholder="John"
                autoComplete="given-name"
                maxLength={10}
                value={form.firstName}
                onChange={handleChange}
                error={fieldErrors.firstName}
              />
              <InputField
                id="lastName"
                name="lastName"
                label="Last name"
                icon={ICONS.user}
                placeholder="Doe"
                autoComplete="family-name"
                maxLength={10}
                value={form.lastName}
                onChange={handleChange}
                error={fieldErrors.lastName}
              />
            </div>
          )}

          <InputField
            id="email"
            name="email"
            type="email"
            label="Email"
            icon={ICONS.mail}
            placeholder="you@example.com"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            error={fieldErrors.email}
          />

          <InputField
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            label="Password"
            icon={ICONS.lock}
            placeholder={isSignup ? "Create a strong password" : "Enter your password"}
            autoComplete={isSignup ? "new-password" : "current-password"}
            value={form.password}
            onChange={handleChange}
            error={fieldErrors.password}
            hint={isSignup ? "8+ characters with uppercase, lowercase, number and symbol." : undefined}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-xs font-medium text-violet-600 hover:underline"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            }
          />

          {isSignup && (
            <>
              <InputField
                id="image"
                name="image"
                type="url"
                label="Profile image URL"
                optional
                icon={ICONS.image}
                placeholder="https://example.com/photo.jpg"
                value={form.image}
                onChange={handleChange}
                error={fieldErrors.image}
              />

              <div>
                <InputField
                  id="skills"
                  name="skills"
                  label="Skills"
                  optional
                  icon={ICONS.code}
                  placeholder="React, Node.js, MongoDB"
                  value={form.skills}
                  onChange={handleChange}
                  error={fieldErrors.skills}
                  hint="Separate skills with commas."
                />
                {skillList.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {skillList.map((skill) => (
                      <span
                        key={skill}
                        className="badge badge-sm border-violet-200 bg-violet-50 text-violet-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="min-h-6">
            {(error || success) && (
              <div
                role={error ? "alert" : "status"}
                className={`alert alert-soft py-2 text-sm ${error ? "alert-error" : "alert-success"}`}
              >
                <svg
                  className="h-5 w-5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  {error ? (
                    <>
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4M12 16h.01" />
                    </>
                  ) : (
                    <>
                      <circle cx="12" cy="12" r="10" />
                      <path d="m8 12 3 3 5-6" />
                    </>
                  )}
                </svg>
                <span>{error || success}</span>
              </div>
            )}
          </div>

          <Button type="submit" fullWidth loading={loading}>
            {isSignup
              ? loading
                ? "Creating account..."
                : "Sign up"
              : loading
                ? "Logging in..."
                : "Login"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-base-content/70">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={toggleMode}
            className="font-semibold text-violet-600 hover:underline"
          >
            {isSignup ? "Log in" : "Create new account"}
          </button>
        </p>
      </div>
    </section>
  );
};

export default Login;
