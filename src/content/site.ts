// Every fact and every line of copy on the site lives here.
// Sources: Career/Resume.md and Career/CV.md (both 2026-11-04), the "About" text in
// Career/LinkedIn_Profile_Content.md, and what Dylan said on 2026-11-12.
// Do not add a credential, date, employer, honour or number that is not in those sources.

export const identity = {
  name: 'Dylan Wollet',
  discipline: 'Mechanical engineering',
  school: 'FAMU-FSU College of Engineering',
  location: 'Tallahassee, FL',
  graduation: 'May 2028',
  gpa: 3.833,
  gpaScale: '4.0',
  url: 'https://dylanwollet.netlify.app',
  email: 'dfw24@fsu.edu',
  linkedin: 'https://www.linkedin.com/in/dylan-wollet-104938308/',
  resume: '/Dylan_Wollet_Resume.pdf',
  seeking: 'Seeking a Summer 2027 engineering internship in marine or space.',
  title: 'Dylan Wollet | Mechanical engineering',
  description:
    'Third-year mechanical engineering student at the FAMU-FSU College of Engineering, seeking a Summer 2027 engineering internship in marine or space.',
};

export const hero = {
  statement:
    'I want to build the hardware that finds things out: ocean systems, spacecraft, and the instruments that bring the data back.',
  context: 'Third-year mechanical engineering student at the FAMU-FSU College of Engineering.',
  hint: 'Scroll to dive',
  proof: [
    { href: '#work', figure: 'Porter to manager', text: 'Started parking cars in 2024. Now Digital Marketing Manager, leading a four-system data integration.' },
    { href: '#truss', figure: '20.7 N', text: 'Predicted where a truss would fail by hand, then loaded it until it broke there.' },
    { href: '#stirling', figure: 'Raw stock', text: 'Machined the critical parts of a Stirling engine on manual mills and lathes.' },
    { href: '#dog', figure: '$241.09', text: 'Took a design from four concepts to a closed bill of materials, inside budget and weight.' },
  ],
};

export const work = {
  altitude: 0,
  heading: 'I started as a porter. Now I own the dealership’s digital operations.',
  lede: [
    'I started at Tallahassee Ford parking cars and taking out the trash. I’m now the store’s Digital Marketing Manager, filling the Digital Marketer position Ford requires every dealership to staff.',
    'I run our event program end to end, and I built the software our departments run on by directing AI coding agents. Nobody assigned me the first one. I built it because the problem bothered me.',
  ],
  employer: 'Tallahassee Ford',
  employerDates: 'Jul 2024 to present',
  roles: [
    {
      title: 'Porter', dates: 'Jul 2024 to Aug 2026',
      text: 'Picked up the work that fell through the cracks between service and sales. Kept the drive and lot functional so techs could find and move vehicles, and ran customer test drives and deliveries.',
    },
    {
      title: 'Service Assistant', dates: 'Aug 2026 to Oct 2026',
      text: 'Used AI coding agents to build and deploy four internal tools the dealership runs on, shipped a 23-screen display to the service lounge, and ran the dealership’s presence at community events.',
    },
    {
      title: 'Digital Marketing Manager', dates: 'Oct 2026 to present', current: true,
      text: 'Fills Ford’s designated Digital Marketer position, with mandatory Ford FMC Dealer system access and a required manufacturer training track. Owns customer-facing digital operations and leads the Fullpath rollout.',
    },
  ],
  stats: [
    { value: 4, label: 'source systems in the integration' },
    { value: 4, label: 'internal tools built and in daily use' },
    { value: 23, label: 'screens in the service lounge display' },
    { value: 3000, label: 'attendees at the Tallahassee Beer Festival', comma: true },
    { value: 100, label: 'sales contacts collected there', suffix: '+' },
  ],
  integration: {
    heading: 'A data integration that sits under a marketing title',
    text: 'I’m leading the rollout of Fullpath, a customer data platform that consolidates the dealership’s first-party data into single, unified customer profiles. To do it I’m learning four Cox Automotive systems and how each one’s records key to the others across the integration.',
    target: 'Fullpath',
    targetNote: 'One unified profile per customer',
    systems: [
      { id: 'vin', name: 'VinSolutions', role: 'CRM' },
      { id: 'xtime', name: 'Xtime', role: 'Service scheduling' },
      { id: 'dms', name: 'Dealertrack', role: 'DMS' },
      { id: 'vauto', name: 'vAuto', role: 'Inventory and market pricing' },
    ],
    records: ['Customer', 'Lead', 'Sold', 'Service and appointment', 'Inventory', 'Web analytics'],
    recordsNote: 'Record types being mapped and migrated across system boundaries.',
  },
  built: {
    heading: 'Software the dealership runs on, built by directing AI coding agents',
    items: [
      { name: 'Staff scheduling board', text: 'For the Service and Parts departments.' },
      { name: 'Event operations hub', text: 'In daily use. 734 unit tests, with CI on every change.' },
      { name: 'Service-to-sales lead board', text: 'In daily use.' },
      { name: '23-screen lounge display', text: 'Shipped to the customer service lounge. I wrote its customer-facing content.' },
    ],
  },
  marketing: {
    heading: 'Marketing, events and the public side',
    text: 'I manage the community event program end to end: vendor communication and relationships, event-day logistics, crew assignments, display vehicles and branded supplies, plus running the on-site team.',
    events: [
      { name: 'Tallahassee Beer Festival', text: '3,000 attendees. Three booth locations, staged vehicles, a team of five, and a giveaway that collected 100+ sales contacts. I ran it while still working as a porter.' },
      { name: 'St. Marks Brewfest and the CollegeTown block party', text: 'Ran Ford’s presence at both.' },
      { name: 'Taste in the Garden', text: 'Coordinated shuttle service with 10+ vehicles. The dealership was both a presenting participant and the shuttle sponsor.' },
    ],
    ongoing: 'Day to day I own the public event calendar, inbound customer messaging, the lounge display and the dealership’s internal tooling.',
  },
  brand: {
    heading: '1926 Beverage Company',
    dates: 'Oct 2026 to present',
    href: 'https://the1926company.com',
    hrefLabel: 'the1926company.com',
    text: 'I designed, built with AI coding agents, and launched the live brand site for a Tallahassee beverage company, including its can design system and an account locator that shows where the drinks are sold.',
    items: [
      'Redrew the logo as vector artwork for print and packaging.',
      'Set the brand voice and the advertising and brand compliance rules its materials follow.',
      'Built the launch prospect list used to open accounts.',
      'Manage the company’s Facebook and Instagram.',
    ],
  },
  earlier: [
    {
      org: 'McKinney Electric', role: 'Electrical Helper', dates: 'Summer 2026',
      text: 'Assisted the lead electrician on residential and commercial calls, from a retail buildout at the Tallahassee Mall to a shipping container converted to a gym. Ran wire, installed outlets and switches, and helped rig the breaker panel on the container conversion.',
    },
    {
      org: 'Good Shepherd Church', role: 'Audio/Visual Technician, independent contractor', dates: 'Mar 2020 to May 2026',
      text: 'Ran the live production system single-handed for weekly services, weddings, funerals and graduations: live band and speakers on a Yamaha TF5, ProPresenter, and a Datavideo HS-1300 livestream chain. Trained several new operators to run the board on their own.',
    },
  ],
};

export const truss = {
  altitude: -18,
  title: 'Cantilever truss: analysis and load test',
  heading: 'Predict the failure. Then break it.',
  meta: 'Engineering Statics, Fall 2025, team of three',
  status: 'Built and tested',
  facts: [
    'Designed a 29 cm Howe-configuration truss with two teammates, using the method of joints by hand to predict member forces and flag the critical member before testing.',
    'Loaded it to failure at 20.7 N. It broke at the predicted node. Back-calculated a single-member tensile strength of about 82.8 N.',
  ],
  readouts: [
    { value: 29, decimals: 0, unit: 'cm', label: 'span' },
    { value: 20.7, decimals: 1, unit: 'N', label: 'load at failure' },
    { value: 82.8, decimals: 1, unit: 'N', label: 'member strength, approx.' },
  ],
  tool: {
    name: 'Method-of-joints solver',
    intro: 'Configure a cantilever truss and load it. Every member force is solved live from joint equilibrium.',
    model: 'Model: pin-jointed, statically determinate, loads at joints. Buckling is not modeled, so tension and compression are checked against the same strength.',
    honesty: 'The starting values reproduce the two numbers from the real test, a 20.7 N load and about 82.8 N in the critical member. The geometry is yours to change and is not a record of the truss I built.',
    defaults: { spanCm: 29, depthCm: 7.25, panels: 4, diagonals: 'howe' as const, load: 12, strength: 82.8 },
    testedLoad: 20.7,
  },
};

export const stirling = {
  altitude: -40,
  title: 'Stirling engine build',
  heading: 'Drawn from a print. Cut from raw stock.',
  meta: 'Mechanical Engineering Tools Lab, Summer 2025',
  status: 'Built',
  facts: [
    'Modeled a multi-component Stirling engine in SolidWorks from ANSI part drawings.',
    'Machined the critical parts from raw stock on manual mills and lathes, to drawing tolerance.',
  ],
  tool: {
    name: 'Stirling cycle',
    intro: 'Spin the flywheel. Change the temperatures and the phase angle and watch the pressure–volume loop respond.',
    model: 'Model: ideal Schmidt analysis of a gamma-type engine. Isothermal hot and cold spaces, perfect regeneration, sinusoidal motion. Real engines fall well short of this limit.',
    honesty: 'The proportions and temperatures are generic. They are not measurements of the engine I machined, and the flywheel speed is only for show.',
  },
};

export const dog = {
  altitude: -75,
  title: 'Dog mobility assist device',
  heading: 'Four concepts, one decision matrix, a budget that closed.',
  meta: 'Mechanical Engineering Tools Lab, Summer 2025',
  status: 'Designed in CAD. Not built or tested.',
  facts: [
    'Generated four concepts for a mobility assist for a 75-lb arthritic dog and selected the winner with a weighted decision matrix.',
    'Specified materials against weatherproofing and load requirements and modeled the hitch-mounted assembly in SolidWorks.',
    'Closed the bill of materials at $241.09 and 28.81 lb, inside the budget and portability constraints.',
  ],
  readouts: [
    { value: 241.09, decimals: 2, prefix: '$', unit: '', label: 'bill of materials' },
    { value: 28.81, decimals: 2, unit: 'lb', label: 'assembly weight' },
    { value: 75, decimals: 0, unit: 'lb', label: 'design load: the dog' },
  ],
  tool: {
    name: 'Sizing to a requirement',
    intro: 'Pick a material for each part. The tool sizes its section to carry a 75-lb load within a deflection limit, then totals mass and stock cost against your limits.',
    model: 'Model: solid rectangular sections in bending (Euler–Bernoulli), sized for whichever governs, stiffness or yield with a safety factor. Material properties are handbook values. Unit costs are rough stock prices, for comparison only.',
    honesty: 'The three parts and their dimensions are a simplified stand-in, not the assembly I designed. The real totals are the project numbers above.',
  },
};

export const rov = {
  altitude: -120,
  title: 'Tethered underwater ROV',
  heading: 'The one I haven’t built yet.',
  meta: 'Independent project, Sep 2026 to present',
  status: 'Concept stage. Nothing is built.',
  facts: [
    'An early concept for a small tethered underwater vehicle to log depth, temperature, heading and video in a Florida sinkhole.',
    'Under consideration: brushless thrusters, an acrylic pressure housing with O-ring seals, a Raspberry Pi controller and an Ethernet tether, on a $500 budget.',
  ],
  tool: {
    name: 'First-pass concept study',
    intro: 'Take the housing down. Set the tube, the trim and the speed, and see which limit you hit first.',
    model: 'Model: hydrostatic pressure in fresh water; hoop stress and long-tube elastic buckling of a thin acrylic cylinder; a simply supported flat end cap; Archimedes for trim; quadratic drag on an assumed 500 cm² frontal area with a drag coefficient of 1.0. Hand-calculation formulas only.',
    honesty: 'This is a sizing exercise, not a validated design. There are no drawings, no hardware and no test data yet. The inputs are yours.',
  },
};

export const life = {
  altitude: 0,
  heading: 'Off the clock',
  lede: 'No two weeks are the same. The job follows me to campus and home, and plenty of it happens at strange hours. I’ve kept training through all of it.',
  lifting: {
    title: 'Lifting',
    text: 'I train by progressive overload: add reps until I reach the top of the range, then add weight and start again. I wanted an app that computed the next target instead of only recording the last set, so I directed Claude Code through five written specs to build one.',
    app: { name: 'Overload', href: 'https://overloadylan.netlify.app/', note: '603 passing tests. One user: me.' },
    demoNote: 'Example numbers. Tap to log the set.',
  },
  running: {
    title: 'Running',
    text: 'Half marathon done. The full marathon is February 7, 2027.',
    raceDate: [2027, 1, 7] as const, // year, zero-based month, day
    raceLabel: 'February 7, 2027',
    miles: 26.2188,
  },
  music: {
    title: 'Music',
    text: 'All of it, not one genre. I also spent six years running live sound: a band and speakers on a Yamaha TF5, every week.',
    hint: 'Play the bars',
  },
  outdoors: {
    title: 'Outdoors',
    text: 'Given the choice, I’m outside.',
  },
  travel: {
    title: 'Travel',
    text: 'The ocean, other cultures, and everything past the atmosphere: three directions I’ve wanted to go look at for as long as I can remember. I want to see a lot more of all three.',
    hint: 'Drag to turn',
  },
};

export const record = {
  altitude: 30000,
  heading: 'The record',
  education: {
    school: 'FAMU-FSU College of Engineering, Florida State University',
    degree: 'B.S. Mechanical Engineering, expected May 2028',
    gpa: 'GPA 3.833 / 4.0',
    honors: ['President’s List, Spring 2026', 'Dean’s List, Fall 2024 and Spring 2025'],
    completed: 'Engineering Statics; Dynamics; Mechanics of Materials; Engineering Thermodynamics; Materials Science for Engineers; Mechanical Engineering Tools Lab; Ordinary Differential Equations; Calculus I–III; Calculus-Based Physics I–II; Applied Statistics for Engineers and Scientists; Programming I (C++)',
    inProgress: 'Fall 2026, in progress: Mechanical Systems 1; Intermediate Mechanics of Materials and its laboratory; Engineering Design Methods',
  },
  research: {
    title: 'Research extern (high school externship)',
    dates: 'Aug 2023 to Apr 2024',
    text: 'A Florida State University laboratory in the Department of Nutrition and Integrative Physiology that studies cardiac and metabolic function. Completed BSL-2 laboratory safety training before bench work, then ran centrifuge separations, performed cell counts and did basic data analysis on the results.',
  },
  certifications: [
    { name: 'Expedite, Skills for Industry: Industry Foundations', by: 'Siemens Digital Industries Software', when: 'Oct 2026' },
    { name: 'Expedite, Skills for Industry: EDA Explained', by: 'Siemens Software', when: '2026' },
    { name: 'Ford STARS (now Ford University)', by: 'Ford Motor Company', when: 'In progress, 2026' },
  ],
  skills: [
    { name: 'Shop, fabrication and field', items: ['Manual mill and lathe', 'Machining to drawing tolerances', 'Precision measurement', 'Hand and power tools', 'Automotive maintenance', 'Residential wiring'] },
    { name: 'Testing and measurement', items: ['Destructive load testing', 'Multi-trial data collection', 'Validating models against experimental results', 'Multimeter'] },
    { name: 'CAD and analysis', items: ['SolidWorks', 'Reading ANSI drawings and working from prints', 'BOM and cost analysis', 'MATLAB', 'Statics and dynamics', 'Mechanics of materials', 'Hand analysis by the method of joints'] },
    { name: 'AI-directed software and systems', items: ['AI-assisted development', 'Claude Code (agentic coding)', 'Spec-driven development', 'Test and CI gates', 'AI review agents', 'Web application development', 'Process automation', 'Excel data analysis', 'C++', 'Multi-system data integration', 'Fullpath CDP', 'VinSolutions', 'Xtime', 'Dealertrack', 'vAuto'] },
  ],
};

export const contact = {
  altitude: 400000,
  heading: 'Marine or space. Summer 2027.',
  text: 'What I want is uncomplicated: work that moves science forward, in a career worth having. If you build things that go into the ocean or leave the atmosphere, I’d like to help.',
  links: [
    { label: 'LinkedIn', href: identity.linkedin },
    { label: 'Resume (PDF)', href: identity.resume },
  ],
  colophon: 'Built with Astro and TypeScript. Every simulation on this page runs unit-tested code in your browser. No photos, no trackers.',
};

export const sections = [
  { id: 'top', altitude: 0 },
  { id: 'work', altitude: work.altitude },
  { id: 'truss', altitude: truss.altitude },
  { id: 'stirling', altitude: stirling.altitude },
  { id: 'dog', altitude: dog.altitude },
  { id: 'rov', altitude: rov.altitude },
  { id: 'life', altitude: life.altitude },
  { id: 'record', altitude: record.altitude },
  { id: 'contact', altitude: contact.altitude },
] as const;

export const nav = [
  { href: '#work', label: 'Work' },
  { href: '#truss', label: 'Engineering' },
  { href: '#life', label: 'Life' },
  { href: '#contact', label: 'Contact' },
];
