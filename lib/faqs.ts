export interface Faq {
  question: string
  answer: string
}

/**
 * Single source of truth for FAQ content. Answers must reflect how the Academy actually
 * works (see CLAUDE.md §5) — do not add claims that the application cannot support.
 */

// Shown on /contact (moved here unchanged from components/contact/faq-section.tsx)
export const contactFaqs: Faq[] = [
  {
    question: "How do I enroll in a course?",
    answer:
      "To enroll in a course, browse our course catalog, select the course you're interested in, and click the 'Enroll Now' button. You'll be guided through the registration process where you can provide your information and select a payment method.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "Course payments are processed securely through Paystack. You can pay with a debit or credit card during enrollment.",
  },
  {
    question: "Can I get a refund if I'm not satisfied?",
    answer:
      "Refunds are handled according to our Terms & Conditions. Please review them before enrolling, and contact our support team if you have a question about a payment.",
  },
  {
    question: "Do I get a certificate upon completion?",
    answer:
      "Yes, upon successful completion of any course, you'll receive a verified certificate that you can share on LinkedIn or include in your resume.",
  },
  {
    question: "How long do I have access to course materials?",
    answer:
      "Once enrolled, you have lifetime access to the course materials. You can learn at your own pace and revisit the content whenever you need a refresher.",
  },
  {
    question: "Are the courses self-paced?",
    answer:
      "Most of our courses are self-paced, allowing you to learn on your own schedule. Some bootcamp-style courses have cohort start dates and weekly deadlines to keep you on track.",
  },
]

const byQuestion = (question: string) => {
  const faq = contactFaqs.find((item) => item.question === question)
  if (!faq) throw new Error(`Missing FAQ: ${question}`)
  return faq
}

// Shown on the home page. Additional answers describe behaviour that exists in the app
// (account requirement, schedule preference, admin-set duration/mode, course prerequisites).
export const homeFaqs: Faq[] = [
  byQuestion("How do I enroll in a course?"),
  {
    question: "Do I need an account to enroll?",
    answer:
      "Yes. Create a free account with your email, Google or GitHub before you register for a course. Your enrollments and certificates are kept in your dashboard.",
  },
  {
    question: "Who can join, and are there any requirements?",
    answer:
      "Each course page lists its level and prerequisites, so you can check whether a course suits your current experience before you enroll.",
  },
  {
    question: "How long are the courses, and are they online or in person?",
    answer: "Each course page shows the course duration and whether it is taught online or in person.",
  },
  {
    question: "Can I choose when I study?",
    answer: "When you register for a course, you can tell us whether you prefer weekdays or weekends.",
  },
  byQuestion("What payment methods do you accept?"),
  byQuestion("Do I get a certificate upon completion?"),
  byQuestion("Can I get a refund if I'm not satisfied?"),
]

const homeByQuestion = (question: string) => {
  const faq = homeFaqs.find((item) => item.question === question)
  if (!faq) throw new Error(`Missing FAQ: ${question}`)
  return faq
}

// Shown on course detail pages. The certificate answer is only included when the course offers one.
export function getCourseFaqs({ certificateIncluded }: { certificateIncluded: boolean }): Faq[] {
  return [
    homeByQuestion("Do I need an account to enroll?"),
    homeByQuestion("Can I choose when I study?"),
    homeByQuestion("What payment methods do you accept?"),
    ...(certificateIncluded ? [homeByQuestion("Do I get a certificate upon completion?")] : []),
    homeByQuestion("Can I get a refund if I'm not satisfied?"),
  ]
}
