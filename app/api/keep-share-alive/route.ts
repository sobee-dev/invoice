// app/api/keep-share-alive/route.ts
// ping every 4-5 mins
export async function GET() {
  return Response.json({ ok: true });
}