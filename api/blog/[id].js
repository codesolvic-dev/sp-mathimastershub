import {
  cleanDescription,
  escapeHtml,
  fetchCompany,
  getApiUrl,
  getFrontendOrigin,
  isCrawlerUserAgent,
  ogCacheHeaders,
  pickShareImage,
} from "../_lib/ogHelpers.js";

export default async function handler(req, res) {
  const { id } = req.query;
  const userAgent = req.headers["user-agent"] || "";
  const isCrawler = isCrawlerUserAgent(userAgent);

  if (!isCrawler && !req.query.test) {
    return res.redirect(302, `/blog/${id}`);
  }

  try {
    const API_URL = getApiUrl();
    if (!API_URL) {
      throw new Error("API URL not configured");
    }

    const frontendOrigin = getFrontendOrigin(req);
    const [blogRes, company] = await Promise.all([
      fetch(`${API_URL}/blogs/${id}`),
      fetchCompany(API_URL),
    ]);

    if (!blogRes.ok) {
      throw new Error(`Blog API returned ${blogRes.status}`);
    }

    const blogData = await blogRes.json();
    const blog = blogData.data || blogData;
    if (!blog) {
      throw new Error("Blog not found");
    }

    const companyName = company.company || "Store";
    const blogImage = blog.image || "";
    const ogImageUrl =
      pickShareImage({
        companyLogo: company.logo,
        companyFavicon: company.favicon,
        productImage: blogImage,
        apiUrl: API_URL,
        frontendOrigin,
        preferBrand: false,
      }) || `${frontendOrigin}/product.png`;

    const description = cleanDescription(
      blog.description || blog.subTag,
      `${blog.title} — ${companyName}`
    );

    const pageUrl = `${frontendOrigin}/blog/${id}`;
    const pageTitle = `${blog.title} | ${companyName}`;
    const ogTitle = `${blog.title} | ${companyName}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:title" content="${escapeHtml(ogTitle)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${ogImageUrl}" />
  <meta property="og:image:secure_url" content="${ogImageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${escapeHtml(companyName)}" />
  <meta property="og:site_name" content="${escapeHtml(companyName)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${pageUrl}" />
  <meta name="twitter:title" content="${escapeHtml(ogTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${ogImageUrl}" />
  <meta name="twitter:image:alt" content="${escapeHtml(companyName)}" />
  <link rel="canonical" href="${pageUrl}" />
</head>
<body>
  <h1>${escapeHtml(blog.title)}</h1>
  <p>${escapeHtml(description)}</p>
  <p><strong>${escapeHtml(companyName)}</strong></p>
  <img src="${ogImageUrl}" alt="${escapeHtml(companyName)}" style="max-width:100%;height:auto;" />
  <p><a href="${pageUrl}">Read article</a></p>
</body>
</html>`;

    const headers = ogCacheHeaders();
    res.setHeader("Content-Type", headers["Content-Type"]);
    res.setHeader("Cache-Control", headers["Cache-Control"]);
    return res.status(200).send(html);
  } catch (error) {
    console.error("Blog OG handler error:", error);

    if (req.query.test) {
      return res.status(500).send(`<pre>${escapeHtml(error.message)}</pre>`);
    }

    return res.redirect(302, `/blog/${id}`);
  }
}
