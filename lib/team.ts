/**
 * Coltek Academy leadership team — single source for the About page and course instructors.
 * Content as provided by the Academy (previously duplicated in team-section, course-hero and course-content).
 */
export interface TeamMember {
  id: "ceo" | "cao" | "vp-student-success" | "cto"
  name: string
  role: string
  image: string
  bio: string
  /** Only real profile URLs; omitted when the Academy has not provided one. */
  linkedin?: string
  twitter?: string
}

export const team: TeamMember[] = [
  {
    id: "ceo",
    name: "Mr. Boansi Kyeremateng Collins",
    role: "CEO & Founder",
    image: "/ceo.jpg",
    bio: "Software Engineer dedicated to empowering learners through hands-on tech education.",
    linkedin: "https://www.linkedin.com/in/boansi-kyeremateng-collins",
    twitter: "https://x.com/Profs123456",
  },
  {
    id: "cao",
    name: "Miss. Alhassan Habibah",
    role: "Chief Academic Officer",
    image: "/habiba.jpeg",
    bio: "Chief Academic Officer with extensive experience in curriculum development and educational technology.",
    linkedin: "https://www.linkedin.com/in/habiba-alhassan-6075202bb?utm_source=share_via&utm_content=profile&utm_medium=member_ios",
  },
  {
    id: "vp-student-success",
    name: "Mr. Donkor Pius",
    role: "VP of Student Success",
    image: "/pius.jpeg",
    bio: "Dedicated to ensuring every student achieves their goals.",
    linkedin: "https://www.linkedin.com/in/pius-donkor",
    twitter: "https://x.com/PiusDonkor35156",
  },
  {
    id: "cto",
    name: "Mr. Frederick Owusu Bonsu",
    role: "Chief Technology Officer",
    image: "/CTO.jpg",
    bio: "Chief Technology Officer and mobile application engineer focused on building reliable and scalable digital learning solutions.",
  },
]

const byId = (id: TeamMember["id"]) => team.find((member) => member.id === id)!

/** The Academy's existing rule for who teaches a course: Mobile App → CTO, Marketing → CAO, otherwise CEO. */
export function getCourseInstructor(category?: string): TeamMember {
  if (category === "Mobile App") return byId("cto")
  if (category === "Marketing") return byId("cao")
  return byId("ceo")
}
