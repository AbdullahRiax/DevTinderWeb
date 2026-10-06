import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../utils/api.js";
import { decrementRequests, setRequestsCount } from "../utils/notificationsSlice.js";
import { connectSocket } from "../utils/socket.js";
import useAuthUser from "../utils/useAuthUser.js";
import Button from "./Button.jsx";
import UserCard from "./UserCard.jsx";

const Requests = () => {
  const user = useAuthUser();
  const isLoggedIn = !!user;
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [pending, setPending] = useState({});
  const [actionErrors, setActionErrors] = useState({});
  const [notice, setNotice] = useState("");
  const dispatch = useDispatch();

  useEffect(() => {
    if (!isLoggedIn) return;
    api
      .get("/user/request/recieved")
      .then((res) => {
        const data = res.data.data ?? [];
        setRequests(data);
        dispatch(setRequestsCount(data.length));
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          setRequests([]);
          dispatch(setRequestsCount(0));
        } else setError(getErrorMessage(err, "Could not load your requests."));
      })
      .finally(() => setLoading(false));
  }, [isLoggedIn, reloadKey, dispatch]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const socket = connectSocket();
    const handleRequestReceived = () => setReloadKey((key) => key + 1);
    socket.on("requestReceived", handleRequestReceived);
    return () => socket.off("requestReceived", handleRequestReceived);
  }, [isLoggedIn]);

  const handleRetry = () => {
    setLoading(true);
    setError("");
    setReloadKey((key) => key + 1);
  };

  const reviewRequest = async (request, status) => {
    const sender = request.requestFrom;
    setPending((prev) => ({ ...prev, [request._id]: status }));
    setActionErrors((prev) => ({ ...prev, [request._id]: undefined }));
    setNotice("");

    try {
      await api.post(`/request/recieve/${status}/${sender._id}`);
      setRequests((prev) => prev.filter((r) => r._id !== request._id));
      dispatch(decrementRequests());
      setNotice(
        status === "accepted"
          ? `You're now connected with ${sender.firstName}!`
          : `Request from ${sender.firstName} rejected.`
      );
    } catch (err) {
      setActionErrors((prev) => ({
        ...prev,
        [request._id]: getErrorMessage(err, "Could not update this request."),
      }));
    } finally {
      setPending((prev) => ({ ...prev, [request._id]: undefined }));
    }
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
        <h2>Connection requests</h2>
        <p className="text-sm text-base-content/60">
          {requests.length > 0
            ? `${requests.length} developer${requests.length === 1 ? " is" : "s are"} interested in you`
            : "Developers who swiped right on you will appear here"}
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

      {notice && (
        <div role="status" className="alert alert-success alert-soft mx-auto mb-6 max-w-md text-sm">
          <span>{notice}</span>
          {notice.startsWith("You're now connected") && (
            <Link to="/connections" className="btn btn-sm btn-ghost">
              View connections
            </Link>
          )}
        </div>
      )}

      {!error && requests.length === 0 && (
        <div className="mx-auto max-w-sm rounded-3xl border border-dashed border-base-300 p-10 text-center">
          <p className="text-4xl">📭</p>
          <p className="mt-3 font-semibold">No pending requests</p>
          <p className="mt-1 text-sm text-base-content/60">
            When someone is interested in you, you can accept or reject them here.
          </p>
          <Link
            to="/feed"
            className="btn btn-sm mt-5 border-0 bg-gradient-to-r from-pink-500 to-violet-600 text-white"
          >
            Go to feed
          </Link>
        </div>
      )}

      {requests.length > 0 && (
        <ul className="grid grid-cols-1 justify-items-center gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {requests.map((request) => {
            const status = pending[request._id];
            const busy = !!status;
            return (
              <li key={request._id} className="w-full max-w-sm">
                <UserCard user={request.requestFrom} />
                {actionErrors[request._id] && (
                  <p role="alert" className="mt-3 text-center text-xs text-error">
                    {actionErrors[request._id]}
                  </p>
                )}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => reviewRequest(request, "rejected")}
                    loading={status === "rejected"}
                    disabled={busy}
                    className="border border-red-300 text-red-500 hover:border-red-400 hover:bg-red-50"
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={() => reviewRequest(request, "accepted")}
                    loading={status === "accepted"}
                    disabled={busy}
                  >
                    Accept
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default Requests;
