import useAuthUser from "../utils/useAuthUser.js";
import ProfileEdit from "./ProfileEdit.jsx";

const Profile = () => {
  const user = useAuthUser();

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <span className="loading loading-spinner loading-lg text-violet-600" />
      </div>
    );
  }

  return (
    <section className="w-full px-4 py-8 sm:px-6 lg:px-10">
      <ProfileEdit key={user._id} user={user} />
    </section>
  );
};

export default Profile;
