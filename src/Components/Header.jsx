import { useDispatch, useSelector } from "react-redux";
import { Link, NavLink, useNavigate } from "react-router-dom";
import api from "../utils/api.js";
import { selectTotalUnread } from "../utils/notificationsSlice.js";
import { clearUser } from "../utils/userSlice.js";
import Avatar from "./Avatar.jsx";
import CountBadge from "./CountBadge.jsx";

const Header = () => {
  const user = useSelector((state) => state.user);
  const requestsCount = useSelector((state) => state.notifications.requestsCount);
  const unreadCount = useSelector(selectTotalUnread);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const navItems = [
    { to: "/feed", label: "Feed" },
    { to: "/connections", label: "Connections" },
    { to: "/requests", label: "Requests", count: requestsCount, countLabel: "pending requests" },
    { to: "/chat", label: "Chat", count: unreadCount, countLabel: "unread messages" },
  ];

  const handleLogout = async () => {
    try {
      await api.post("/logout");
    } finally {
      dispatch(clearUser());
      navigate("/login", { replace: true });
    }
  };

  const closeDropdown = () => document.activeElement?.blur();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-base-300 bg-base-100/80 backdrop-blur-md shadow-sm">
      <nav className="navbar w-full gap-2 px-3 sm:px-6 lg:px-10">
        <div className="flex-1">
          <Link to={user ? "/feed" : "/login"} className="flex w-fit items-center gap-2 sm:gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-violet-600 text-xl shadow-md sm:h-11 sm:w-11 sm:text-2xl"
              role="img"
              aria-label="Developer girl logo"
            >
              👩‍💻
            </span>
            <span className="bg-gradient-to-r from-pink-500 to-violet-600 bg-clip-text text-xl font-extrabold tracking-tight text-transparent sm:text-2xl">
              DevTinder
            </span>
          </Link>
        </div>

        {user && (
          <>
            <ul className="hidden items-center gap-1 md:flex">
              {navItems.map(({ to, label, count, countLabel }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      `relative inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? "bg-violet-50 text-violet-700"
                          : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
                      }`
                    }
                  >
                    {label}
                    <CountBadge count={count} label={countLabel} />
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="flex flex-none items-center gap-2 sm:gap-3">
              <span className="hidden text-sm font-medium xl:inline">Welcome, {user.firstName}</span>
              <div className="dropdown dropdown-end">
                <div
                  tabIndex={0}
                  role="button"
                  className="btn btn-ghost btn-circle relative"
                  aria-label="Open user menu"
                >
                  <Avatar
                    user={user}
                    className="h-9 w-9 text-sm ring-2 ring-violet-500 ring-offset-2 ring-offset-base-100 sm:h-10 sm:w-10"
                  />
                  <CountBadge
                    count={requestsCount + unreadCount}
                    label="notifications"
                    className="absolute -right-1 -top-1 md:hidden"
                  />
                </div>
                <ul
                  tabIndex={0}
                  onClick={closeDropdown}
                  className="menu dropdown-content menu-sm z-50 mt-3 w-56 rounded-box bg-base-100 p-2 shadow-lg"
                >
                  <li className="menu-title truncate">
                    {user.firstName} {user.lastName}
                  </li>
                  {navItems.map(({ to, label, count, countLabel }) => (
                    <li key={to} className="md:hidden">
                      <NavLink to={to} className="flex justify-between">
                        {label}
                        <CountBadge count={count} label={countLabel} />
                      </NavLink>
                    </li>
                  ))}
                  <li>
                    <NavLink to="/profile">Profile</NavLink>
                  </li>
                  <li>
                    <button type="button" onClick={handleLogout} className="text-error">
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
