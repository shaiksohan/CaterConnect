import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

export default function Profile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    bio: "",
    skills: "",
    experience: "",
    location: "",
    profilePhoto: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("cc_token");

    if (!token) {
      navigate("/login");
      return;
    }

    loadProfile();
  }, [navigate]);

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("cc_token");

      const response = await fetch("http://localhost:5000/api/profile", {
        headers: {
          Authorization: "Bearer " + token,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("cc_token");
          localStorage.removeItem("cc_user");
          navigate("/login");
          return;
        }

        throw new Error(data.message || "Failed to load profile");
      }

      setProfile(data);

      setForm({
        name: data.name || "",
        phone: data.phone || "",
        bio: data.bio || "",
        skills: Array.isArray(data.skills)
          ? data.skills.join(", ")
          : "",
        experience: data.experience || "",
        location: data.location || "",
        profilePhoto: data.profilePhoto || "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSave(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const token = localStorage.getItem("cc_token");

      const skillsArray = form.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);

      const response = await fetch("http://localhost:5000/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          bio: form.bio,
          skills: skillsArray,
          experience: form.experience,
          location: form.location,
          profilePhoto: form.profilePhoto,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update profile"
        );
      }

      setProfile(data.user);

      const currentUser = JSON.parse(
        localStorage.getItem("cc_user") || "null"
      );

      if (currentUser) {
        localStorage.setItem(
          "cc_user",
          JSON.stringify({
            ...currentUser,
            name: data.user.name,
          })
        );
      }

      setEditing(false);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function requestVerification() {
    try {
      setVerifying(true);
      setError("");
      setMessage("");

      const token = localStorage.getItem("cc_token");

      const response = await fetch(
        "http://localhost:5000/api/verification/request",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to submit verification request"
        );
      }

      setProfile((current) => ({
        ...current,
        verificationStatus:
          data.verificationStatus || "Pending",
      }));

      setMessage(
        "Verification request submitted successfully."
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  }

  if (loading) {
    return (
      <main className="profile-page">
        <div className="profile-loading">
          Loading profile...
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="profile-page">
        <div className="profile-error">
          {error || "Unable to load profile."}
        </div>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <div className="profile-container">

        <div className="profile-header">
          <div>
            <p className="profile-eyebrow">
              CATERCONNECT
            </p>

            <h1>My Profile</h1>

            <p className="profile-subtitle">
              Manage your information and build your trusted
              profile.
            </p>
          </div>

          {!editing && (
            <button
              className="profile-edit-button"
              onClick={() => {
                setMessage("");
                setError("");
                setEditing(true);
              }}
            >
              Edit Profile
            </button>
          )}
        </div>

        {message && (
          <div className="profile-success">
            {message}
          </div>
        )}

        {error && (
          <div className="profile-error">
            {error}
          </div>
        )}

        {!editing ? (
          <>
            <section className="profile-card profile-main-card">
              <div className="profile-avatar-area">
                {profile.profilePhoto ? (
                  <img
                    className="profile-avatar"
                    src={profile.profilePhoto}
                    alt={profile.name}
                  />
                ) : (
                  <div className="profile-avatar profile-avatar-placeholder">
                    {profile.name?.charAt(0)?.toUpperCase() ||
                      "U"}
                  </div>
                )}
              </div>

              <div className="profile-identity">
                <div className="profile-name-row">
                  <h2>{profile.name}</h2>

                  {profile.verified && (
                    <span className="verified-badge">
                      ✓ Verified
                    </span>
                  )}
                </div>

                <span className="profile-role">
                  {profile.role === "provider"
                    ? "Catering Provider"
                    : "Worker"}
                </span>

                <div className="profile-rating">
                  ⭐{" "}
                  {Number(profile.rating || 0).toFixed(1)}
                  <span>
                    ({profile.reviewCount || 0} reviews)
                  </span>
                </div>
              </div>
            </section>

            {/* Verification */}
            <section className="profile-card">
              <h3>Verification</h3>

              {profile.verified ? (
                <p className="profile-success">
                  ✓ Your account is verified.
                </p>
              ) : profile.verificationStatus ===
                "Pending" ? (
                <p>
                  🕐 Your verification request is pending
                  review.
                </p>
              ) : profile.verificationStatus ===
                "Rejected" ? (
                <>
                  <p>
                    Your previous verification request was
                    rejected.
                  </p>

                  <button
                    className="profile-save-button"
                    onClick={requestVerification}
                    disabled={verifying}
                  >
                    {verifying
                      ? "Submitting..."
                      : "Request Verification Again"}
                  </button>
                </>
              ) : (
                <>
                  <p>
                    Get your profile reviewed and receive a
                    verified badge.
                  </p>

                  <button
                    className="profile-save-button"
                    onClick={requestVerification}
                    disabled={verifying}
                  >
                    {verifying
                      ? "Submitting..."
                      : "Request Verification"}
                  </button>
                </>
              )}
            </section>

            <section className="profile-card">
              <h3>Contact Information</h3>

              <div className="profile-info-grid">
                <div className="profile-info-item">
                  <span className="profile-label">
                    Email
                  </span>
                  <strong>
                    {profile.email || "Not added"}
                  </strong>
                </div>

                <div className="profile-info-item">
                  <span className="profile-label">
                    Phone
                  </span>
                  <strong>
                    {profile.phone || "Not added"}
                  </strong>
                </div>

                <div className="profile-info-item">
                  <span className="profile-label">
                    Location
                  </span>
                  <strong>
                    {profile.location || "Not added"}
                  </strong>
                </div>

                <div className="profile-info-item">
                  <span className="profile-label">
                    Experience
                  </span>
                  <strong>
                    {profile.experience || "Not added"}
                  </strong>
                </div>
              </div>
            </section>

            <section className="profile-card">
              <h3>About Me</h3>

              <p className="profile-bio">
                {profile.bio || "No bio added yet."}
              </p>
            </section>

            <section className="profile-card">
              <h3>Skills</h3>

              {profile.skills?.length > 0 ? (
                <div className="skills-list">
                  {profile.skills.map((skill, index) => (
                    <span
                      className="skill-tag"
                      key={index}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="profile-muted">
                  No skills added yet.
                </p>
              )}
            </section>
          </>
        ) : (
          <form
            className="profile-card profile-form"
            onSubmit={handleSave}
          >
            <h2>Edit Profile</h2>

            <div className="profile-form-grid">
              <label>
                Full Name
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Phone
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                />
              </label>

              <label>
                Location
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g. Amalapuram"
                />
              </label>

              <label>
                Experience
                <input
                  name="experience"
                  value={form.experience}
                  onChange={handleChange}
                  placeholder="e.g. 2 years"
                />
              </label>

              <label className="profile-full-width">
                Profile Photo URL
                <input
                  name="profilePhoto"
                  value={form.profilePhoto}
                  onChange={handleChange}
                  placeholder="Paste image URL"
                />
              </label>

              <label className="profile-full-width">
                Bio
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  placeholder="Tell others about yourself..."
                  maxLength={500}
                  rows={5}
                />
              </label>

              <label className="profile-full-width">
                Skills
                <input
                  name="skills"
                  value={form.skills}
                  onChange={handleChange}
                  placeholder="Serving, Cooking, Cleaning"
                />

                <small>
                  Separate multiple skills with commas.
                </small>
              </label>
            </div>

            <div className="profile-form-actions">
              <button
                type="button"
                className="profile-cancel-button"
                onClick={() => {
                  setEditing(false);
                  setError("");
                  setMessage("");
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="profile-save-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}