import {
  cleanDescription,
  escapeHtml,
  fetchCompany,
  getApiUrl,
  getFrontendOrigin,
  ogCacheHeaders,
  toAbsoluteUrl,
} from "./_lib/ogHelpers.js";

export default async function handler(req, res) {
  try {
    const API_URL = getApiUrl();
    if (!API_URL) {
      throw new Error("API URL not configured");
    }

    const frontendOrigin = getFrontendOrigin(req);
    const company = await fetchCompany(API_URL);
    const pageUrl = frontendOrigin || "/";
    const pageTitle = company.company;
    const description = cleanDescription(
      company.description,
      `Shop quality products at ${company.company}`
    );
    const brandImage = toAbsoluteUrl(
      company.logo || company.favicon,
      API_URL,
      frontendOrigin
    );
    const iconUrl = toAbsoluteUrl(company.favicon || company.logo, API_URL, frontendOrigin);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  ${iconUrl ? `<link rel="icon" href="${iconUrl}" />` : ""}
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:title" content="${escapeHtml(pageTitle)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  ${brandImage ? `<meta property="og:image" content="${brandImage}" />` : ""}
  ${brandImage ? `<meta property="og:image:secure_url" content="${brandImage}" />` : ""}
  <meta property="og:site_name" content="${escapeHtml(company.company)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  ${brandImage ? `<meta name="twitter:image" content="${brandImage}" />` : ""}
  <link rel="canonical" href="${pageUrl}" />
</head>
<body>
  <h1>${escapeHtml(pageTitle)}</h1>
  <p>${escapeHtml(description)}</p>
  ${brandImage ? `<img src="${brandImage}" alt="${escapeHtml(pageTitle)}" style="max-width:100%;height:auto;" />` : ""}
</body>
</html>`;

    const headers = ogCacheHeaders();
    res.setHeader("Content-Type", headers["Content-Type"]);
    res.setHeader("Cache-Control", headers["Cache-Control"]);
    return res.status(200).send(html);
  } catch (error) {
    console.error("OG homepage handler error:", error);
    return res.status(500).send("Unable to generate preview");
  }
}
