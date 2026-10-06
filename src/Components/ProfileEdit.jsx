import { useState } from "react";
import { useDispatch } from "react-redux";
import api, { getErrorMessage, sanitizeUser } from "../utils/api.js";
import { storeUser } from "../utils/userSlice.js";
import {
  NAME_MAX,
  SKILL_MAX_LENGTH,
  SKILLS_MAX,
  isValidUrl,
  validateImageUrl,
  validateName,
} from "../utils/validation.js";
import Button from "./Button.jsx";
import InputField from "./InputField.jsx";
import UserCard from "./UserCard.jsx";
import { ICONS } from "./icons.jsx";

const toDraft = (user) => ({
  firstName: user.firstName ?? "",
  lastName: user.lastName ?? "",
  image: user.image ?? "",
  skills: user.skills ?? [],
});

const isSameDraft = (a, b) =>
  a.firstName.trim() === b.firstName.trim() &&
  a.lastName.trim() === b.lastName.trim() &&
  a.image.trim() === b.image.trim() &&
  a.skills.length === b.skills.length &&
  a.skills.every((skill, i) => skill === b.skills[i]);

const ProfileEdit = ({ user, onSaved }) => {
  const dispatch = useDispatch();
  const [draft, setDraft] = useState(() => toDraft(user));
  const [skillInput, setSkillInput] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const original = toDraft(user);
  const isDirty = !isSameDraft(draft, original);

  const updateField = (name, value) => {
    setDraft((prev) => ({ ...prev, [name]: value }));
    setSuccess("");
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleChange = (e) => updateField(e.target.name, e.target.value);

  const addSkill = () => {
    const skill = skillInput.trim().replace(/,$/, "").trim();
    if (!skill) return;

    if (skill.length > SKILL_MAX_LENGTH) {
      setFieldErrors((prev) => ({ ...prev, skills: `Each skill can be at most ${SKILL_MAX_LENGTH} characters.` }));
      return;
    }
    if (draft.skills.length >= SKILLS_MAX) {
      setFieldErrors((prev) => ({ ...prev, skills: `You can add up to ${SKILLS_MAX} skills.` }));
      return;
    }
    if (draft.skills.some((s) => s.toLowerCase() === skill.toLowerCase())) {
      setSkillInput("");
      return;
    }

    updateField("skills", [...draft.skills, skill]);
    setSkillInput("");
  };

  const removeSkill = (skill) => {
    updateField(
      "skills",
      draft.skills.filter((s) => s !== skill)
    );
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill();
    } else if (e.key === "Backspace" && !skillInput && draft.skills.length > 0) {
      removeSkill(draft.skills[draft.skills.length - 1]);
    }
  };

  const handleReset = () => {
    setDraft(original);
    setSkillInput("");
    setFieldErrors({});
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const errors = {};
    const firstNameError = validateName(draft.firstName, "First name");
    const lastNameError = validateName(draft.lastName, "Last name");
    const imageError = validateImageUrl(draft.image);
    if (firstNameError) errors.firstName = firstNameError;
    if (lastNameError) errors.lastName = lastNameError;
    if (imageError) errors.image = imageError;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      const res = await api.patch("/profile/edit", {
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        image: draft.image.trim() || null,
        skills: draft.skills,
      });
      const updatedUser = sanitizeUser(res.data);
      dispatch(storeUser(updatedUser));
      setDraft(toDraft(updatedUser));
      setSuccess("Profile updated successfully!");
      onSaved?.(updatedUser);
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors && typeof serverErrors === "object" && !serverErrors.body) {
        setFieldErrors(serverErrors);
      } else {
        setError(getErrorMessage(err, "Could not update your profile."));
      }
    } finally {
      setSaving(false);
    }
  };

  const preview = {
    ...draft,
    firstName: draft.firstName.trim() || "First",
    lastName: draft.lastName.trim() || "Last",
    image: isValidUrl(draft.image.trim()) ? draft.image.trim() : null,
  };

  return (
    <div className="mx-auto grid w-full max-w-5xl grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-12">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-4 rounded-2xl border border-base-300 bg-base-100 p-6 text-left shadow-xl sm:p-8"
      >
        <div className="mb-2">
          <h2>Edit profile</h2>
          <p className="text-sm text-base-content/60">
            This is how other developers will see you in their feed.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField
            id="firstName"
            name="firstName"
            label="First name"
            icon={ICONS.user}
            placeholder="John"
            autoComplete="given-name"
            maxLength={NAME_MAX}
            value={draft.firstName}
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
            maxLength={NAME_MAX}
            value={draft.lastName}
            onChange={handleChange}
            error={fieldErrors.lastName}
          />
        </div>

        <InputField
          id="image"
          name="image"
          type="url"
          label="Profile image URL"
          optional
          icon={ICONS.image}
          placeholder="https://example.com/photo.jpg"
          value={draft.image}
          onChange={handleChange}
          error={fieldErrors.image}
          hint="Paste a link to your photo. Leave empty to show your initials."
        />

        <div>
          <InputField
            id="skills"
            label="Skills"
            optional
            icon={ICONS.code}
            placeholder={draft.skills.length >= SKILLS_MAX ? "Skill limit reached" : "Type a skill and press Enter"}
            maxLength={SKILL_MAX_LENGTH}
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={handleSkillKeyDown}
            disabled={draft.skills.length >= SKILLS_MAX}
            error={fieldErrors.skills}
            hint={`${draft.skills.length}/${SKILLS_MAX} skills. Press Enter or comma to add.`}
            trailing={
              <button
                type="button"
                onClick={addSkill}
                disabled={!skillInput.trim()}
                className="text-xs font-medium text-violet-600 hover:underline disabled:text-base-content/30 disabled:no-underline"
              >
                Add
              </button>
            }
          />
          {draft.skills.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Your skills">
              {draft.skills.map((skill) => (
                <li
                  key={skill}
                  className="badge gap-1 border-violet-200 bg-violet-50 py-3 text-violet-700"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    aria-label={`Remove ${skill}`}
                    className="ml-0.5 rounded-full px-1 leading-none text-violet-500 hover:bg-violet-200 hover:text-violet-800"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="min-h-6">
          {(error || success) && (
            <div
              role={error ? "alert" : "status"}
              className={`alert alert-soft py-2 text-sm ${error ? "alert-error" : "alert-success"}`}
            >
              <span>{error || success}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Button
            variant="secondary"
            onClick={handleReset}
            disabled={!isDirty || saving}
            className="sm:flex-1"
          >
            Reset
          </Button>
          <Button type="submit" loading={saving} disabled={!isDirty} className="sm:flex-1">
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>

      <aside className="order-first flex flex-col items-center lg:sticky lg:top-24 lg:order-last">
        <p className="mb-4 text-sm font-medium uppercase tracking-wider text-base-content/50">
          Live preview
        </p>
        <UserCard user={preview} />
      </aside>
    </div>
  );
};

export default ProfileEdit;
