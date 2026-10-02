/**
 * Fill the LOCAL Firebase emulators with demo data for developing/testing the admin panel.
 * Refuses to run unless FIRESTORE_EMULATOR_HOST and FIREBASE_AUTH_EMULATOR_HOST are set,
 * so it can never write to the real project. All names are fictional demo data.
 *
 *   firebase emulators:start --only firestore,auth --project coltek-academy
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8181 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 npx tsx scripts/seed-emulator.ts
 *
 * Then run the app with NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true and sign in at /admin/login
 * as admin@demo.local / demo-admin-123.
 */
if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  console.error('Refusing to seed: set FIRESTORE_EMULATOR_HOST and FIREBASE_AUTH_EMULATOR_HOST (emulators only).')
  process.exit(1)
}

import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { Timestamp, getFirestore } from 'firebase-admin/firestore'

const app = initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'coltek-academy' }, 'seed-emulator')
const auth = getAuth(app)
const db = getFirestore(app)

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000)

const STUDENTS = [
  ['Ama Owusu', 'ama.owusu@demo.local', 2],
  ['Kwame Boateng', 'kwame.boateng@demo.local', 5],
  ['Efua Asante', 'efua.asante@demo.local', 9],
  ['Yaw Darko', 'yaw.darko@demo.local', 14],
  ['Akosua Mensah', 'akosua.mensah@demo.local', 21],
  ['Kofi Annan-Smith', 'kofi.as@demo.local', 30],
  ['Abena Ofori', 'abena.ofori@demo.local', 45],
] as const

const COURSES = [
  { id: 'demo-web', title: 'Complete Web Development Bootcamp', slug: 'demo-web', category: 'Web', level: 'Beginner', price: 1500, image: '/web-development-coding-laptop.jpg', isPublished: true },
  { id: 'demo-uiux', title: 'UI/UX Design Fundamentals', slug: 'demo-uiux', category: 'UI/UX', level: 'Beginner', price: 900, image: '/ux-ui-design-interface-mockup.jpg', isPublished: true },
  { id: 'demo-data', title: 'Data Science with Python', slug: 'demo-data', category: 'Data Science', level: 'Intermediate', price: 0, image: '/data-science-visualization-charts.png', isPublished: true, upcoming: true },
  { id: 'demo-cloud', title: 'Cloud Computing with AWS', slug: 'demo-cloud', category: 'Cloud Computing', level: 'Intermediate', price: 1200, image: '/cloud-computing-aws-servers.jpg', isPublished: false },
  { id: 'demo-marketing', title: 'Digital Marketing Essentials', slug: 'demo-marketing', category: 'Marketing', level: 'Beginner', price: 0, image: '/digital-marketing-social-media-analytics.jpg', isPublished: true },
]

async function main() {
  // Admin
  const admin = await auth.createUser({ email: 'admin@demo.local', password: 'demo-admin-123', displayName: 'Demo Admin', emailVerified: true })
  await auth.setCustomUserClaims(admin.uid, { admin: true })
  await db.doc(`users/${admin.uid}`).set({ uid: admin.uid, email: admin.email, displayName: 'Demo Admin', role: 'admin', createdAt: daysAgo(90).toISOString() })
  await db.doc(`adminUsers/${admin.uid}`).set({ uid: admin.uid, email: admin.email, role: 'admin' })

  // Students
  const students: { uid: string; name: string; email: string }[] = []
  for (const [name, email, age] of STUDENTS) {
    const user = await auth.createUser({ email, password: 'demo-student-123', displayName: name })
    await db.doc(`users/${user.uid}`).set({ uid: user.uid, email, displayName: name, role: 'student', createdAt: daysAgo(age).toISOString() })
    students.push({ uid: user.uid, name, email })
  }
  // A profile without a sign-in account (what the old "add user" form created)
  await db.doc('users/orphan-demo').set({ uid: 'orphan-demo', email: 'no.login@demo.local', displayName: 'Profile Without Login', role: 'student', createdAt: daysAgo(60).toISOString() })

  // Courses
  for (const [index, course] of COURSES.entries()) {
    await db.doc(`courses/${course.id}`).set({ ...course, description: `${course.title} — demo course.`, isFree: course.price === 0, createdAt: daysAgo(120 - index * 10).toISOString() })
  }

  // Enrollments
  const plan: [number, number, string, number][] = [
    [0, 0, 'active', 1], [1, 0, 'active', 3], [2, 1, 'completed', 8], [3, 0, 'completed', 12], [4, 4, 'active', 15],
    [5, 1, 'active', 20], [6, 0, 'cancelled', 25], [0, 4, 'active', 26], [2, 0, 'completed', 40],
  ]
  for (const [s, c, status, age] of plan) {
    const student = students[s]
    const course = COURSES[c]
    const [firstName, ...rest] = student.name.split(' ')
    const ref = db.collection('enrollments').doc()
    await ref.set({
      id: ref.id,
      userId: student.uid,
      userEmail: student.email,
      courseId: course.id,
      courseTitle: course.title,
      enrollmentDate: daysAgo(age).toISOString(),
      paymentMethod: course.price > 0 ? 'paystack' : 'free',
      paymentAmount: course.price,
      paymentReference: course.price > 0 ? `DEMO-${ref.id.slice(0, 8).toUpperCase()}` : `FREE-${ref.id.slice(0, 8)}`,
      status,
      personalInfo: { firstName, lastName: rest.join(' '), email: student.email, phone: '' },
    })
  }

  // Certificates
  for (const [s, c, age, status] of [[2, 1, 6, 'issued'], [3, 0, 10, 'issued'], [2, 0, 35, 'issued'], [6, 0, 50, 'revoked']] as const) {
    const student = students[s]
    const course = COURSES[c]
    const ref = db.collection('certificates').doc()
    await ref.set({
      id: ref.id,
      certificateId: ref.id,
      userId: student.uid,
      recipientName: student.name,
      recipientEmail: student.email,
      courseId: course.id,
      courseTitle: course.title,
      courseName: course.title,
      issueDate: Timestamp.fromDate(daysAgo(age)),
      completionDate: Timestamp.fromDate(daysAgo(age + 2)),
      status,
      certificateUrl: '/placeholder.jpg',
      verificationCode: `DEMO${String(age).padStart(4, '0')}`,
    })
  }

  // Testimonials and projects
  const testimonials = [
    ['Efua Asante', 'UI/UX Design graduate', 'The hands-on projects helped me build a portfolio I was proud to show employers.', 5, true],
    ['Yaw Darko', 'Web Development graduate', 'Clear lessons and patient instructors. I built and deployed my first full website.', 5, true],
    ['Akosua Mensah', 'Digital Marketing student', 'Practical and well organised. I use what I learned every week.', 4, false],
  ] as const
  for (const [index, [name, role, content, rating, isPublished]] of testimonials.entries()) {
    await db.collection('testimonials').add({ name, role, content, rating, isPublished, order: index, avatarUrl: '', createdAt: Timestamp.now() })
  }
  const projects = [
    ['Campus Events Finder', 'Yaw Darko', 'demo-web', 'A responsive web app for discovering events on campus.', ['React', 'Firebase'], '/web-development-coding-laptop.jpg', true],
    ['Clinic Booking App Redesign', 'Efua Asante', 'demo-uiux', 'A redesign of a clinic appointment flow, tested with five users.', ['Figma', 'User research'], '/ux-ui-design-interface-mockup.jpg', true],
    ['Sales Dashboard', 'Ama Owusu', 'demo-data', 'Exploratory analysis of shop sales with charts.', ['Python', 'Pandas'], '/data-science-visualization-charts.png', false],
  ] as const
  for (const [index, [title, studentName, courseId, description, technologies, imageUrl, isPublished]] of projects.entries()) {
    await db.collection('projects').add({ title, studentName, courseId, description, technologies, imageUrl, isPublished, order: index, cohort: '2026', projectUrl: 'https://example.com', repoUrl: '', createdAt: Timestamp.now() })
  }

  // Activity
  await db.collection('activities').add({ type: 'CERTIFICATE_ISSUED', user: { id: students[2].uid, name: students[2].name, email: students[2].email }, course: { id: 'demo-uiux', title: COURSES[1].title }, timestamp: Timestamp.fromDate(daysAgo(6)), metadata: {} })
  await db.collection('activities').add({ type: 'CERTIFICATE_ISSUED', user: { id: students[3].uid, name: students[3].name, email: students[3].email }, course: { id: 'demo-web', title: COURSES[0].title }, timestamp: Timestamp.fromDate(daysAgo(10)), metadata: {} })

  console.log(`Seeded emulators: admin@demo.local / demo-admin-123, ${students.length} students, ${COURSES.length} courses.`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
