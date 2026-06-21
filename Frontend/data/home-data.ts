export const homeStats = [
  { label: "Resumes tailored", value: "100+" },
  { label: "Applications supported", value: "250+" },
  { label: "Avg. time to draft", value: "< 2 min" },
  { label: "User satisfaction", value: "4.9 / 5" },
] as const

export const homeTestimonials = [
  {
    name: "Sarah Chen",
    role: "Software engineer",
    quote:
      "The tailored output read like me—but aligned to the posting. I finally stopped guessing which keywords to use.",
    initials: "SC",
  },
  {
    name: "Michael Rodriguez",
    role: "Product manager",
    quote:
      "I keep one master resume and spin versions per role. It’s the fastest part of my application workflow now.",
    initials: "MR",
  },
  {
    name: "Emily Johnson",
    role: "UX designer",
    quote:
      "Clean structure and clear emphasis on impact. Recruiters actually commented on how scannable my resume was.",
    initials: "EJ",
  },
] as const

export const homeFaqItems = [
  {
    q: "Will my resume still sound like me?",
    a: "Yes. We align phrasing and emphasis to the job description while keeping your experience and voice intact. You should always review and tweak before you send.",
  },
  {
    q: "Does this help with ATS screening?",
    a: "We prioritize clear headings, standard section labels, and role-relevant keywords so parsers can read your file reliably. Export formats depend on your workflow—PDF is typical for applications.",
  },
  {
    q: "What file types can I upload?",
    a: "You can upload PDF, DOC, or DOCX. For best text extraction, use a text-based PDF rather than a scanned image when possible.",
  },
  {
    q: "Is my data kept private?",
    a: "Treat uploads as sensitive: use the product on a secure connection, avoid pasting confidential employer data you’re not allowed to share, and review our privacy policy when we publish it.",
  },
] as const

export const homeHowItWorksSteps = [
  { step: "1", title: "Upload resume", body: "PDF or Word—your baseline stays the source of truth." },
  { step: "2", title: "Paste the job post", body: "We use the description to infer priorities and language." },
  { step: "3", title: "Review & export", body: "Edit anything you want, then save or paste into your builder." },
] as const
