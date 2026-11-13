/**
 * Static preview build (GitHub Pages): no server, so applying/newsletter/admin are unavailable.
 * Applications fall back to the original Google Form until the full site is deployed.
 */
export const STATIC_SITE = process.env.NEXT_PUBLIC_STATIC_SITE === "1";
export const GOOGLE_FORM_URL = "https://forms.gle/HDfNeipKM8vxSapD9";
