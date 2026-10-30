import Cursor from "@/components/Cursor";
import Grain from "@/components/Grain";
import ParticleScene from "@/components/ParticleScene/ParticleScene";
import Preloader from "@/components/Preloader";
import SmoothScroll from "@/components/SmoothScroll";
import {
  Contact,
  Footer,
  Hero,
  HowIWork,
  India,
  Learning,
  SelectedWork,
  Statement,
  World,
} from "@/sections/Sections";

export default function Home() {
  return (
    <>
      <Preloader />
      <SmoothScroll />
      <ParticleScene />
      <main>
        <Hero />
        <Statement />
        <World />
        <India />
        <Learning />
        <HowIWork />
        <SelectedWork />
        <Contact />
      </main>
      <Footer />
      <Grain />
      <Cursor />
    </>
  );
}
