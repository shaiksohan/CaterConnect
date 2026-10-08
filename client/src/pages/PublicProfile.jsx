import "./PublicProfile.css";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api } from "../api";

export default function PublicProfile() {
  const { id } = useParams();

  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api(`/users/${id}/profile`),
      api(`/users/${id}/reviews`),
    ])
      .then(([profileData, reviewsData]) => {
        setProfile(profileData);
        setReviews(reviewsData);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="section">
          <div className="card">
            <p>Loading profile...</p>
          </div>
        </main>
      </>
    );
  }

  if (error || !profile) {
    return (
      <>
        <Navbar />
        <main className="section">
          <Link to="/dashboard">← Dashboard</Link>

          <div className="card">
            <h2>Profile not found</h2>
            <p>{error || "This profile could not be loaded."}</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="section public-profile-page">
        <Link to="/dashboard">← Dashboard</Link>

        <div className="public-profile-card">
          <div className="public-profile-header">
            <div className="public-avatar">
              {profile.profilePhoto ? (
                <img
                  src={profile.profilePhoto}
                  alt={profile.name}
                />
              ) : (
                profile.name?.charAt(0).toUpperCase()
              )}
            </div>

            <div>
              <h1>{profile.name}</h1>

              <p className="profile-role">
                {profile.role === "worker"
                  ? "Catering Worker"
                  : "Catering Provider"}
              </p>

              {profile.verified && (
                <span className="verified-badge">
                  ✓ Verified
                </span>
              )}

              <Link
                className="btn small"
                to={`/messages/${profile._id}`}
                style={{
                  marginTop: "12px",
                  display: "inline-block",
                }}
              >
                💬 Message
              </Link>
            </div>
          </div>

          <div className="profile-stats">
            <div>
              <strong>
                {Number(profile.rating || 0).toFixed(1)}
              </strong>
              <span>Rating</span>
            </div>

            <div>
              <strong>{profile.reviewCount || 0}</strong>
              <span>Reviews</span>
            </div>

            <div>
              <strong>{profile.experience || "—"}</strong>
              <span>Experience</span>
            </div>
          </div>

          {profile.location && (
            <section className="profile-section">
              <h2>Location</h2>
              <p>{profile.location}</p>
            </section>
          )}

          {profile.bio && (
            <section className="profile-section">
              <h2>About</h2>
              <p>{profile.bio}</p>
            </section>
          )}

          {profile.skills?.length > 0 && (
            <section className="profile-section">
              <h2>Skills</h2>

              <div className="skills-list">
                {profile.skills.map((skill, index) => (
                  <span className="skill-tag" key={index}>
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {!profile.bio &&
            !profile.location &&
            (!profile.skills || profile.skills.length === 0) && (
              <section className="profile-section">
                <p>No additional profile information available.</p>
              </section>
            )}

          {/* Reviews */}
          <section className="profile-section">
            <h2>Reviews</h2>

            {reviews.length === 0 ? (
              <p>No reviews yet.</p>
            ) : (
              <div className="reviews-list">
                {reviews.map((review) => (
                  <div
                    className="review-card"
                    key={review._id}
                  >
                    <div className="review-header">
                      <div>
                        <strong>
                          {review.reviewer?.name || "Anonymous"}
                        </strong>

                        <span className="review-role">
                          {review.reviewer?.role === "worker"
                            ? "Worker"
                            : "Provider"}
                        </span>
                      </div>

                      <span className="review-rating">
                        ⭐ {review.rating}/5
                      </span>
                    </div>

                    {review.job?.title && (
                      <p className="review-job">
                        Job: {review.job.title}
                      </p>
                    )}

                    {review.comment && (
                      <p className="review-comment">
                        {review.comment}
                      </p>
                    )}

                    <small>
                      {new Date(
                        review.createdAt
                      ).toLocaleDateString()}
                    </small>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}