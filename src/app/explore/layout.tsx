import { Navbar } from "~/components/Navbar/Navbar";
import { Footer } from "~/pageComponents/LandingPage/molecules/Footer";

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
