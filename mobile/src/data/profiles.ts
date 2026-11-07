import { COURSES_BY_PROFILE, type CourseItem } from './courses';

export type ProfileId = 'medicine' | 'economics' | 'engineering';

export type OpportunityType = 'internship' | 'job' | 'workshop' | 'career event';

export interface StudentProfile {
  id: ProfileId;
  label: string;
  name: string;
  course: string;
  yearOfStudy: string;
  bio: string;
  interests: string[];
  courses: CourseItem[];
}

export interface OpportunityItem {
  id: string;
  profileId: ProfileId;
  companyName: string;
  companyInitials: string;
  title: string;
  type: OpportunityType;
  location: string;
  dateOrDeadline: string;
  description: string;
  interestTag: string;
}

export const PROFILES: Record<ProfileId, StudentProfile> = {
  medicine: {
    id: 'medicine',
    label: 'Medicine',
    name: 'Elena Rossi',
    course: 'Medicine and Surgery',
    yearOfStudy: '5th Year',
    bio: 'Medical student focused on cardiovascular clinical practice, translational research, and digital diagnostics.',
    interests: ['Cardiology', 'Clinical Research', 'Biotech & Pharma', 'Public Health'],
    courses: COURSES_BY_PROFILE.medicine,
  },
  economics: {
    id: 'economics',
    label: 'Economics',
    name: 'Marco Conti',
    course: 'BSc Economics and Finance',
    yearOfStudy: '3rd Year',
    bio: 'Economics student interested in digital payments, strategy consulting, and sustainable market analysis.',
    interests: ['Fintech', 'Strategy Consulting', 'Quantitative Finance', 'ESG & Policy'],
    courses: COURSES_BY_PROFILE.economics,
  },
  engineering: {
    id: 'engineering',
    label: 'AI',
    name: 'Sofia Ferri',
    course: 'MSc Artificial Intelligence',
    yearOfStudy: '2nd Year (MSc)',
    bio: 'AI student passionate about deep learning, autonomous systems, and natural language understanding.',
    interests: ['Robotics', 'Sustainable Energy', 'Embedded Systems', 'Automotive R&D'],
    courses: COURSES_BY_PROFILE.engineering,
  },
};

export const PROFILE_ORDER: ProfileId[] = ['medicine', 'economics', 'engineering'];

export const OPPORTUNITIES: OpportunityItem[] = [
  // Medicine
  {
    id: 'med-1',
    profileId: 'medicine',
    companyName: 'San Raffaele Hospital',
    companyInitials: 'SR',
    title: 'Cardiology Clinical Rotation',
    type: 'internship',
    location: 'Milan, Italy (On-site)',
    dateOrDeadline: 'Apply by Nov 30',
    description: '8-week clinical rotation observing echocardiography and interventional cardiology rounds.',
    interestTag: 'Matches: Cardiology',
  },
  {
    id: 'med-2',
    profileId: 'medicine',
    companyName: 'Novartis Pharma',
    companyInitials: 'NV',
    title: 'Early Phase Clinical Trials Fellow',
    type: 'internship',
    location: 'Basel / Hybrid',
    dateOrDeadline: 'Apply by Dec 10',
    description: 'Fellowship supporting phase II cardiovascular protocol design and biomarker analysis.',
    interestTag: 'Matches: Clinical Research',
  },
  {
    id: 'med-3',
    profileId: 'medicine',
    companyName: 'Humanitas Research Institute',
    companyInitials: 'HM',
    title: 'Translational Immunology & Biotech Lab',
    type: 'workshop',
    location: 'Rozzano, Milan',
    dateOrDeadline: 'Dec 4, 2026',
    description: 'Hands-on workshop on CRISPR screening and cellular therapies for final-year MD students.',
    interestTag: 'Matches: Biotech & Pharma',
  },
  {
    id: 'med-4',
    profileId: 'medicine',
    companyName: 'Roche Diagnostics',
    companyInitials: 'RD',
    title: 'Junior Medical Affairs Associate',
    type: 'job',
    location: 'Monza, Italy',
    dateOrDeadline: 'Apply by Dec 18',
    description: 'Entry-level role bridging clinical cardiology evidence and diagnostic device teams.',
    interestTag: 'Matches: Biotech & Pharma',
  },
  {
    id: 'med-5',
    profileId: 'medicine',
    companyName: 'European Heart Center',
    companyInitials: 'EH',
    title: 'Arrhythmia & ECG Interpretation Bootcamp',
    type: 'workshop',
    location: 'Online / Live',
    dateOrDeadline: 'Nov 22, 2026',
    description: 'Interactive seminar reviewing complex clinical ECG cases with senior electrophysiologists.',
    interestTag: 'Matches: Cardiology',
  },
  {
    id: 'med-6',
    profileId: 'medicine',
    companyName: 'MedAlliance Health',
    companyInitials: 'MA',
    title: 'European Healthcare & Residency Fair',
    type: 'career event',
    location: 'Rome Congress Center',
    dateOrDeadline: 'Jan 15, 2027',
    description: 'Networking day with academic hospitals, public health agencies, and residency directors.',
    interestTag: 'Matches: Public Health',
  },
  {
    id: 'med-7',
    profileId: 'medicine',
    companyName: 'AstraZeneca R&D',
    companyInitials: 'AZ',
    title: 'Biostatistics in Clinical Research Assistant',
    type: 'job',
    location: 'Milan / Remote',
    dateOrDeadline: 'Apply by Jan 8',
    description: 'Part-time research assistantship analyzing real-world patient outcomes data.',
    interestTag: 'Matches: Clinical Research',
  },

  // Economics
  {
    id: 'eco-1',
    profileId: 'economics',
    companyName: 'Stripe',
    companyInitials: 'ST',
    title: 'Payment Infrastructure Product Analyst',
    type: 'internship',
    location: 'Dublin / Hybrid',
    dateOrDeadline: 'Apply by Nov 28',
    description: 'Summer analyst role modeling cross-border merchant settlement and treasury flows.',
    interestTag: 'Matches: Fintech',
  },
  {
    id: 'eco-2',
    profileId: 'economics',
    companyName: 'McKinsey & Company',
    companyInitials: 'MC',
    title: 'Junior Business Analyst — Strategy',
    type: 'job',
    location: 'Milan, Italy',
    dateOrDeadline: 'Apply by Dec 12',
    description: 'Graduate position working on digital transformation and corporate strategy cases.',
    interestTag: 'Matches: Strategy Consulting',
  },
  {
    id: 'eco-3',
    profileId: 'economics',
    companyName: 'Goldman Sachs',
    companyInitials: 'GS',
    title: 'Quantitative Strats Spring Workshop',
    type: 'workshop',
    location: 'London, UK',
    dateOrDeadline: 'Dec 6, 2026',
    description: 'Two-day case workshop on derivatives pricing, algorithmic execution, and risk modeling.',
    interestTag: 'Matches: Quantitative Finance',
  },
  {
    id: 'eco-4',
    profileId: 'economics',
    companyName: 'Revolut',
    companyInitials: 'RV',
    title: 'Open Banking & DeFi Campus Meetup',
    type: 'career event',
    location: 'Milan Campus Hub',
    dateOrDeadline: 'Nov 25, 2026',
    description: 'Panel discussion and networking evening with fintech product leads and economists.',
    interestTag: 'Matches: Fintech',
  },
  {
    id: 'eco-5',
    profileId: 'economics',
    companyName: 'Bain & Company',
    companyInitials: 'BC',
    title: 'Strategy Case Cracking Intensive',
    type: 'workshop',
    location: 'Rome, Italy',
    dateOrDeadline: 'Dec 2, 2026',
    description: 'Interactive session practicing market-sizing and M&A due diligence frameworks.',
    interestTag: 'Matches: Strategy Consulting',
  },
  {
    id: 'eco-6',
    profileId: 'economics',
    companyName: 'European Central Bank',
    companyInitials: 'EC',
    title: 'Green Bonds & ESG Policy Trainee',
    type: 'internship',
    location: 'Frankfurt, Germany',
    dateOrDeadline: 'Apply by Jan 10',
    description: 'Traineeship evaluating climate transition disclosures across eurozone financial institutions.',
    interestTag: 'Matches: ESG & Policy',
  },
  {
    id: 'eco-7',
    profileId: 'economics',
    companyName: 'BlackRock',
    companyInitials: 'BR',
    title: 'Portfolio Risk & Quantitative Analyst',
    type: 'job',
    location: 'Milan / Hybrid',
    dateOrDeadline: 'Apply by Dec 20',
    description: 'Graduate role building factor models and stress-testing multi-asset institutional portfolios.',
    interestTag: 'Matches: Quantitative Finance',
  },

  // Engineering
  {
    id: 'eng-1',
    profileId: 'engineering',
    companyName: 'Boston Dynamics',
    companyInitials: 'BD',
    title: 'Mobile Manipulation & Controls Intern',
    type: 'internship',
    location: 'Munich / Hybrid',
    dateOrDeadline: 'Apply by Dec 5',
    description: '6-month R&D internship implementing trajectory optimization on quadruped testbeds.',
    interestTag: 'Matches: Robotics',
  },
  {
    id: 'eng-2',
    profileId: 'engineering',
    companyName: 'Enel Green Power',
    companyInitials: 'EG',
    title: 'Grid-Scale Battery Storage Engineer',
    type: 'job',
    location: 'Milan, Italy',
    dateOrDeadline: 'Apply by Dec 15',
    description: 'Entry-level engineering position designing microgrid control systems for solar-plus-storage plants.',
    interestTag: 'Matches: Sustainable Energy',
  },
  {
    id: 'eng-3',
    profileId: 'engineering',
    companyName: 'Ferrari Scuderia R&D',
    companyInitials: 'FR',
    title: 'Hybrid Powertrain & Telemetry Intern',
    type: 'internship',
    location: 'Maranello, Italy',
    dateOrDeadline: 'Apply by Nov 29',
    description: 'Placement testing thermal management and energy recovery algorithms on bench rigs.',
    interestTag: 'Matches: Automotive R&D',
  },
  {
    id: 'eng-4',
    profileId: 'engineering',
    companyName: 'STMicroelectronics',
    companyInitials: 'ST',
    title: 'Edge AI & Embedded Firmware Workshop',
    type: 'workshop',
    location: 'Agrate Brianza, Italy',
    dateOrDeadline: 'Dec 9, 2026',
    description: 'Lab day deploying quantized neural networks on ultra-low-power ARM Cortex microcontrollers.',
    interestTag: 'Matches: Embedded Systems',
  },
  {
    id: 'eng-5',
    profileId: 'engineering',
    companyName: 'Siemens Energy',
    companyInitials: 'SE',
    title: 'Clean Tech & Hydrogen Engineering Forum',
    type: 'career event',
    location: 'Turin Exhibition Hall',
    dateOrDeadline: 'Jan 12, 2027',
    description: 'Career fair connecting graduate engineers with wind, hydrogen, and smart-grid teams.',
    interestTag: 'Matches: Sustainable Energy',
  },
  {
    id: 'eng-6',
    profileId: 'engineering',
    companyName: 'ABB Robotics',
    companyInitials: 'AB',
    title: 'Junior ROS2 & Vision Systems Engineer',
    type: 'job',
    location: 'Bergamo, Italy',
    dateOrDeadline: 'Apply by Dec 22',
    description: 'Graduate role developing 3D perception pipelines for collaborative assembly robots.',
    interestTag: 'Matches: Robotics',
  },
  {
    id: 'eng-7',
    profileId: 'engineering',
    companyName: 'Bosch Mobility',
    companyInitials: 'BM',
    title: 'Autonomous Driving Sensor Fusion Lab',
    type: 'workshop',
    location: 'Online / Live',
    dateOrDeadline: 'Nov 27, 2026',
    description: 'Hands-on session calibrating LiDAR and radar state-estimation filters for ADAS.',
    interestTag: 'Matches: Automotive R&D',
  },
];
