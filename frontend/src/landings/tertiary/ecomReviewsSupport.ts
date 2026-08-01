import { contentOverride } from "@/utils/landingSectionContent";

export const ECOM_REVIEWS_SUPPORT_SECTION_ID = "ecom-reviews-support";

export type EcomReviewsSupportSettings = {
  reviewsTitle: string;
  reviewsRating: string;
  reviewsButtonLabel: string;
  reviewsViewButtonLabel: string;
  supportTitle: string;
  supportMembers: string;
  supportButtonLabel: string;
};

const DEFAULTS: EcomReviewsSupportSettings = {
  reviewsTitle: "Our Reviews",
  reviewsRating: "4.1/5 (1000+)",
  reviewsButtonLabel: "Write a Review",
  reviewsViewButtonLabel: "View Reviews",
  supportTitle: "Support Team",
  supportMembers: "Rose, Misha, Ashi",
  supportButtonLabel: "Chat on WhatsApp",
};

export function parseEcomReviewsSupportSettings(
  contentMap?: Record<string, Record<string, string>>
): EcomReviewsSupportSettings {
  const map = contentMap ?? {};
  const sectionId = ECOM_REVIEWS_SUPPORT_SECTION_ID;

  return {
    reviewsTitle: contentOverride(map, sectionId, "reviewsTitle", DEFAULTS.reviewsTitle),
    reviewsRating: contentOverride(map, sectionId, "reviewsRating", DEFAULTS.reviewsRating),
    reviewsButtonLabel: contentOverride(map, sectionId, "reviewsButtonLabel", DEFAULTS.reviewsButtonLabel),
    reviewsViewButtonLabel: contentOverride(
      map,
      sectionId,
      "reviewsViewButtonLabel",
      DEFAULTS.reviewsViewButtonLabel
    ),
    supportTitle: contentOverride(map, sectionId, "supportTitle", DEFAULTS.supportTitle),
    supportMembers: contentOverride(map, sectionId, "supportMembers", DEFAULTS.supportMembers),
    supportButtonLabel: contentOverride(map, sectionId, "supportButtonLabel", DEFAULTS.supportButtonLabel),
  };
}
