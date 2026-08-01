import API from "./axios";
import { normalizeLandingPageChoice } from "@/utils/landingPage";

export const getCompany = async () => {
  const res = await API.get("/company");
  return res.data.data;
};

export const updateCompany = async (data: any) => {
  const formData = new FormData();

  // Append text fields
  if (data.company !== undefined) formData.append("company", data.company);
  if (data.slogan !== undefined) formData.append("slogan", data.slogan);
  if (data.email !== undefined) formData.append("email", data.email);
  if (data.phone !== undefined) formData.append("phone", data.phone);
  if (data.website !== undefined) formData.append("website", data.website);
  if (data.supportEmail !== undefined) formData.append("supportEmail", data.supportEmail);
  if (data.address !== undefined) formData.append("address", data.address);
  if (data.googleMapUrl !== undefined) formData.append("googleMapUrl", data.googleMapUrl);
  if (data.description !== undefined) formData.append("description", data.description);
  if (data.copyright !== undefined) formData.append("copyright", data.copyright);
  if (data.authTagline !== undefined) formData.append("authTagline", data.authTagline);
  if (data.currency !== undefined) formData.append("currency", data.currency);
  if (data.priceShowDecimals !== undefined) {
    formData.append("priceShowDecimals", String(data.priceShowDecimals === true));
  }
  if (data.defaultLandingPage !== undefined) {
    formData.append("defaultLandingPage", normalizeLandingPageChoice(data.defaultLandingPage));
  }

  // Append logo file
  if (data.logoFile instanceof File) {
    formData.append("logo", data.logoFile);
  }
  
  // Append favicon file
  if (data.faviconFile instanceof File) {
    formData.append("favicon", data.faviconFile);
  }

  // Append social links
  if (data.socialLinks) {
    formData.append("socialLinks", JSON.stringify(data.socialLinks));
  }

  // Append social posts
  if (data.socialPosts) {
    formData.append("socialPosts", JSON.stringify(data.socialPosts));
  }

  // Append social post files
  if (data.socialPostFiles && Array.isArray(data.socialPostFiles)) {
    console.log("Appending social post files:", data.socialPostFiles.length);
    const fileIndices: number[] = [];
    data.socialPostFiles.forEach((item: { index: number; file: File }) => {
      if (item && item.file instanceof File) {
        console.log(`Appending file for social post ${item.index}:`, item.file.name, item.file.size);
        formData.append(`socialPost_${item.index}`, item.file);
        fileIndices.push(item.index);
      } else {
        console.warn("Invalid social post file item:", item);
      }
    });
    if (fileIndices.length > 0) {
      console.log("Social post file indices:", fileIndices);
      formData.append("socialPostFileIndices", JSON.stringify(fileIndices));
    } else {
      console.warn("No valid social post files to append");
    }
  } else {
    console.log("No social post files to append");
  }

  // Append brand theme
  if (data.brandTheme) {
    formData.append("brandTheme", JSON.stringify(data.brandTheme));
  }

  if (data.paymentSettings) {
    formData.append("paymentSettings", JSON.stringify(data.paymentSettings));
  }

  if (data.announcementBar) {
    formData.append("announcementBar", JSON.stringify(data.announcementBar));
  }

  if (data.welcomePopup) {
    formData.append("welcomePopup", JSON.stringify(data.welcomePopup));
  }

  if (data.loaderSettings) {
    formData.append("loaderSettings", JSON.stringify(data.loaderSettings));
  }

  if (data.productCardStyle !== undefined) {
    formData.append("productCardStyle", String(data.productCardStyle));
  }

  if (data.blogCardStyle !== undefined) {
    formData.append("blogCardStyle", String(data.blogCardStyle));
  }

  if (data.productDetailStyle !== undefined) {
    formData.append("productDetailStyle", String(data.productDetailStyle));
  }

  if (data.navbarSettings) {
    formData.append("navbarSettings", JSON.stringify(data.navbarSettings));
  }

  if (data.metaPixel) {
    formData.append("metaPixel", JSON.stringify(data.metaPixel));
  }

  if (data.googleSiteVerification !== undefined) {
    formData.append("googleSiteVerification", String(data.googleSiteVerification ?? ""));
  }

  if (data.maintenanceMode) {
    formData.append("maintenanceMode", JSON.stringify(data.maintenanceMode));
  }

  if (data.welcomePopupImageFile instanceof File) {
    formData.append("welcomePopupImage", data.welcomePopupImageFile);
  }

  if (data.clearWelcomePopupImage === true) {
    formData.append("clearWelcomePopupImage", "true");
  }

  if (data.maintenanceBackgroundImageFile instanceof File) {
    formData.append("maintenanceBackgroundImage", data.maintenanceBackgroundImageFile);
  }

  if (data.clearMaintenanceBackgroundImage === true) {
    formData.append("clearMaintenanceBackgroundImage", "true");
  }

  const res = await API.put("/company", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data.data;
};





















