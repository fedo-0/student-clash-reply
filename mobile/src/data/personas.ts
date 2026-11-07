import { type SFSymbol } from 'expo-symbols';

import { type ProfileId } from './profiles';

export interface PersonaExchange {
  /** What the persona says first / as a follow-up question. */
  personaPrompt: string;
  /** The simulated spoken response from the student when the mic button is tapped. */
  studentReply: string;
}

export interface PersonaFeedback {
  overallScore: string;
  headline: string;
  strengths: string[];
  improvements: string[];
}

export interface PersonaScenario {
  id: string;
  profileId: ProfileId;
  name: string;
  initials: string;
  avatarSymbol: SFSymbol;
  accentColor: string;
  role: string;
  scenarioTitle: string;
  contextTag: string;
  exchanges: PersonaExchange[];
  closingLine: string;
  feedback: PersonaFeedback;
}

export const PERSONAS_BY_PROFILE: Record<ProfileId, PersonaScenario[]> = {
  medicine: [
    {
      id: 'med-persona-1',
      profileId: 'medicine',
      name: 'Roberto Galli, 58',
      initials: 'RG',
      avatarSymbol: 'heart.text.square.fill',
      accentColor: '#EF4444',
      role: 'Outpatient describing acute chest tightness and exertional dyspnea',
      scenarioTitle: 'Cardiology Triage · Chest Pain',
      contextTag: 'Patient Case · Cardiology',
      exchanges: [
        {
          personaPrompt:
            'Doctor, since yesterday morning I get this heavy pressure right in the center of my chest whenever I walk up the stairs. It eases off if I sit down for five minutes, but it scared me. What do you need to know first?',
          studentReply:
            'Mr. Galli, does the pressure radiate to your left arm, neck, or jaw, and have you noticed any sweating, nausea, or shortness of breath with it?',
        },
        {
          personaPrompt:
            'Yes, my left shoulder feels dull and achy when it happens, and I felt slightly clammy this morning. I also take ramipril for high blood pressure and smoked for twenty years. What could be going on?',
          studentReply:
            'Given your hypertension, smoking history, and exertional chest pressure radiating to the shoulder, we need to rule out unstable angina or an acute coronary syndrome right away.',
        },
        {
          personaPrompt:
            'That sounds serious. What tests are you going to run right now, and what should we do while waiting for the results?',
          studentReply:
            'We will obtain a 12-lead ECG within 10 minutes, draw high-sensitivity cardiac troponins and a basic metabolic panel, place you on continuous monitoring, and give chewable aspirin if there are no contraindications.',
        },
      ],
      closingLine:
        'Thank you, Doctor. Knowing the exact steps and why we are doing the ECG and troponin test right away makes me feel much safer.',
      feedback: {
        overallScore: '29/30',
        headline: 'Structured clinical history & rapid ACS triage',
        strengths: [
          'Immediately screened for radiation and autonomic symptoms (diaphoresis, dyspnea).',
          'Connected cardiovascular risk factors (hypertension, smoking) to acute coronary syndrome.',
          'Ordered 12-lead ECG and high-sensitivity troponins in guideline-recommended order.',
        ],
        improvements: [
          'Ask about prior episodes or nitrate use earlier in the history.',
          'Briefly screen for aortic dissection red flags (tearing back pain) before aspirin administration.',
        ],
      },
    },
    {
      id: 'med-persona-2',
      profileId: 'medicine',
      name: 'Chiara Moretti, 29',
      initials: 'CM',
      avatarSymbol: 'waveform.path.ecg',
      accentColor: '#EC4899',
      role: 'Young patient with recurrent palpitations, tremor, and unexplained weight loss',
      scenarioTitle: 'Endocrine & Arrhythmia Consult',
      contextTag: 'Patient Case · Internal Medicine',
      exchanges: [
        {
          personaPrompt:
            'Hi Doctor. For the past month my heart races out of nowhere, even when I am sitting at my desk. I have also lost four kilos without trying and my hands won’t stop shaking. Why is this happening?',
          studentReply:
            'Have you also noticed heat intolerance, trouble sleeping, changes in bowel habits, or any swelling in the front of your neck?',
        },
        {
          personaPrompt:
            'Now that you mention it, I am always hot while everyone else in the office wears a sweater, and my eyes have felt dry and gritty. What condition are you suspecting?',
          studentReply:
            'Your racing heart, weight loss despite normal appetite, fine tremor, heat intolerance, and eye symptoms strongly point toward hyperthyroidism—most likely Graves’ disease.',
        },
        {
          personaPrompt:
            'How can we confirm if it is Graves’ disease, and is there anything that can calm my racing heart in the meantime?',
          studentReply:
            'We will check serum TSH, free T4, free T3, and TSH-receptor antibodies, plus an ECG to check for sinus tachycardia or atrial fibrillation. A beta-blocker like propranolol can quickly control your heart rate and tremor.',
        },
      ],
      closingLine:
        'That connects everything I have been feeling over the past month. Let’s go ahead with the blood work and ECG.',
      feedback: {
        overallScore: '30/30',
        headline: 'Excellent endocrine synthesis & symptomatic management',
        strengths: [
          'Recognized the classic thyrotoxicosis triad and probed for Graves’ ophthalmopathy.',
          'Ordered targeted thyroid panel (TSH, FT4/FT3, TRAb) alongside rhythm evaluation.',
          'Proposed immediate beta-blockade for adrenergic symptom relief.',
        ],
        improvements: [
          'Mention discussing antithyroid thionamides (methimazole) once labs confirm the diagnosis.',
        ],
      },
    },
    {
      id: 'med-persona-3',
      profileId: 'medicine',
      name: 'Lorenzo Bellini, 71',
      initials: 'LB',
      avatarSymbol: 'lungs.fill',
      accentColor: '#0EA5E9',
      role: 'Retired teacher with worsening ankle swelling and nighttime breathlessness',
      scenarioTitle: 'Heart Failure Decompensation',
      contextTag: 'Patient Case · Ward Round',
      exchanges: [
        {
          personaPrompt:
            'Good morning. Over the last week I have had to prop myself up on three pillows just to breathe at night, and my ankles are so swollen I can barely put my shoes on. What is going on with me?',
          studentReply:
            'Mr. Bellini, waking up short of breath and needing extra pillows—called orthopnea—together with bilateral ankle edema suggests fluid overload from heart failure. Have you gained weight recently or missed any medications?',
        },
        {
          personaPrompt:
            'I gained about three kilos this week, and I stopped taking my water pill because it made me rush to the bathroom whenever I went out. How do you check how bad the fluid buildup is?',
          studentReply:
            'We will listen to your lungs for crackles, check your jugular venous pressure, measure NT-proBNP and renal function with electrolytes, and perform a chest X-ray and echocardiogram.',
        },
        {
          personaPrompt:
            'And how will we get this fluid off safely without hurting my kidneys?',
          studentReply:
            'We will restart loop diuretics like furosemide while closely tracking your daily weight, urine output, potassium, and creatinine, and adjust your dosing schedule so it is manageable at home.',
        },
      ],
      closingLine:
        'Adjusting the timing of the diuretic so I can still go out in the morning would help me stick to it. Thank you.',
      feedback: {
        overallScore: '28/30',
        headline: 'Empathetic adherence counseling & congestion workup',
        strengths: [
          'Identified orthopnea and peripheral edema and uncovered medication non-adherence.',
          'Combined physical exam signs (JVP, pulmonary rales) with NT-proBNP and imaging.',
          'Addressed practical lifestyle barriers to loop diuretic adherence.',
        ],
        improvements: [
          'Discuss sodium/fluid restriction targets and guideline-directed pillars (SGLT2i, ARNI) before discharge.',
        ],
      },
    },
  ],
  economics: [
    {
      id: 'eco-persona-1',
      profileId: 'economics',
      name: 'Valeria Riva',
      initials: 'VR',
      avatarSymbol: 'storefront.fill',
      accentColor: '#10B981',
      role: 'Founder of a 12-store specialty coffee chain facing margin compression',
      scenarioTitle: 'Unit Economics & Pricing Case',
      contextTag: 'Business Owner · Retail Strategy',
      exchanges: [
        {
          personaPrompt:
            'Our revenue across our 12 Milan cafés grew 18% this year, but our EBITDA margin dropped from 14% to 6% after green coffee bean prices and commercial rents spiked. Should I raise menu prices across the board by 15%?',
          studentReply:
            'Before a flat 15% hike, we should segment your products by price elasticity: habit-driven espresso shots are highly price-sensitive in Italy, whereas specialty drinks and pastries have much higher pricing power.',
        },
        {
          personaPrompt:
            'That is true—if I raise espresso from €1.30 to €1.50, commuters will walk next door. Where else can we recover margin without losing morning foot traffic?',
          studentReply:
            'Keep standard espresso as a traffic anchor, introduce tiered pricing on specialty oat/matcha drinks and breakfast bundles to lift average order value, and renegotiate supplier volume contracts across all 12 stores.',
        },
        {
          personaPrompt:
            'I am also considering opening 3 new stores next quarter to spread our central roastery overhead. How should I evaluate if that makes financial sense right now?',
          studentReply:
            'Pause expansion until store-level contribution margin stabilizes, then rank each candidate location by payback period, net present value (NPV), and return on invested capital against your cost of debt.',
        },
      ],
      closingLine:
        'Using espresso as the anchor while bundling breakfast and fixing store-level unit economics before expanding gives me a clear roadmap.',
      feedback: {
        overallScore: '29/30',
        headline: 'Sharp price-elasticity segmentation & capital discipline',
        strengths: [
          'Avoided a blanket price hike by distinguishing elastic anchor items from inelastic add-ons.',
          'Proposed concrete average-order-value (AOV) levers and procurement consolidation.',
          'Prioritized store-level unit economics and NPV/payback hurdles over premature expansion.',
        ],
        improvements: [
          'Quantify the break-even volume loss threshold for a 5–10% specialty drink price increase.',
        ],
      },
    },
    {
      id: 'eco-persona-2',
      profileId: 'economics',
      name: 'Matteo Sartori',
      initials: 'MS',
      avatarSymbol: 'chart.line.uptrend.xyaxis',
      accentColor: '#3B82F6',
      role: 'CEO of a B2B SaaS invoicing platform preparing for a Series A round',
      scenarioTitle: 'SaaS Valuation & Churn Case',
      contextTag: 'Business Owner · Corporate Finance',
      exchanges: [
        {
          personaPrompt:
            'We are at €2.4M ARR growing 60% year-over-year, and we want to raise €5M in Series A funding. However, our monthly SMB customer churn just crept up to 3.2%. What will investors scrutinize first?',
          studentReply:
            'A 3.2% monthly churn compounds to over 32% annual logo churn, so investors will immediately examine your Net Dollar Retention (NDR), LTV-to-CAC ratio, and CAC payback period by customer cohort.',
        },
        {
          personaPrompt:
            'Our LTV-to-CAC dropped from 4.1x to 2.3x because paid ads got expensive and smaller freelancers cancel after tax season. How should we restructure our go-to-market before pitching?',
          studentReply:
            'Shift acquisition toward mid-market firms with multi-seat annual contracts, incentivize upfront annual billing to lock in retention, and embed accounting integrations that increase switching costs.',
        },
        {
          personaPrompt:
            'If we reduce burn to extend our runway from 11 to 20 months while fixing retention, how does that affect our valuation negotiation?',
          studentReply:
            'Extending runway above 18 months while lifting Net Dollar Retention over 100% removes financing distress, improves your Rule-of-40 profile, and gives you leverage to command a stronger ARR multiple.',
        },
      ],
      closingLine:
        'Focusing on annual contracts and net retention before going to market will put us in a much stronger position with VCs.',
      feedback: {
        overallScore: '30/30',
        headline: 'Investor-grade SaaS metrics & cohort strategy',
        strengths: [
          'Immediately annualized the 3.2% monthly churn to highlight cohort decay.',
          'Linked LTV/CAC deterioration to customer mix and proposed annual contract migration.',
          'Connected runway extension and Rule-of-40 metrics directly to valuation leverage.',
        ],
        improvements: [
          'Suggest gross-margin-adjusted CAC payback (<12–15 months) as an operational target.',
        ],
      },
    },
    {
      id: 'eco-persona-3',
      profileId: 'economics',
      name: 'Davide Colombo',
      initials: 'DC',
      avatarSymbol: 'shippingbox.fill',
      accentColor: '#F59E0B',
      role: 'Managing Director of an Italian machinery exporter hit by FX & working-capital strain',
      scenarioTitle: 'Treasury & Working Capital Case',
      contextTag: 'Business Owner · International Finance',
      exchanges: [
        {
          personaPrompt:
            'Forty percent of our precision machinery sales are in US dollars, while all our manufacturing costs in Bergamo are in euros. Last quarter EUR/USD swings wiped out half our net profit. How do we stop gambling on currency moves?',
          studentReply:
            'You should implement a systematic FX hedging policy using forward contracts or zero-cost collars matched to your confirmed USD order backlog, locking in your target euro gross margin.',
        },
        {
          personaPrompt:
            'Beyond currency risk, our US buyers take 90 days to pay while our steel suppliers demand payment in 30 days, leaving our cash line tapped out. How can we fix our cash conversion cycle?',
          studentReply:
            'Your 60-day working-capital gap can be bridged through non-recourse export factoring or supply-chain finance, milestone deposits on custom machinery orders, and early-payment discounts.',
        },
        {
          personaPrompt:
            'With interest rates still elevated, how do I decide whether export factoring is worth the fee?',
          studentReply:
            'Compare the annualized factoring discount against your weighted average cost of capital (WACC) and overdraft rate, factoring in the credit-default protection and freed-up borrowing capacity.',
        },
      ],
      closingLine:
        'Matching forward hedges to our order book and using milestone deposits plus export factoring solves both the FX and cash-flow squeeze.',
      feedback: {
        overallScore: '29/30',
        headline: 'Strong FX risk management & cash-conversion analysis',
        strengths: [
          'Matched FX forward/collar hedging directly to contracted USD receivables.',
          'Diagnosed the DSO vs. DPO mismatch driving the cash conversion cycle bottleneck.',
          'Evaluated factoring costs against WACC and credit-risk transfer.',
        ],
        improvements: [
          'Mention natural hedging options such as sourcing select components in USD.',
        ],
      },
    },
  ],
  engineering: [
    {
      id: 'eng-persona-1',
      profileId: 'engineering',
      name: 'Ing. Giulia Fontana',
      initials: 'GF',
      avatarSymbol: 'cpu.fill',
      accentColor: '#8B5CF6',
      role: 'VP of Quality at an automotive supplier needing real-time weld defect detection',
      scenarioTitle: 'Edge Computer Vision Brief',
      contextTag: 'Client Brief · Industrial AI',
      exchanges: [
        {
          personaPrompt:
            'We inspect 180 aluminum battery trays per hour on our assembly line. We need a vision system that flags micro-cracks in laser welds in under 25 milliseconds with zero cloud connectivity. What architecture do you propose?',
          studentReply:
            'For sub-25ms on-premise inference without cloud access, we should deploy a quantized single-stage detector or segmentation model—such as YOLOv8-nano or RT-DETR compiled to TensorRT INT8—on an industrial NVIDIA Jetson Orin edge module.',
        },
        {
          personaPrompt:
            'Here is the catch: defective welds happen in less than 0.3% of parts, so we only have 120 defect images compared to 40,000 clean ones. How will you prevent the model from missing rare cracks?',
          studentReply:
            'We can combine patch-based unsupervised anomaly detection (like PatchCore on normal welds) with focal loss, synthetic defect augmentation, and calibrated decision thresholds tuned for high recall so no defective tray slips through.',
        },
        {
          personaPrompt:
            'When lighting shifts or a new alloy batch arrives, operators hate false alarms stopping the line. How will we maintain reliability in production?',
          studentReply:
            'Use controlled coaxial LED strobe illumination to stabilize imaging, route uncertain borderline predictions to a fast human-in-the-loop review screen, and log operator confirmations for active-learning model updates.',
        },
      ],
      closingLine:
        'Combining TensorRT edge inference with anomaly detection and an active-learning review loop fits our factory constraints perfectly.',
      feedback: {
        overallScore: '30/30',
        headline: 'Production-ready edge AI & class-imbalance design',
        strengths: [
          'Selected hardware-accelerated INT8 TensorRT inference to meet the strict <25ms offline SLA.',
          'Addressed the 0.3% defect imbalance with anomaly detection, focal loss, and recall-first calibration.',
          'Included optical lighting control and human-in-the-loop drift mitigation.',
        ],
        improvements: [
          'Specify evaluation metrics such as AUROC / PR-AUC and false-escape rate per 10,000 parts.',
        ],
      },
    },
    {
      id: 'eng-persona-2',
      profileId: 'engineering',
      name: 'Dr. Luca Bernardi',
      initials: 'LB',
      avatarSymbol: 'doc.text.magnifyingglass',
      accentColor: '#06B6D4',
      role: 'Chief Legal Officer asking for a private RAG assistant over 250k regulatory PDFs',
      scenarioTitle: 'Enterprise RAG & Hallucination Brief',
      contextTag: 'Client Brief · NLP & GenAI',
      exchanges: [
        {
          personaPrompt:
            'Our compliance lawyers waste hours searching 250,000 European banking regulations and internal policy PDFs. We want an AI assistant, but a single hallucinated clause or leaked document is unacceptable. How do you architect this?',
          studentReply:
            'We should build a permission-aware Retrieval-Augmented Generation (RAG) pipeline hosted in your private VPC, enforcing document-level access control before retrieval and requiring inline clause citations for every generated claim.',
        },
        {
          personaPrompt:
            'Dense vector search alone keeps missing exact article numbers like "Article 114(2)" or cross-references across tables. How do we make retrieval accurate on legal text?',
          studentReply:
            'Use structure-aware chunking that preserves section hierarchy and tables, combine sparse BM25 lexical search with dense embeddings via hybrid search, and apply a cross-encoder reranker before passing top passages to the LLM.',
        },
        {
          personaPrompt:
            'How will we prove to our risk committee that the system isn’t fabricating answers before we roll it out to 300 lawyers?',
          studentReply:
            'Build a golden evaluation benchmark verified by senior counsel, measure context recall and groundedness/faithfulness on every release, and configure the model to abstain whenever retrieval confidence falls below threshold.',
        },
      ],
      closingLine:
        'Hybrid BM25-plus-vector retrieval with strict citation grounding and an abstention threshold is exactly what our risk committee needs to see.',
      feedback: {
        overallScore: '29/30',
        headline: 'Rigorous hybrid RAG & compliance guardrails',
        strengths: [
          'Combined hierarchical legal chunking, hybrid BM25 + dense search, and cross-encoder reranking.',
          'Enforced pre-retrieval ACL filtering and mandatory inline citations.',
          'Proposed quantitative faithfulness evaluation and explicit abstention on low confidence.',
        ],
        improvements: [
          'Discuss handling superseded regulations via temporal metadata filtering.',
        ],
      },
    },
    {
      id: 'eng-persona-3',
      profileId: 'engineering',
      name: 'Marco Pellegrini',
      initials: 'MP',
      avatarSymbol: 'antenna.radiowaves.left.and.right',
      accentColor: '#F97316',
      role: 'Head of Fleet Operations needing autonomous warehouse AMR navigation in dynamic aisles',
      scenarioTitle: 'Warehouse Robotics & Sensor Fusion',
      contextTag: 'Client Brief · Autonomous Systems',
      exchanges: [
        {
          personaPrompt:
            'Our 40 autonomous mobile robots keep freezing whenever forklifts and pallet jacks change the layout of our fulfillment center. Pure 2D LiDAR SLAM loses localization in long, repetitive aisles. How would you redesign perception and localization?',
          studentReply:
            'We should fuse 3D LiDAR, wheel odometry, IMU, and visual-inertial semantic landmarks in an Extended Kalman Filter or factor-graph SLAM pipeline so the robot stays localized even when pallet geometry changes.',
        },
        {
          personaPrompt:
            'When a human worker steps out from behind a rack, the robot needs to replan smoothly instead of slamming the emergency brakes every time. How do we handle dynamic obstacle avoidance?',
          studentReply:
            'Combine real-time 3D human tracking and trajectory prediction with a Model Predictive Control (MPC) local planner and ISO-compliant safety zones that smoothly scale velocity based on proximity.',
        },
        {
          personaPrompt:
            'How can we test edge cases—like occluded pedestrians or wet warehouse floors—before deploying software updates to all 40 robots?',
          studentReply:
            'Validate every release in a physics-accurate digital twin simulation with synthetic corner cases, replay recorded ROS2 bag logs in CI, and roll out via canary deployment to two robots first.',
        },
      ],
      closingLine:
        'Factor-graph sensor fusion paired with MPC local planning and ROS2 bag regression testing gives us a safe path to production.',
      feedback: {
        overallScore: '29/30',
        headline: 'Solid multi-sensor fusion & safety-critical validation',
        strengths: [
          'Solved repetitive-aisle drift by fusing LiDAR, IMU, wheel odometry, and visual landmarks.',
          'Paired pedestrian trajectory prediction with smooth MPC local trajectory planning.',
          'Outlined a safe sim-to-real and ROS2 bag regression pipeline before fleet rollout.',
        ],
        improvements: [
          'Mention fleet-level traffic coordination to prevent deadlocks at narrow aisle intersections.',
        ],
      },
    },
  ],
};

export function getPersonaById(id: string): PersonaScenario | undefined {
  for (const list of Object.values(PERSONAS_BY_PROFILE)) {
    const found = list.find((item) => item.id === id);
    if (found) return found;
  }
  return undefined;
}
