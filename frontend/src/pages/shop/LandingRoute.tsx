import React from "react";
import Landing from "@/pages/shop/Landing";
import SecondLanding from "@/pages/shop/SecondLanding";
import ThirdLanding from "@/pages/shop/ThirdLanding";
import { useCompanyLandingChoice } from "@/hooks/useCompanyLandingChoice";
import {
  resolveAlternateLanding,
  resolveHomeLanding,
  type LandingPageChoice,
} from "@/utils/landingPage";
import PageLoader from "@/components/ui/PageLoader";
import HomePageMetaEngagement from "@/components/analytics/HomePageMetaEngagement";

function renderLanding(choice: LandingPageChoice) {
  if (choice === "tertiary") return <ThirdLanding />;
  if (choice === "secondary") return <SecondLanding />;
  return <Landing />;
}

type LandingRouteProps = {
  mode: "home" | "alternate";
};

export default function LandingRoute({ mode }: LandingRouteProps) {
  const { choice: selected, ready } = useCompanyLandingChoice();

  if (!ready) {
    return <PageLoader />;
  }

  const choice =
    mode === "home" ? resolveHomeLanding(selected) : resolveAlternateLanding(selected);

  return (
    <React.Fragment key={`${mode}-${choice}`}>
      {mode === "home" ? <HomePageMetaEngagement /> : null}
      {renderLanding(choice)}
    </React.Fragment>
  );
}
