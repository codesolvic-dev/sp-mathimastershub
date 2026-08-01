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
    return res.redirect(302, `/product/${id}`);
  }

  try {
    const API_URL = getApiUrl();
    if (!API_URL) {
      throw new Error("API URL not configured");
    }

    const frontendOrigin = getFrontendOrigin(req);
    const [productRes, company] = await Promise.all([
      fetch(`${API_URL}/products/${id}`),
      fetchCompany(API_URL),
    ]);

    if (!productRes.ok) {
      throw new Error(`Product API returned ${productRes.status}`);
    }

    const productData = await productRes.json();
    const product = productData.data || productData;
    if (!product) {
      throw new Error("Product not found");
    }

    const productImages = [
      product.image1,
      product.image2,
      product.image3,
      product.image4,
      product.image5,
      product.image6,
      ...(Array.isArray(product.images) ? product.images : []),
      ...(Array.isArray(product.variants)
        ? product.variants.map((v) => v?.image).filter(Boolean)
        : []),
    ].filter((img) => img && String(img).trim() && !String(img).toLowerCase().includes("product.png"));

    const companyName = company.company || "Store";
    const primaryProductImage = productImages[0] || product.image1 || "";
    const ogImageUrl =
      pickShareImage({
        companyLogo: company.logo,
        companyFavicon: company.favicon,
        productImage: primaryProductImage,
        apiUrl: API_URL,
        frontendOrigin,
        preferBrand: false,
      }) || `${frontendOrigin}/product.png`;

    const description = cleanDescription(
      product.description,
      `${product.name} — ${companyName}`
    );

    const pageUrl = `${frontendOrigin}/product/${id}`;
    const pageTitle = `${product.name} | ${companyName}`;
    const ogTitle = `${product.name} | ${companyName}`;
    const imageAlt = product.name || companyName;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="product" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:title" content="${escapeHtml(ogTitle)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${ogImageUrl}" />
  <meta property="og:image:secure_url" content="${ogImageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${escapeHtml(imageAlt)}" />
  <meta property="og:site_name" content="${escapeHtml(companyName)}" />
  <meta property="product:price:amount" content="${product.price || ""}" />
  <meta property="product:price:currency" content="PKR" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${pageUrl}" />
  <meta name="twitter:title" content="${escapeHtml(ogTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${ogImageUrl}" />
  <meta name="twitter:image:alt" content="${escapeHtml(imageAlt)}" />
  <link rel="canonical" href="${pageUrl}" />
</head>
<body>
  <h1>${escapeHtml(product.name)}</h1>
  <p>${escapeHtml(description)}</p>
  <p><strong>${escapeHtml(companyName)}</strong></p>
  <img src="${ogImageUrl}" alt="${escapeHtml(imageAlt)}" style="max-width:100%;height:auto;" />
  <p><a href="${pageUrl}">View product</a></p>
</body>
</html>`;

    const headers = ogCacheHeaders({ short: true });
    res.setHeader("Content-Type", headers["Content-Type"]);
    res.setHeader("Cache-Control", headers["Cache-Control"]);
    return res.status(200).send(html);
  } catch (error) {
    console.error("Product OG handler error:", error);

    if (req.query.test) {
      return res.status(500).send(`<pre>${escapeHtml(error.message)}</pre>`);
    }

    return res.redirect(302, `/product/${id}`);
  }
}
