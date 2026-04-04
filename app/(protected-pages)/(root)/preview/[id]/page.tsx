import PreviewPageContent from "./PreviewPageContent";


export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  "use no store"; 
  const { id } = await params;
  return <PreviewPageContent id={id} />;
}