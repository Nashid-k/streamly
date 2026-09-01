import { Helmet } from "react-helmet-async";

const DEFAULT_DESCRIPTION =
  "Streamly — Discover and stream movies & TV shows from Netflix, Prime Video, Hotstar, Apple TV+, Zee5, Sony LIV and JioCinema.";
const DEFAULT_IMAGE = "/og-image.png";
const SITE_NAME = "Streamly";

export default function SEO({
  title,
  description,
  image,
  type = "website",
  noindex = false,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const metaDescription = description || DEFAULT_DESCRIPTION;
  const metaImage = image || DEFAULT_IMAGE;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />

      {/* Theme */}
      <meta name="theme-color" content="#000000" />
    </Helmet>
  );
}
