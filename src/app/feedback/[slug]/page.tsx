import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "~/trpc/server";
import { FeedbackForm } from "~/pageComponents/Feedback/FeedbackForm";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const { slug } = params;

  const data = await api.menus.getPublicMenuBySlug
    .query({ slug })
    .catch(() => null);

  const restaurantName = data?.name ?? "Restaurant";

  return {
    title: `Rate your experience | ${restaurantName} | Diyafa`,
    description: `Share your dining experience at ${restaurantName} and help us improve.`,
    robots: { index: false, follow: false },
  };
}

export default async function FeedbackPage({
  params: { slug },
}: {
  params: { slug: string };
}) {
  const data = await api.menus.getPublicMenuBySlug
    .query({ slug })
    .catch(() => notFound());

  if (!data.isPublished) {
    notFound();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <FeedbackForm
        menuId={data.id}
        restaurantName={data.name}
        logoUrl={data.logoImageUrl}
        googleReviewUrl={data.googleReviewUrl}
      />
    </main>
  );
}
