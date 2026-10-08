import "./Jobs.css";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import JobCard from "../components/JobCard";
import { api } from "../api";

const fallback = [
  {
    _id: "demo-1",
    title: "Wedding Catering",
    type: "Wedding",
    location: "Amalapuram",
    date: "12 October 2026",
    startTime: "5:00 PM",
    endTime: "11:00 PM",
    payment: 800,
    workersNeeded: 10,
    workersFilled: 0,
    description: "Wedding event catering support.",
  },
  {
    _id: "demo-2",
    title: "Birthday Event",
    type: "Party",
    location: "Razole",
    date: "13 October 2026",
    startTime: "6:00 PM",
    endTime: "10:00 PM",
    payment: 600,
    workersNeeded: 5,
    workersFilled: 0,
    description: "Birthday event serving.",
  },
  {
    _id: "demo-3",
    title: "Corporate Event",
    type: "Corporate",
    location: "Kakinada",
    date: "15 October 2026",
    startTime: "8:00 AM",
    endTime: "4:00 PM",
    payment: 1000,
    workersNeeded: 15,
    workersFilled: 0,
    description: "Corporate catering support.",
  },
];

export default function Jobs() {
  const [jobs, setJobs] = useState(fallback);

  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const [location, setLocation] = useState("");

  const [minPayment, setMinPayment] = useState("");
  const [date, setDate] = useState("");
  const [sort, setSort] = useState("newest");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const qs = new URLSearchParams();

      if (search.trim()) {
        qs.set("search", search.trim());
      }

      if (type !== "All") {
        qs.set("type", type);
      }

      if (location.trim()) {
        qs.set("location", location.trim());
      }

      if (minPayment) {
        qs.set("minPayment", minPayment);
      }

      if (date) {
        qs.set("date", date);
      }

      qs.set("sort", sort);

      setJobs(await api(`/jobs?${qs.toString()}`));
    } catch (e) {
      setJobs(fallback);

      setError(
        "Database is not connected, so demo jobs are being shown."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <Navbar />

      <main className="section">
        <div className="eyebrow">
          BROWSE OPPORTUNITIES
        </div>

        <h1>Find Catering Jobs</h1>

        <div className="toolbar card">
          <input
            placeholder="Search jobs, event type or location"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && load()
            }
          />

          <input
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && load()
            }
          />

          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setTimeout(load, 0);
            }}
          >
            <option>All</option>
            <option>Wedding</option>
            <option>Party</option>
            <option>Corporate</option>
            <option>Function</option>
            <option>Hotel</option>
            <option>General</option>
          </select>

          <input
            type="number"
            min="0"
            placeholder="Minimum payment"
            value={minPayment}
            onChange={(e) =>
              setMinPayment(e.target.value)
            }
          />

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setTimeout(load, 0);
            }}
          >
            <option value="newest">Newest</option>
            <option value="paymentHigh">
              Highest Payment
            </option>
            <option value="paymentLow">
              Lowest Payment
            </option>
            <option value="date">
              Earliest Date
            </option>
          </select>

          <button className="btn" onClick={load}>
            Search
          </button>
        </div>

        {error && (
          <div className="notice">
            {error}
          </div>
        )}

        {loading ? (
          <div className="card">
            Loading jobs…
          </div>
        ) : jobs.length ? (
          <div className="joblist">
            {jobs.map((j) => (
              <JobCard
                key={j._id}
                job={j}
              />
            ))}
          </div>
        ) : (
          <div className="card empty">
            <h3>No matching jobs</h3>

            <p>
              Try another search, location, payment,
              or date.
            </p>
          </div>
        )}
      </main>
    </>
  );
}