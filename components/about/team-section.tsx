import Image from "next/image"
import { Linkedin, Twitter } from "lucide-react"

const team = [
  {
    name: "Mr. Boansi Kyeremateng Collins",
    role: "CEO & Founder",
    image: "/ceo.jpg",
    bio: "Software Engineer dedicated to empowering learners through hands-on tech education.",
    linkedin: "www.linkedin.com/in/boansi-kyeremateng-collins",
    twitter: "https://x.com/Profs123456",
  },
  {
    name: "Miss. Alhassan Habibah",
    role: "Chief Academic Officer",
    image: "/habiba.jpeg",
    bio: "Chief Academic Officer with extensive experience in curriculum development and educational technology.",
    linkedin: "https://www.linkedin.com/in/habiba-alhassan-6075202bb?utm_source=share_via&utm_content=profile&utm_medium=member_ios",
    twitter: "#",
  },
  {
    name: "Mr. Donkor Pius",
    role: "VP of Student Success",
    image: "/pius.jpeg",
    bio: "Dedicated to ensuring every student achieves their goals.",
    linkedin: "https://www.linkedin.com/in/pius-donkor",
    twitter: "https://x.com/PiusDonkor35156",
  },
  {
    name: "Mr. Frederick Owusu Bonsu",
    role: "Chief Technology Officer",
    image: "/CTO.jpg",
    bio: "Chief Technology Officer and mobile application engineer focused on building reliable and scalable digital learning solutions.",
    linkedin: "#",
    twitter: "#",
  },
]

export function TeamSection() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Meet Our Leadership</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
          Driven by passion and experience, our leadership team blends technology, education, and innovation to shape impactful learning experiences at COLTEK ACADEMY.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member) => (
            <div key={member.name} className="bg-card border border-border rounded-xl overflow-hidden group">
              <div className="relative h-64">
                <Image
                  src={member.image || "/placeholder.svg"}
                  alt={member.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <h3 className="font-semibold text-foreground mb-1">{member.name}</h3>
                <p className="text-primary text-sm mb-2">{member.role}</p>
                <p className="text-muted-foreground text-sm mb-4">{member.bio}</p>
                <div className="flex gap-3">
                  <a
                    href={member.linkedin}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    aria-label={`${member.name} LinkedIn`}
                  >
                    <Linkedin className="h-4 w-4" />
                  </a>
                  <a
                    href={member.twitter}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    aria-label={`${member.name} Twitter`}
                  >
                    <Twitter className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
