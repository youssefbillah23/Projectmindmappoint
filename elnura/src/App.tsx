import { useLenis } from "./hooks/useLenis";
import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { FloatingGallery } from "./components/FloatingGallery";
import { Approach } from "./components/Approach";
import { DarkStats } from "./components/DarkStats";
import { Showcase } from "./components/Showcase";
import { Testimonial } from "./components/Testimonial";
import { BigStatement } from "./components/BigStatement";
import { Focus } from "./components/Focus";
import { Pricing } from "./components/Pricing";
import { FinalCTA } from "./components/FinalCTA";
import { Footer } from "./components/Footer";

export default function App() {
  useLenis();

  return (
    <main className="relative">
      <Nav />
      <Hero />
      <FloatingGallery />
      <Approach />
      <DarkStats />
      <Showcase />
      <Testimonial />
      <BigStatement />
      <Focus />
      <Pricing />
      <FinalCTA />
      <Footer />
    </main>
  );
}
