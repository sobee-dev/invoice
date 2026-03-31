import { MetadataRoute } from 'next'
 
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://billbuzz.ng'
 
  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
  ]

  // Optional: Fetch public receipt IDs from Django to index them
  // const receipts = await fetchReceiptsFromDjango();
  // const receiptPages = receipts.map(id => ({ url: `${baseUrl}/receipt/${id}`, ... }));

  return [...staticPages]
}