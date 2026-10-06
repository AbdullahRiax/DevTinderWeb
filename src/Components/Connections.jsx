import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../utils/api.js";
import useAuthUser from "../utils/useAuthUser.js";
import UserCard from "./UserCard.jsx";

const Connections = () => {
  const user = useAuthUser();
  const isLoggedIn = !!user;
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) return;
    api
      .get("/user/connections")
      .then((res) => setConnections(res.data.data ?? []))
      .catch((err) => {
        // The backend answers 404 when the user has no connections yet.
        if (err.response?.status === 404) setConnections([]);
        else setError(getErrorMessage(err, "Could not load your connections."));
      })
      .finally(() => setLoading(false));
  }, [isLoggedIn, reloadKey]);

  const handleRetry = () => {
    setLoading(true);
    setError("");
    setReloadKey((key) => key + 1);
  };

  if (!user || loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <span className="loading loading-spinner loading-lg text-violet-600" />
      </div>
    );
  }

  return (
    <section className="w-full px-4 py-8 sm:px-6 lg:px-10">
      <div className="mb-6 text-center">
        <h2>Your connections</h2>
        <p className="text-sm text-base-content/60">
          {connections.length > 0
            ? `You're connected with ${connections.length} developer${connections.length === 1 ? "" : "s"}`
            : "Developers who accepted your request, or whose request you accepted"}
        </p>
      </div>

      {error && (
        <div role="alert" className="alert alert-error alert-soft mx-auto mb-6 max-w-md text-sm">
          <span>{error}</span>
          <button type="button" onClick={handleRetry} className="btn btn-sm btn-ghost">
            Retry
          </button>
        </div>
      )}

      {!error && connections.length === 0 && (
        <div className="mx-auto max-w-sm rounded-3xl border border-dashed border-base-300 p-10 text-center">
          <p className="text-4xl">🤝</p>
          <p className="mt-3 font-semibold">No connections yet</p>
          <p className="mt-1 text-sm text-base-content/60">
            Swipe right on developers you like. Once they accept, they&apos;ll show up here.
          </p>
          <Link to="/feed" className="btn btn-sm mt-5 border-0 bg-gradient-to-r from-pink-500 to-violet-600 text-white">
            Go to feed
          </Link>
        </div>
      )}

      {connections.length > 0 && (
        <ul className="grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {connections.map((connection) => (
            <li key={connection._id} className="w-full max-w-sm">
              <UserCard user={connection} />
              <Link
                to={`/chat/${connection._id}`}
                className="btn mt-4 w-full border-0 bg-gradient-to-r from-pink-500 to-violet-600 text-white shadow-md"
              >
                Message {connection.firstName}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default Connections;
