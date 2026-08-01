import { Navigate } from "react-router-dom";

/** Parent index → first Third-Party Services tab. */
export default function ThirdPartyServicesPage() {
  return <Navigate to="/developer/third-party-services/meta-pixel" replace />;
}
