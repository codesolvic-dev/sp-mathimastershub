import { useParams } from "react-router-dom";
import PolicyContentPage from "@/components/shop/PolicyContentPage";

/** Dynamic policy pages at /policy/:type (custom policies created in admin). */
export default function DynamicPolicyPage() {
  const { type } = useParams<{ type: string }>();
  const contentType = (type || "").toLowerCase();
  const defaultTitle = contentType
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  if (!contentType) {
    return <PolicyContentPage contentType="privacy" defaultTitle="Privacy Policy" />;
  }

  return <PolicyContentPage contentType={contentType} defaultTitle={defaultTitle} />;
}
