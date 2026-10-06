import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchProfile } from "./api.js";
import { storeUser } from "./userSlice.js";

const useAuthUser = () => {
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) return;
    fetchProfile()
      .then((profile) => dispatch(storeUser(profile)))
      .catch(() => navigate("/login", { replace: true }));
  }, [user, dispatch, navigate]);

  return user;
};

export default useAuthUser;
