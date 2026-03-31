import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/',  '/features', '/pricing'], // Public pages
      disallow: [
        '/dashboard/',   // Private user area
        '/settings/',    // Private user settings
        '/api/',         // Internal API routes
        '/_next/',       // Next.js internal files
      ],
    },
    sitemap: 'https://billbuzz.ng/sitemap.xml',
  }
}