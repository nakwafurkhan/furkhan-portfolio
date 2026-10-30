// All copy lives here. Edit this file to change what the site says.

export const site = {
  name: "Furkhan Nakwa",
  fullName: "Furkhan Yahya Ali Nakwa",
  // Words of fullName that fade out at the end of the preloader.
  middleNames: ["Yahya", "Ali"],
  role: "Software engineering student, building full-stack",
  title: "Furkhan Nakwa — Student. Builder. Always learning.",
  description:
    "Student by title, builder by drive. Learning fast, aiming high, turning curiosity into craft.",

  statement:
    "I'm a student with a restless mind. I learn it, I build it, I ship it, then go find the next thing I can't do yet.",

  world: ["Working globally,", "available everywhere"],
  location: "Based in Udupi, India",

  learning: {
    lead: "Computer Software Engineering at Kalvium × Lovely Professional University, 2024 to 2028.",
    focus: "Full-stack and front-end development, with a habit of automating whatever repeats.",
    marks: [
      "Top 3% in Process Improvement",
      "Top 5% in Data-Driven Decision Making",
    ],
  },

  howIWork:
    "Persistent by nature, fast by habit. I figure things out as I go, turn rough ideas into real things, and I'm never shy about showing what I can do.",

  work: {
    heading: "Selected work",
    sub: "More on the way. I'm just getting started.",
    // Replace with real projects. `image` is a path under /public.
    projects: [
      { title: "Project One", year: "2026", href: "#", image: "/works/placeholder-1.svg" },
      { title: "Project Two", year: "2026", href: "#", image: "/works/placeholder-2.svg" },
      { title: "Project Three", year: "2025", href: "#", image: "/works/placeholder-3.svg" },
      { title: "Project Four", year: "2025", href: "#", image: "/works/placeholder-4.svg" },
    ],
  },

  contact: {
    heading: "Get in touch",
    email: "furkhannakwa@gmail.com",
    linkedin: "https://www.linkedin.com/in/nakwafurkhan/",
  },

  footer: {
    hello: "hey there!",
    year: "2026",
    cookies: "This website doesn't use cookies.",
  },
} as const;
