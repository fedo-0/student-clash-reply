import { type ProfileId } from './profiles';

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CourseQuiz {
  id: string;
  topic: string;
  weight: number;
  questions: QuizQuestion[];
}

export interface CourseItem {
  id: string;
  profileId: ProfileId;
  name: string;
  credits: number;
  color: string;
  quizzes: CourseQuiz[];
}

export interface ExamStatus {
  id: string;
  profileId: ProfileId;
  courseName: string;
  color: string;
  date: string;
  room: string;
  status: 'Booked' | 'Unavailable';
}

export interface QuizAttemptRecord {
  quizId: string;
  correctCount: number;
  totalCount: number;
  timestamp: number;
}

function buildQuestions(topic: string, subject: string): QuizQuestion[] {
  return [
    {
      id: `${topic}-q1`,
      prompt: `Which statement best describes the primary principle of ${topic} in ${subject}?`,
      options: [
        `It governs the core regulatory mechanism of ${topic.toLowerCase()}`,
        'It operates independently of baseline boundary conditions',
        'It only applies under static equilibrium assumptions',
        'It eliminates variance across all observed samples',
      ],
      correctIndex: 0,
      explanation: `In ${subject}, ${topic} is fundamentally defined by its primary regulatory and structural mechanisms.`,
    },
    {
      id: `${topic}-q2`,
      prompt: `When analyzing ${topic}, which factor has the strongest direct impact on system output?`,
      options: [
        'Random measurement noise in peripheral channels',
        `Key parameter sensitivity within the ${topic.toLowerCase()} pathway`,
        'Unrelated historical baseline averages',
        'Constant offset constants during initialization',
      ],
      correctIndex: 1,
      explanation: `Parameter sensitivity within the ${topic.toLowerCase()} pathway directly drives the primary response.`,
    },
    {
      id: `${topic}-q3`,
      prompt: `In a standard case study of ${topic}, what indicates an optimal state?`,
      options: [
        'Maximum divergence from reference thresholds',
        'Zero feedback across adjacent stages',
        `Balanced convergence within expected ${topic.toLowerCase()} bounds`,
        'Unbounded growth of secondary indicators',
      ],
      correctIndex: 2,
      explanation: `Optimal performance is characterized by stable convergence within reference bounds.`,
    },
    {
      id: `${topic}-q4`,
      prompt: `What is the most common pitfall when evaluating ${topic}?`,
      options: [
        'Accounting for confounding variables',
        'Validating results against an independent cohort',
        'Cross-checking boundary constraints',
        `Ignoring non-linear interactions in ${topic.toLowerCase()}`,
      ],
      correctIndex: 3,
      explanation: `Overlooking non-linear interactions frequently leads to misinterpreting ${topic.toLowerCase()} outcomes.`,
    },
  ];
}

export const COURSES_BY_PROFILE: Record<ProfileId, CourseItem[]> = {
  medicine: [
    {
      id: 'med-anatomy',
      profileId: 'medicine',
      name: 'Human Anatomy',
      credits: 10,
      color: '#D946EF',
      quizzes: [
        { id: 'med-anat-1', topic: 'Thoracic Wall & Mediastinum', weight: 1.2, questions: buildQuestions('Thoracic Wall & Mediastinum', 'Human Anatomy') },
        { id: 'med-anat-2', topic: 'Coronary Circulation', weight: 1.4, questions: buildQuestions('Coronary Circulation', 'Human Anatomy') },
        { id: 'med-anat-3', topic: 'Brachial Plexus Innervation', weight: 1.1, questions: buildQuestions('Brachial Plexus Innervation', 'Human Anatomy') },
        { id: 'med-anat-4', topic: 'Cranial Nerves & Nuclei', weight: 1.3, questions: buildQuestions('Cranial Nerves & Nuclei', 'Human Anatomy') },
      ],
    },
    {
      id: 'med-physiology',
      profileId: 'medicine',
      name: 'Medical Physiology',
      credits: 10,
      color: '#F472B6',
      quizzes: [
        { id: 'med-phys-1', topic: 'Cardiac Action Potentials', weight: 1.4, questions: buildQuestions('Cardiac Action Potentials', 'Medical Physiology') },
        { id: 'med-phys-2', topic: 'Renal Glomerular Filtration', weight: 1.2, questions: buildQuestions('Renal Glomerular Filtration', 'Medical Physiology') },
        { id: 'med-phys-3', topic: 'Pulmonary Gas Exchange', weight: 1.1, questions: buildQuestions('Pulmonary Gas Exchange', 'Medical Physiology') },
        { id: 'med-phys-4', topic: 'Neuroendocrine Feedback Loops', weight: 1.2, questions: buildQuestions('Neuroendocrine Feedback Loops', 'Medical Physiology') },
      ],
    },
    {
      id: 'med-biochem',
      profileId: 'medicine',
      name: 'Clinical Biochemistry',
      credits: 8,
      color: '#EA580C',
      quizzes: [
        { id: 'med-bio-1', topic: 'Enzyme Kinetics & Inhibition', weight: 1.2, questions: buildQuestions('Enzyme Kinetics & Inhibition', 'Clinical Biochemistry') },
        { id: 'med-bio-2', topic: 'Oxidative Phosphorylation', weight: 1.3, questions: buildQuestions('Oxidative Phosphorylation', 'Clinical Biochemistry') },
        { id: 'med-bio-3', topic: 'Lipoprotein Metabolism', weight: 1.1, questions: buildQuestions('Lipoprotein Metabolism', 'Clinical Biochemistry') },
        { id: 'med-bio-4', topic: 'Acid-Base Buffer Systems', weight: 1.2, questions: buildQuestions('Acid-Base Buffer Systems', 'Clinical Biochemistry') },
      ],
    },
    {
      id: 'med-pathology',
      profileId: 'medicine',
      name: 'General Pathology & Immunology',
      credits: 9,
      color: '#F9A8D4',
      quizzes: [
        { id: 'med-path-1', topic: 'Acute & Chronic Inflammation', weight: 1.3, questions: buildQuestions('Acute & Chronic Inflammation', 'General Pathology') },
        { id: 'med-path-2', topic: 'T-Cell Mediated Immunity', weight: 1.2, questions: buildQuestions('T-Cell Mediated Immunity', 'General Pathology') },
        { id: 'med-path-3', topic: 'Neoplastic Transformation', weight: 1.4, questions: buildQuestions('Neoplastic Transformation', 'General Pathology') },
        { id: 'med-path-4', topic: 'Autoimmune Hypersensitivity', weight: 1.1, questions: buildQuestions('Autoimmune Hypersensitivity', 'General Pathology') },
        { id: 'med-path-5', topic: 'Cellular Apoptosis Pathways', weight: 1.2, questions: buildQuestions('Cellular Apoptosis Pathways', 'General Pathology') },
      ],
    },
    {
      id: 'med-pharma',
      profileId: 'medicine',
      name: 'Clinical Pharmacology',
      credits: 6,
      color: '#0284C7',
      quizzes: [
        { id: 'med-pharm-1', topic: 'Pharmacokinetics & Clearance', weight: 1.3, questions: buildQuestions('Pharmacokinetics & Clearance', 'Clinical Pharmacology') },
        { id: 'med-pharm-2', topic: 'Autonomic Receptor Agonists', weight: 1.2, questions: buildQuestions('Autonomic Receptor Agonists', 'Clinical Pharmacology') },
        { id: 'med-pharm-3', topic: 'Antiarrhythmic Agents', weight: 1.4, questions: buildQuestions('Antiarrhythmic Agents', 'Clinical Pharmacology') },
        { id: 'med-pharm-4', topic: 'Beta-Lactam Antimicrobials', weight: 1.1, questions: buildQuestions('Beta-Lactam Antimicrobials', 'Clinical Pharmacology') },
      ],
    },
    {
      id: 'med-cardio',
      profileId: 'medicine',
      name: 'Cardiovascular Medicine',
      credits: 8,
      color: '#A855F7',
      quizzes: [
        { id: 'med-card-1', topic: 'ECG & Arrhythmia Triage', weight: 1.4, questions: buildQuestions('ECG & Arrhythmia Triage', 'Cardiovascular Medicine') },
        { id: 'med-card-2', topic: 'Acute Coronary Syndromes', weight: 1.5, questions: buildQuestions('Acute Coronary Syndromes', 'Cardiovascular Medicine') },
        { id: 'med-card-3', topic: 'Valvular Heart Hemodynamics', weight: 1.2, questions: buildQuestions('Valvular Heart Hemodynamics', 'Cardiovascular Medicine') },
        { id: 'med-card-4', topic: 'Heart Failure Pharmacotherapy', weight: 1.3, questions: buildQuestions('Heart Failure Pharmacotherapy', 'Cardiovascular Medicine') },
      ],
    },
  ],

  economics: [
    {
      id: 'eco-micro',
      profileId: 'economics',
      name: 'Microeconomics',
      credits: 9,
      color: '#D946EF',
      quizzes: [
        { id: 'eco-mic-1', topic: 'Consumer Utility & Demand', weight: 1.2, questions: buildQuestions('Consumer Utility & Demand', 'Microeconomics') },
        { id: 'eco-mic-2', topic: 'Nash Equilibrium & Game Theory', weight: 1.4, questions: buildQuestions('Nash Equilibrium & Game Theory', 'Microeconomics') },
        { id: 'eco-mic-3', topic: 'Oligopoly & Price Competition', weight: 1.2, questions: buildQuestions('Oligopoly & Price Competition', 'Microeconomics') },
        { id: 'eco-mic-4', topic: 'Asymmetric Information', weight: 1.3, questions: buildQuestions('Asymmetric Information', 'Microeconomics') },
      ],
    },
    {
      id: 'eco-corpfin',
      profileId: 'economics',
      name: 'Corporate Finance',
      credits: 10,
      color: '#F472B6',
      quizzes: [
        { id: 'eco-cf-1', topic: 'DCF Valuation & Free Cash Flow', weight: 1.4, questions: buildQuestions('DCF Valuation & Free Cash Flow', 'Corporate Finance') },
        { id: 'eco-cf-2', topic: 'WACC & Capital Structure', weight: 1.3, questions: buildQuestions('WACC & Capital Structure', 'Corporate Finance') },
        { id: 'eco-cf-3', topic: 'Modigliani-Miller Theorem', weight: 1.2, questions: buildQuestions('Modigliani-Miller Theorem', 'Corporate Finance') },
        { id: 'eco-cf-4', topic: 'Mergers & LBO Mechanics', weight: 1.3, questions: buildQuestions('Mergers & LBO Mechanics', 'Corporate Finance') },
      ],
    },
    {
      id: 'eco-stats',
      profileId: 'economics',
      name: 'Econometrics & Statistics',
      credits: 8,
      color: '#EA580C',
      quizzes: [
        { id: 'eco-st-1', topic: 'OLS Regression & Gauss-Markov', weight: 1.3, questions: buildQuestions('OLS Regression & Gauss-Markov', 'Econometrics') },
        { id: 'eco-st-2', topic: 'Heteroskedasticity & Endogeneity', weight: 1.4, questions: buildQuestions('Heteroskedasticity & Endogeneity', 'Econometrics') },
        { id: 'eco-st-3', topic: 'Instrumental Variables (2SLS)', weight: 1.3, questions: buildQuestions('Instrumental Variables (2SLS)', 'Econometrics') },
        { id: 'eco-st-4', topic: 'ARIMA Time-Series Forecasting', weight: 1.2, questions: buildQuestions('ARIMA Time-Series Forecasting', 'Econometrics') },
      ],
    },
    {
      id: 'eco-macro',
      profileId: 'economics',
      name: 'Macroeconomic Policy',
      credits: 8,
      color: '#F9A8D4',
      quizzes: [
        { id: 'eco-mac-1', topic: 'IS-LM & Monetary Transmission', weight: 1.2, questions: buildQuestions('IS-LM & Monetary Transmission', 'Macroeconomic Policy') },
        { id: 'eco-mac-2', topic: 'Taylor Rule & Central Banking', weight: 1.4, questions: buildQuestions('Taylor Rule & Central Banking', 'Macroeconomic Policy') },
        { id: 'eco-mac-3', topic: 'Sovereign Debt Sustainability', weight: 1.3, questions: buildQuestions('Sovereign Debt Sustainability', 'Macroeconomic Policy') },
        { id: 'eco-mac-4', topic: 'Phillips Curve & Inflation Expectations', weight: 1.2, questions: buildQuestions('Phillips Curve & Inflation Expectations', 'Macroeconomic Policy') },
        { id: 'eco-mac-5', topic: 'Open Economy Exchange Rates', weight: 1.1, questions: buildQuestions('Open Economy Exchange Rates', 'Macroeconomic Policy') },
      ],
    },
    {
      id: 'eco-fintech',
      profileId: 'economics',
      name: 'Financial Markets & Fintech',
      credits: 6,
      color: '#0284C7',
      quizzes: [
        { id: 'eco-fin-1', topic: 'Payment Rails & Clearing', weight: 1.2, questions: buildQuestions('Payment Rails & Clearing', 'Financial Markets & Fintech') },
        { id: 'eco-fin-2', topic: 'Algorithmic Market Making', weight: 1.4, questions: buildQuestions('Algorithmic Market Making', 'Financial Markets & Fintech') },
        { id: 'eco-fin-3', topic: 'Fixed Income Yield Curves', weight: 1.3, questions: buildQuestions('Fixed Income Yield Curves', 'Financial Markets & Fintech') },
        { id: 'eco-fin-4', topic: 'Black-Scholes Option Pricing', weight: 1.4, questions: buildQuestions('Black-Scholes Option Pricing', 'Financial Markets & Fintech') },
      ],
    },
    {
      id: 'eco-strategy',
      profileId: 'economics',
      name: 'Competitive Strategy',
      credits: 6,
      color: '#A855F7',
      quizzes: [
        { id: 'eco-str-1', topic: 'Network Effects & Platforms', weight: 1.3, questions: buildQuestions('Network Effects & Platforms', 'Competitive Strategy') },
        { id: 'eco-str-2', topic: 'Unit Economics & Cohort Retention', weight: 1.2, questions: buildQuestions('Unit Economics & Cohort Retention', 'Competitive Strategy') },
        { id: 'eco-str-3', topic: 'Barriers to Entry & Moats', weight: 1.1, questions: buildQuestions('Barriers to Entry & Moats', 'Competitive Strategy') },
        { id: 'eco-str-4', topic: 'Value Chain Vertical Integration', weight: 1.2, questions: buildQuestions('Value Chain Vertical Integration', 'Competitive Strategy') },
      ],
    },
  ],

  engineering: [
    {
      id: 'ai-ml',
      profileId: 'engineering',
      name: 'Machine Learning',
      credits: 10,
      color: '#D946EF',
      quizzes: [
        { id: 'ai-ml-1', topic: 'Bias-Variance & Regularization', weight: 1.3, questions: buildQuestions('Bias-Variance & Regularization', 'Machine Learning') },
        { id: 'ai-ml-2', topic: 'Support Vector Machines & Kernels', weight: 1.2, questions: buildQuestions('Support Vector Machines & Kernels', 'Machine Learning') },
        { id: 'ai-ml-3', topic: 'Gradient Boosted Decision Trees', weight: 1.3, questions: buildQuestions('Gradient Boosted Decision Trees', 'Machine Learning') },
        { id: 'ai-ml-4', topic: 'Expectation-Maximization & GMMs', weight: 1.4, questions: buildQuestions('Expectation-Maximization & GMMs', 'Machine Learning') },
      ],
    },
    {
      id: 'ai-dl',
      profileId: 'engineering',
      name: 'Deep Learning Architectures',
      credits: 10,
      color: '#F472B6',
      quizzes: [
        { id: 'ai-dl-1', topic: 'Backpropagation & Vanishing Gradients', weight: 1.3, questions: buildQuestions('Backpropagation & Vanishing Gradients', 'Deep Learning') },
        { id: 'ai-dl-2', topic: 'Residual & Convolutional Networks', weight: 1.2, questions: buildQuestions('Residual & Convolutional Networks', 'Deep Learning') },
        { id: 'ai-dl-3', topic: 'Multi-Head Self-Attention', weight: 1.5, questions: buildQuestions('Multi-Head Self-Attention', 'Deep Learning') },
        { id: 'ai-dl-4', topic: 'Diffusion & Score-Based Generative Models', weight: 1.4, questions: buildQuestions('Diffusion & Score-Based Generative Models', 'Deep Learning') },
      ],
    },
    {
      id: 'ai-nlp',
      profileId: 'engineering',
      name: 'Natural Language Processing',
      credits: 8,
      color: '#EA580C',
      quizzes: [
        { id: 'ai-nlp-1', topic: 'Subword Tokenization & Embeddings', weight: 1.1, questions: buildQuestions('Subword Tokenization & Embeddings', 'Natural Language Processing') },
        { id: 'ai-nlp-2', topic: 'Autoregressive Language Modeling', weight: 1.4, questions: buildQuestions('Autoregressive Language Modeling', 'Natural Language Processing') },
        { id: 'ai-nlp-3', topic: 'Retrieval-Augmented Generation (RAG)', weight: 1.3, questions: buildQuestions('Retrieval-Augmented Generation (RAG)', 'Natural Language Processing') },
        { id: 'ai-nlp-4', topic: 'RLHF & Preference Optimization', weight: 1.4, questions: buildQuestions('RLHF & Preference Optimization', 'Natural Language Processing') },
      ],
    },
    {
      id: 'ai-cv',
      profileId: 'engineering',
      name: 'Computer Vision & 3D Perception',
      credits: 8,
      color: '#F9A8D4',
      quizzes: [
        { id: 'ai-cv-1', topic: 'Camera Projective Geometry', weight: 1.2, questions: buildQuestions('Camera Projective Geometry', 'Computer Vision') },
        { id: 'ai-cv-2', topic: 'Semantic & Instance Segmentation', weight: 1.3, questions: buildQuestions('Semantic & Instance Segmentation', 'Computer Vision') },
        { id: 'ai-cv-3', topic: 'Vision Transformers (ViT)', weight: 1.4, questions: buildQuestions('Vision Transformers (ViT)', 'Computer Vision') },
        { id: 'ai-cv-4', topic: 'Neural Radiance Fields & 3D Gaussian Splatting', weight: 1.3, questions: buildQuestions('Neural Radiance Fields & 3D Gaussian Splatting', 'Computer Vision') },
        { id: 'ai-cv-5', topic: 'Optical Flow & Visual Odometry', weight: 1.2, questions: buildQuestions('Optical Flow & Visual Odometry', 'Computer Vision') },
      ],
    },
    {
      id: 'ai-rl',
      profileId: 'engineering',
      name: 'Reinforcement Learning & Control',
      credits: 6,
      color: '#0284C7',
      quizzes: [
        { id: 'ai-rl-1', topic: 'Markov Decision Processes & Bellman Equations', weight: 1.3, questions: buildQuestions('Markov Decision Processes & Bellman Equations', 'Reinforcement Learning') },
        { id: 'ai-rl-2', topic: 'Deep Q-Networks (DQN)', weight: 1.2, questions: buildQuestions('Deep Q-Networks (DQN)', 'Reinforcement Learning') },
        { id: 'ai-rl-3', topic: 'Proximal Policy Optimization (PPO)', weight: 1.4, questions: buildQuestions('Proximal Policy Optimization (PPO)', 'Reinforcement Learning') },
        { id: 'ai-rl-4', topic: 'Model Predictive Control (MPC)', weight: 1.3, questions: buildQuestions('Model Predictive Control (MPC)', 'Reinforcement Learning') },
      ],
    },
    {
      id: 'ai-prob',
      profileId: 'engineering',
      name: 'Statistical Learning & Optimization',
      credits: 6,
      color: '#A855F7',
      quizzes: [
        { id: 'ai-pr-1', topic: 'Convex Optimization & Duality', weight: 1.4, questions: buildQuestions('Convex Optimization & Duality', 'Statistical Learning') },
        { id: 'ai-pr-2', topic: 'Stochastic Gradient Descent Convergence', weight: 1.3, questions: buildQuestions('Stochastic Gradient Descent Convergence', 'Statistical Learning') },
        { id: 'ai-pr-3', topic: 'Bayesian Inference & MCMC', weight: 1.3, questions: buildQuestions('Bayesian Inference & MCMC', 'Statistical Learning') },
        { id: 'ai-pr-4', topic: 'PAC Learning & VC Dimension', weight: 1.2, questions: buildQuestions('PAC Learning & VC Dimension', 'Statistical Learning') },
      ],
    },
  ],
};

export const UPCOMING_EXAMS_BY_PROFILE: Record<ProfileId, ExamStatus[]> = {
  medicine: [
    {
      id: 'exam-med-1',
      profileId: 'medicine',
      courseName: 'Cardiovascular Medicine',
      color: '#A855F7',
      date: 'Nov 21',
      room: 'Aula Magna, Bldg 3B',
      status: 'Booked',
    },
    {
      id: 'exam-med-2',
      profileId: 'medicine',
      courseName: 'General Pathology & Immunology',
      color: '#F9A8D4',
      date: 'Nov 28',
      room: 'Sector 2A, Lab 4',
      status: 'Unavailable',
    },
    {
      id: 'exam-med-3',
      profileId: 'medicine',
      courseName: 'Human Anatomy',
      color: '#D946EF',
      date: 'Dec 12',
      room: 'Anatomy Hall 1C',
      status: 'Booked',
    },
  ],
  economics: [
    {
      id: 'exam-eco-1',
      profileId: 'economics',
      courseName: 'Competitive Strategy',
      color: '#A855F7',
      date: 'Nov 21',
      room: 'Room 304, Velodromo',
      status: 'Booked',
    },
    {
      id: 'exam-eco-2',
      profileId: 'economics',
      courseName: 'Macroeconomic Policy',
      color: '#F9A8D4',
      date: 'Nov 28',
      room: 'Aula N02, Roentgen',
      status: 'Unavailable',
    },
    {
      id: 'exam-eco-3',
      profileId: 'economics',
      courseName: 'Corporate Finance',
      color: '#F472B6',
      date: 'Dec 14',
      room: 'Room 101, Grafton',
      status: 'Booked',
    },
  ],
  engineering: [
    {
      id: 'exam-ai-1',
      profileId: 'engineering',
      courseName: 'Statistical Learning & Optimization',
      color: '#A855F7',
      date: 'Nov 21',
      room: '3D, 5D, LAIB1',
      status: 'Booked',
    },
    {
      id: 'exam-ai-2',
      profileId: 'engineering',
      courseName: 'Computer Vision & 3D Perception',
      color: '#F9A8D4',
      date: 'Nov 28',
      room: '2I, 4M, LAIB3',
      status: 'Unavailable',
    },
    {
      id: 'exam-ai-3',
      profileId: 'engineering',
      courseName: 'Machine Learning',
      color: '#D946EF',
      date: 'Dec 11',
      room: 'Aula 1A, Main Hall',
      status: 'Booked',
    },
  ],
};

// Seed quiz history so every course has an initial non-empty AI score, while leaving some quizzes pending (for the red badge)
export const INITIAL_QUIZ_ATTEMPTS: QuizAttemptRecord[] = [
  // Medicine
  { quizId: 'med-anat-1', correctCount: 3, totalCount: 4, timestamp: 100 },
  { quizId: 'med-anat-2', correctCount: 2, totalCount: 4, timestamp: 200 },
  { quizId: 'med-anat-3', correctCount: 3, totalCount: 4, timestamp: 300 },
  // med-anat-4 pending -> 1 badge

  { quizId: 'med-phys-1', correctCount: 4, totalCount: 4, timestamp: 100 },
  { quizId: 'med-phys-2', correctCount: 3, totalCount: 4, timestamp: 200 },
  { quizId: 'med-phys-3', correctCount: 3, totalCount: 4, timestamp: 300 },
  { quizId: 'med-phys-4', correctCount: 4, totalCount: 4, timestamp: 400 },

  { quizId: 'med-bio-1', correctCount: 2, totalCount: 4, timestamp: 100 },
  { quizId: 'med-bio-2', correctCount: 3, totalCount: 4, timestamp: 200 },
  { quizId: 'med-bio-3', correctCount: 2, totalCount: 4, timestamp: 300 },
  { quizId: 'med-bio-4', correctCount: 3, totalCount: 4, timestamp: 400 },

  { quizId: 'med-path-1', correctCount: 3, totalCount: 4, timestamp: 100 },
  { quizId: 'med-path-2', correctCount: 2, totalCount: 4, timestamp: 200 },
  { quizId: 'med-path-3', correctCount: 2, totalCount: 4, timestamp: 300 },
  // med-path-4, med-path-5 pending -> 2 badge

  { quizId: 'med-pharm-1', correctCount: 1, totalCount: 4, timestamp: 100 },
  { quizId: 'med-pharm-2', correctCount: 2, totalCount: 4, timestamp: 200 },
  { quizId: 'med-pharm-3', correctCount: 1, totalCount: 4, timestamp: 300 },
  { quizId: 'med-pharm-4', correctCount: 2, totalCount: 4, timestamp: 400 },

  { quizId: 'med-card-1', correctCount: 4, totalCount: 4, timestamp: 100 },
  { quizId: 'med-card-2', correctCount: 3, totalCount: 4, timestamp: 200 },
  { quizId: 'med-card-3', correctCount: 3, totalCount: 4, timestamp: 300 },
  { quizId: 'med-card-4', correctCount: 4, totalCount: 4, timestamp: 400 },

  // Economics
  { quizId: 'eco-mic-1', correctCount: 3, totalCount: 4, timestamp: 100 },
  { quizId: 'eco-mic-2', correctCount: 2, totalCount: 4, timestamp: 200 },
  { quizId: 'eco-mic-3', correctCount: 3, totalCount: 4, timestamp: 300 },
  // eco-mic-4 pending -> 1 badge

  { quizId: 'eco-cf-1', correctCount: 4, totalCount: 4, timestamp: 100 },
  { quizId: 'eco-cf-2', correctCount: 3, totalCount: 4, timestamp: 200 },
  { quizId: 'eco-cf-3', correctCount: 4, totalCount: 4, timestamp: 300 },
  { quizId: 'eco-cf-4', correctCount: 3, totalCount: 4, timestamp: 400 },

  { quizId: 'eco-st-1', correctCount: 3, totalCount: 4, timestamp: 100 },
  { quizId: 'eco-st-2', correctCount: 2, totalCount: 4, timestamp: 200 },
  { quizId: 'eco-st-3', correctCount: 2, totalCount: 4, timestamp: 300 },
  { quizId: 'eco-st-4', correctCount: 3, totalCount: 4, timestamp: 400 },

  { quizId: 'eco-mac-1', correctCount: 3, totalCount: 4, timestamp: 100 },
  { quizId: 'eco-mac-2', correctCount: 2, totalCount: 4, timestamp: 200 },
  { quizId: 'eco-mac-3', correctCount: 2, totalCount: 4, timestamp: 300 },
  // eco-mac-4, eco-mac-5 pending -> 2 badge

  { quizId: 'eco-fin-1', correctCount: 2, totalCount: 4, timestamp: 100 },
  { quizId: 'eco-fin-2', correctCount: 1, totalCount: 4, timestamp: 200 },
  { quizId: 'eco-fin-3', correctCount: 2, totalCount: 4, timestamp: 300 },
  { quizId: 'eco-fin-4', correctCount: 1, totalCount: 4, timestamp: 400 },

  { quizId: 'eco-str-1', correctCount: 3, totalCount: 4, timestamp: 100 },
  { quizId: 'eco-str-2', correctCount: 4, totalCount: 4, timestamp: 200 },
  { quizId: 'eco-str-3', correctCount: 3, totalCount: 4, timestamp: 300 },
  { quizId: 'eco-str-4', correctCount: 3, totalCount: 4, timestamp: 400 },

  // AI (engineering)
  { quizId: 'ai-ml-1', correctCount: 3, totalCount: 4, timestamp: 100 },
  { quizId: 'ai-ml-2', correctCount: 2, totalCount: 4, timestamp: 200 },
  { quizId: 'ai-ml-3', correctCount: 3, totalCount: 4, timestamp: 300 },
  // ai-ml-4 pending -> 1 badge

  { quizId: 'ai-dl-1', correctCount: 4, totalCount: 4, timestamp: 100 },
  { quizId: 'ai-dl-2', correctCount: 3, totalCount: 4, timestamp: 200 },
  { quizId: 'ai-dl-3', correctCount: 4, totalCount: 4, timestamp: 300 },
  { quizId: 'ai-dl-4', correctCount: 3, totalCount: 4, timestamp: 400 },

  { quizId: 'ai-nlp-1', correctCount: 3, totalCount: 4, timestamp: 100 },
  { quizId: 'ai-nlp-2', correctCount: 2, totalCount: 4, timestamp: 200 },
  { quizId: 'ai-nlp-3', correctCount: 2, totalCount: 4, timestamp: 300 },
  { quizId: 'ai-nlp-4', correctCount: 3, totalCount: 4, timestamp: 400 },

  { quizId: 'ai-cv-1', correctCount: 3, totalCount: 4, timestamp: 100 },
  { quizId: 'ai-cv-2', correctCount: 2, totalCount: 4, timestamp: 200 },
  { quizId: 'ai-cv-3', correctCount: 2, totalCount: 4, timestamp: 300 },
  // ai-cv-4, ai-cv-5 pending -> 2 badge

  { quizId: 'ai-rl-1', correctCount: 1, totalCount: 4, timestamp: 100 },
  { quizId: 'ai-rl-2', correctCount: 2, totalCount: 4, timestamp: 200 },
  { quizId: 'ai-rl-3', correctCount: 1, totalCount: 4, timestamp: 300 },
  { quizId: 'ai-rl-4', correctCount: 2, totalCount: 4, timestamp: 400 },

  { quizId: 'ai-pr-1', correctCount: 3, totalCount: 4, timestamp: 100 },
  { quizId: 'ai-pr-2', correctCount: 4, totalCount: 4, timestamp: 200 },
  { quizId: 'ai-pr-3', correctCount: 3, totalCount: 4, timestamp: 300 },
  { quizId: 'ai-pr-4', correctCount: 3, totalCount: 4, timestamp: 400 },
];
