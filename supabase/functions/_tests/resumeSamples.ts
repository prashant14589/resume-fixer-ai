export type ResumeSample = {
  expected: {
    maxScore?: number;
    minScore?: number;
    notes: string;
  };
  id: string;
  rolePreset?: string;
  text: string;
  title: string;
};

export const RESUME_SAMPLES: ResumeSample[] = [
  {
    expected: {
      maxScore: 50,
      minScore: 30,
      notes: 'Weak fresher with no metrics; should remain low before rewrite.',
    },
    id: 'resume-1-weak-fresher',
    rolePreset: 'software-dev',
    title: 'Weak Fresher (No Metrics)',
    text: `Name: Amit Verma
Email: amitv@gmail.com | Phone: 9876543210

OBJECTIVE
Looking for a job in software development.

EDUCATION
B.Tech Computer Science — 2024 — 7.2 CGPA

SKILLS
Java, Python, HTML, CSS

PROJECTS
Library Management System
Made a system to manage books and records.

Weather App
Created an app to show weather.

INTERNSHIP
Software Intern
Worked on frontend.`,
  },
  {
    expected: {
      maxScore: 70,
      minScore: 50,
      notes: 'Average fresher profile should land in the mid band.',
    },
    id: 'resume-2-average-fresher',
    rolePreset: 'software-dev',
    title: 'Average Fresher',
    text: `Name: Sneha Kulkarni
Email: sneha@gmail.com | Phone: 9988776655
Location: Pune

EDUCATION
B.E. IT — 2023 — 8.1 CGPA

SKILLS
Java, SQL, HTML, CSS, JavaScript, React

PROJECTS
E-commerce Website
Developed frontend using React and integrated APIs.

Chat Application
Built a chat app using Node.js and Socket.io.

INTERNSHIP
Web Developer Intern
Worked on UI features and fixed bugs.`,
  },
  {
    expected: {
      maxScore: 85,
      minScore: 70,
      notes: 'Good fresher with real metrics should score high with smaller rewrite gain.',
    },
    id: 'resume-3-good-fresher-metrics',
    rolePreset: 'software-dev',
    title: 'Good Fresher (With Metrics)',
    text: `Name: Karan Mehta
Email: karan@gmail.com | Phone: 9871234567

EDUCATION
B.Tech CSE — 2023 — 8.8 CGPA

SKILLS
Java, Spring Boot, MySQL, React, Git

PROJECTS
Task Management App
Built full-stack app using React and Spring Boot, handling 500+ tasks.

Analytics Dashboard
Created dashboard visualizing data for 1000+ records.

INTERNSHIP
Backend Developer Intern
Developed REST APIs used by 3 modules, reduced response time by 20%.`,
  },
  {
    expected: {
      maxScore: 75,
      minScore: 35,
      notes: 'Non-tech profile should not be unfairly crushed if role preset is general/operations.',
    },
    id: 'resume-4-non-tech',
    rolePreset: 'general',
    title: 'Non-Tech (Fairness Check)',
    text: `Name: Riya Sharma
Email: riya@gmail.com | Phone: 9988112233

EDUCATION
BBA — 2022

SKILLS
Communication, Excel, PowerPoint, Teamwork

EXPERIENCE
Sales Intern
Handled client calls and assisted in sales operations.

PROJECTS
Market Research Study
Collected and analyzed customer data.`,
  },
  {
    expected: {
      maxScore: 60,
      minScore: 20,
      notes: 'Bad formatting should depress structure/parser quality and expose edge handling.',
    },
    id: 'resume-5-bad-formatting',
    rolePreset: 'software-dev',
    title: 'Bad Formatting (Edge Case)',
    text: `Name Rahul
Email rahul@email.com Phone 9999999999

Skills Java Python SQL

Did project student system using java mysql

Internship worked in company did frontend

Education BE 2024`,
  },
];
