import { site } from "@/content/site";
import TextReveal from "@/components/TextReveal";
import Disintegrate from "@/components/Disintegrate";
import Work from "./Work";
import s from "./sections.module.scss";

// Section ids are read by ParticleScene to drive the face → globe → India morph:
// #statement, #world, #india, #learning, #work. Keep them if you reorder sections.

export function Hero() {
  return (
    <section id="hero" className={`${s.section} ${s.bottom}`}>
      <div className={s.heroRow}>
        <TextReveal as="h1" mode="chars" text={site.name} className={s.name} />
        <p className={s.role}>{site.role}</p>
      </div>
    </section>
  );
}

export function Statement() {
  return (
    <section id="statement" className={`${s.section} ${s.center}`}>
      <TextReveal text={site.statement} className={s.statement} />
    </section>
  );
}

export function World() {
  return (
    <section id="world" className={`${s.section} ${s.bottom}`}>
      <p className={s.line}>
        {site.world[0]}
        <br />
        <span className={s.muted}>{site.world[1]}</span>
      </p>
    </section>
  );
}

export function India() {
  return (
    <section id="india" className={`${s.section} ${s.bottom}`}>
      <p className={s.line}>{site.location}</p>
    </section>
  );
}

export function Learning() {
  return (
    <section id="learning" className={`${s.section} ${s.center}`}>
      <div className={s.learning}>
        <p className={s.line}>{site.learning.lead}</p>
        <p className={s.muted}>{site.learning.focus}</p>
        <ul className={s.marks}>
          {site.learning.marks.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function HowIWork() {
  return (
    <section id="how" className={`${s.section} ${s.center} ${s.tall}`}>
      <p className={s.howIWork}>{site.howIWork}</p>
    </section>
  );
}

export function SelectedWork() {
  return (
    <section id="work" className={s.section}>
      <div className={s.workHead}>
        <h2 className={s.line}>{site.work.heading}</h2>
        <p className={s.muted}>{site.work.sub}</p>
      </div>
      <Work projects={site.work.projects} />
    </section>
  );
}

export function Contact() {
  const { heading, email, linkedin } = site.contact;
  return (
    <section id="contact" className={`${s.section} ${s.bottom}`}>
      <div className={s.contact}>
        <h2 className={`${s.line} ${s.muted}`}>{heading}</h2>
        <p className={s.email}>
          <Disintegrate href={`mailto:${email}`}>{email}</Disintegrate>
        </p>
        <p className={s.muted}>
          or reach out on{" "}
          <Disintegrate href={linkedin} external className={s.inlineLink}>
            LinkedIn
          </Disintegrate>
        </p>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className={s.footer}>
      <div>
        <p>{site.footer.hello}</p>
        <p>{site.fullName}, © {site.footer.year}</p>
      </div>
      <p>{site.footer.cookies}</p>
    </footer>
  );
}
