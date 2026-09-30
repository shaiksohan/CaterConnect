import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({children, role}){
  const location=useLocation();
  const user=JSON.parse(localStorage.getItem("cc_user")||"null");
  if(!user) return <Navigate to="/login" replace state={{from:location.pathname}}/>;
  if(role && user.role!==role) return <Navigate to="/dashboard" replace/>;
  return children;
}
