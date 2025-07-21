import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoutes = () => {
  const {
    user: { token },
  } = useSelector((state: any) => state?.user);

  return token ? <Outlet /> : <Navigate to={"/"} replace />;
};

export default ProtectedRoutes;
