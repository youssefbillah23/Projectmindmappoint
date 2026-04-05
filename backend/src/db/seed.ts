import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo123456', 12);
  const user = await prisma.user.upsert({
    where: { email: 'demo@pulsepoint.app' },
    update: {},
    create: {
      email: 'demo@pulsepoint.app',
      password: hashedPassword,
      name: 'Demo User',
      timezone: 'America/New_York',
      briefingTime: '07:00',
    },
  });

  console.log(`Created demo user: ${user.email}`);

  // Seed saved items across mock platforms
  const savedItems = [
    {
      platform: 'LINKEDIN' as const,
      externalId: 'li-001',
      contentType: 'article',
      title: 'The Future of AI in Enterprise Software',
      body: 'Artificial intelligence is rapidly transforming how enterprises build and deploy software. From automated code generation to intelligent testing frameworks, AI is becoming an integral part of the software development lifecycle. Companies that embrace these tools early are seeing 40% improvements in developer productivity. The key challenge remains integrating AI workflows without disrupting existing processes. Leaders recommend starting with low-risk automation tasks and gradually expanding AI involvement as teams build confidence and expertise.',
      url: 'https://example.com/ai-enterprise',
      topicTags: ['AI', 'Tech', 'Business'],
      summaryShort: 'AI is transforming enterprise software development with 40% productivity gains. Companies should start with low-risk automation and gradually expand.',
      summaryLong: 'Artificial intelligence is rapidly transforming how enterprises build and deploy software. From automated code generation to intelligent testing frameworks, AI is becoming integral to the SDLC. Companies embracing these tools early see 40% improvements in developer productivity. The key challenge is integrating AI workflows without disrupting existing processes. Leaders recommend starting with low-risk automation tasks and gradually expanding AI involvement as teams build confidence.',
    },
    {
      platform: 'TWITTER' as const,
      externalId: 'tw-001',
      contentType: 'tweet',
      title: 'Thread: 10 Marketing Trends for 2026',
      body: 'Here are the 10 marketing trends dominating 2026: 1) AI-generated personalized content at scale 2) Voice search optimization becomes mandatory 3) Short-form video surpasses all other content types 4) Zero-party data strategies replace third-party cookies 5) Community-led growth replaces traditional funnels 6) Augmented reality shopping experiences 7) Sustainability messaging drives purchase decisions 8) Micro-influencer partnerships outperform celebrity endorsements 9) Conversational commerce via AI chatbots 10) Real-time content adaptation based on user behavior.',
      url: 'https://example.com/marketing-trends',
      topicTags: ['Marketing', 'Business'],
      summaryShort: '10 marketing trends for 2026 include AI-generated content, voice search optimization, short-form video dominance, and community-led growth strategies.',
      summaryLong: 'The top marketing trends for 2026 center around AI personalization, voice search, short-form video, zero-party data, community-led growth, AR shopping, sustainability messaging, micro-influencer partnerships, conversational commerce, and real-time content adaptation. Marketers need to adapt quickly to remain competitive.',
    },
    {
      platform: 'INSTAGRAM' as const,
      externalId: 'ig-001',
      contentType: 'post',
      title: 'Design Systems That Scale',
      body: 'Building a design system that scales across teams requires discipline, documentation, and constant iteration. The best design systems are not just component libraries — they are living documents that encode design decisions, accessibility standards, and brand guidelines. Start with atomic components, build up to molecules and organisms, and establish clear governance for when and how components evolve.',
      url: 'https://example.com/design-systems',
      topicTags: ['Design', 'Tech'],
      summaryShort: 'Scalable design systems require discipline, documentation, and iteration. They should encode design decisions, accessibility standards, and brand guidelines.',
      summaryLong: 'Building a design system that scales across teams requires discipline, documentation, and constant iteration. The best design systems go beyond component libraries — they are living documents encoding design decisions, accessibility standards, and brand guidelines. The recommended approach: start with atomic components, build up to molecules and organisms, and establish clear governance.',
    },
    {
      platform: 'LINKEDIN' as const,
      externalId: 'li-002',
      contentType: 'article',
      title: 'How to Build a Personal Brand on LinkedIn in 2026',
      body: 'Personal branding on LinkedIn has evolved significantly. The algorithm now favors authentic storytelling over corporate jargon. To build a strong personal brand: 1) Post consistently 3-5 times per week 2) Share personal stories with professional lessons 3) Engage genuinely with others content 4) Use a mix of text posts, carousels, and short video 5) Build a content pillar strategy around 2-3 core topics. The key metric is not follower count but engagement rate and inbound opportunities.',
      url: 'https://example.com/linkedin-branding',
      topicTags: ['Marketing', 'Business'],
      summaryShort: 'LinkedIn personal branding in 2026 favors authentic storytelling. Post 3-5x weekly, mix formats, and focus on engagement rate over follower count.',
      summaryLong: 'Personal branding on LinkedIn has evolved with the algorithm favoring authentic storytelling. Key strategies include posting 3-5 times weekly, sharing personal stories with professional lessons, engaging genuinely, using mixed formats, and building content pillars around 2-3 core topics. Success is measured by engagement rate and inbound opportunities, not follower count.',
    },
    {
      platform: 'TWITTER' as const,
      externalId: 'tw-002',
      contentType: 'tweet',
      title: 'The State of Venture Capital Q1 2026',
      body: 'VC funding in Q1 2026 reached $87B globally, a 23% increase YoY. AI/ML companies captured 42% of all deals. Notable trends: seed-stage valuations stabilized after 2024 correction, growth-stage companies face increased scrutiny on unit economics, and climate tech emerged as the second-largest category after AI. The median Series A is now $15M at a $75M pre-money valuation.',
      url: 'https://example.com/vc-state',
      topicTags: ['Finance', 'Business', 'Tech'],
      summaryShort: 'Q1 2026 VC funding hit $87B globally (+23% YoY). AI captured 42% of deals. Climate tech is the second-largest category after AI.',
      summaryLong: 'Global VC funding reached $87B in Q1 2026, up 23% year-over-year. AI/ML companies captured 42% of all deals. Seed-stage valuations stabilized post-2024 correction, while growth-stage companies face increased unit economics scrutiny. Climate tech emerged as the second-largest category. The median Series A is $15M at $75M pre-money valuation.',
    },
    {
      platform: 'INSTAGRAM' as const,
      externalId: 'ig-002',
      contentType: 'post',
      title: 'Morning Routines of Top CEOs',
      body: 'Studied the morning routines of 50 Fortune 500 CEOs. Common patterns: 78% wake before 5:30 AM, 65% exercise first thing, 82% avoid checking email for the first hour, 71% practice some form of mindfulness or meditation, 90% eat a protein-rich breakfast. The most consistent finding: successful leaders protect their first 90 minutes for strategic thinking, not reactive tasks.',
      url: 'https://example.com/ceo-routines',
      topicTags: ['Business', 'Health'],
      summaryShort: 'Study of 50 Fortune 500 CEOs shows 78% wake before 5:30 AM, 82% avoid email for the first hour, and most protect 90 minutes for strategic thinking.',
      summaryLong: 'A study of 50 Fortune 500 CEOs reveals common morning patterns: 78% wake before 5:30 AM, 65% exercise first thing, 82% avoid checking email for the first hour, 71% practice mindfulness, and 90% eat protein-rich breakfasts. The most consistent finding is that successful leaders protect their first 90 minutes for strategic thinking over reactive tasks.',
    },
    {
      platform: 'LINKEDIN' as const,
      externalId: 'li-003',
      contentType: 'article',
      title: 'Remote Work Productivity: New Data from 10,000 Companies',
      body: 'A comprehensive study of 10,000 companies across 40 countries reveals that hybrid work models (3 days office, 2 days remote) show the highest productivity metrics. Fully remote teams excelled in deep work tasks but struggled with innovation and spontaneous collaboration. Companies with structured async communication protocols saw 35% higher output regardless of work model. The study concludes that the work model matters less than communication infrastructure.',
      url: 'https://example.com/remote-work-data',
      topicTags: ['Business', 'Tech'],
      summaryShort: 'Study of 10,000 companies shows hybrid work (3/2 split) has highest productivity. Communication infrastructure matters more than work model choice.',
      summaryLong: 'A comprehensive study across 10,000 companies in 40 countries shows hybrid work models (3 office/2 remote days) achieve highest productivity. Fully remote teams excel at deep work but struggle with innovation. Companies with structured async communication protocols saw 35% higher output regardless of model. The conclusion: communication infrastructure matters more than the work model itself.',
    },
    {
      platform: 'TWITTER' as const,
      externalId: 'tw-003',
      contentType: 'tweet',
      title: 'GPT-5 Impact on Developer Workflows',
      body: 'After 3 months of using GPT-5 in production development workflows, here are the real numbers: Code review time reduced by 60%, bug detection rate improved by 45%, documentation generation went from hours to minutes, but — and this is critical — architectural decision-making still requires senior human judgment. The tool is a force multiplier, not a replacement. Teams that try to use it as a replacement see quality degradation within weeks.',
      url: 'https://example.com/gpt5-dev',
      topicTags: ['AI', 'Tech'],
      summaryShort: 'GPT-5 in production dev workflows: 60% faster code reviews, 45% better bug detection. But architectural decisions still need senior human judgment.',
      summaryLong: 'Three months of GPT-5 in production development shows impressive results: 60% reduction in code review time, 45% improvement in bug detection, and documentation generation dropping from hours to minutes. However, architectural decision-making still requires senior human judgment. Teams using AI as a replacement rather than a force multiplier see quality degradation within weeks.',
    },
    {
      platform: 'LINKEDIN' as const,
      externalId: 'li-004',
      contentType: 'article',
      title: 'The Rise of Fractional C-Suite Executives',
      body: 'The fractional executive model is reshaping how startups access senior leadership. In 2026, 34% of startups with $1-10M revenue employ at least one fractional C-suite executive. The most common roles: fractional CFO (45%), fractional CMO (32%), and fractional CTO (23%). Benefits include reduced burn rate (60-70% cost savings vs full-time), access to seasoned expertise, and flexibility. The model works best when the fractional exec has clear KPIs and a structured engagement cadence.',
      url: 'https://example.com/fractional-execs',
      topicTags: ['Business', 'Finance'],
      summaryShort: '34% of startups ($1-10M revenue) now use fractional C-suite execs. Most common: CFO (45%), CMO (32%), CTO (23%), saving 60-70% vs full-time hires.',
      summaryLong: 'The fractional executive model is reshaping startup leadership. In 2026, 34% of startups with $1-10M revenue employ at least one fractional C-suite executive. Most common roles are fractional CFO (45%), CMO (32%), and CTO (23%). Benefits include 60-70% cost savings, access to seasoned expertise, and flexibility. Success requires clear KPIs and structured engagement cadences.',
    },
    {
      platform: 'INSTAGRAM' as const,
      externalId: 'ig-003',
      contentType: 'post',
      title: 'Science-Backed Focus Techniques',
      body: 'Neuroscience research on focus and attention has yielded practical techniques anyone can use: The Pomodoro Technique (25 min work, 5 min break) remains effective but can be optimized to 52/17 splits based on individual chronotype. Binaural beats at 40Hz gamma frequency have been shown to improve concentration by 12%. Strategic caffeine timing (delay first cup 90 min after waking) maximizes alertness. Cold exposure (cold shower or face splash) triggers norepinephrine release, sharpening focus for 2-3 hours.',
      url: 'https://example.com/focus-techniques',
      topicTags: ['Health', 'Science'],
      summaryShort: 'Science-backed focus techniques: optimized Pomodoro (52/17 splits), 40Hz binaural beats (+12% concentration), delayed caffeine, and cold exposure for norepinephrine release.',
      summaryLong: 'Neuroscience research offers practical focus techniques: The Pomodoro Technique can be optimized to 52/17 splits based on chronotype. Binaural beats at 40Hz improve concentration by 12%. Delaying caffeine 90 minutes after waking maximizes alertness. Cold exposure triggers norepinephrine release, sharpening focus for 2-3 hours. These evidence-based approaches help anyone improve their deep work capacity.',
    },
  ];

  for (const item of savedItems) {
    await prisma.savedItem.upsert({
      where: {
        userId_externalId: {
          userId: user.id,
          externalId: item.externalId,
        },
      },
      update: {},
      create: {
        userId: user.id,
        platform: item.platform,
        externalId: item.externalId,
        contentType: item.contentType,
        title: item.title,
        body: item.body,
        url: item.url,
        topicTags: item.topicTags,
        summaryShort: item.summaryShort,
        summaryLong: item.summaryLong,
        savedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        syncedAt: new Date(),
      },
    });
  }

  console.log(`Seeded ${savedItems.length} saved items`);

  // Seed interest graph
  const interests = [
    { topic: 'AI', score: 85, interactionCount: 24 },
    { topic: 'Tech', score: 78, interactionCount: 20 },
    { topic: 'Business', score: 72, interactionCount: 18 },
    { topic: 'Marketing', score: 65, interactionCount: 14 },
    { topic: 'Finance', score: 55, interactionCount: 10 },
    { topic: 'Design', score: 48, interactionCount: 8 },
    { topic: 'Health', score: 42, interactionCount: 7 },
    { topic: 'Science', score: 35, interactionCount: 5 },
  ];

  for (const interest of interests) {
    await prisma.interestGraph.upsert({
      where: {
        userId_topic: {
          userId: user.id,
          topic: interest.topic,
        },
      },
      update: {},
      create: {
        userId: user.id,
        topic: interest.topic,
        score: interest.score,
        interactionCount: interest.interactionCount,
        lastUpdated: new Date(),
      },
    });
  }

  console.log(`Seeded ${interests.length} interest topics`);

  // Create a demo briefing
  const briefing = await prisma.briefing.create({
    data: {
      userId: user.id,
      date: new Date(),
      status: 'READY',
    },
  });

  const briefingStories = [
    {
      title: 'AI Reshapes Enterprise Development',
      summaryShort: 'AI tools are delivering 40% productivity gains for development teams. The key is gradual integration starting with low-risk automation.',
      summaryLong: 'Artificial intelligence is rapidly transforming enterprise software development. Companies adopting AI-powered code generation, automated testing, and intelligent debugging tools report up to 40% improvements in developer productivity. Industry leaders recommend a phased approach: begin with low-risk automation tasks like code formatting and basic test generation, then gradually expand to more complex workflows. The most successful teams treat AI as a pair programming partner rather than a replacement, maintaining human oversight for architectural decisions while leveraging AI for repetitive tasks.',
      sourceUrl: 'https://example.com/ai-enterprise',
      topicTag: 'AI',
      relevanceScore: 0.95,
      position: 0,
    },
    {
      title: 'Marketing Trends Reshaping 2026',
      summaryShort: 'AI-generated personalized content and community-led growth are the dominant marketing strategies. Short-form video continues to outperform all other formats.',
      summaryLong: 'The marketing landscape in 2026 is defined by AI-powered personalization at scale, the death of third-party cookies driving zero-party data strategies, and the absolute dominance of short-form video content. Community-led growth has replaced traditional marketing funnels, with brands investing heavily in building engaged communities rather than buying attention. Micro-influencer partnerships consistently outperform celebrity endorsements, delivering 3-5x higher engagement rates at a fraction of the cost. Conversational commerce via AI chatbots is growing at 45% annually.',
      sourceUrl: 'https://example.com/marketing-trends',
      topicTag: 'Marketing',
      relevanceScore: 0.88,
      position: 1,
    },
    {
      title: 'VC Funding Surges in Q1 2026',
      summaryShort: 'Global VC funding hit $87B in Q1 2026, up 23% year-over-year. AI companies captured 42% of all deals, with climate tech as the second-largest category.',
      summaryLong: 'Venture capital funding rebounded strongly in Q1 2026, reaching $87 billion globally — a 23% increase year-over-year. AI and machine learning companies captured a remarkable 42% of all deals, reflecting continued investor enthusiasm for the technology. Climate tech emerged as the second-largest category, signaling a structural shift in VC allocation. Seed-stage valuations have stabilized after the 2024 correction, while growth-stage companies face increased scrutiny on unit economics and path to profitability. The median Series A round stands at $15M on a $75M pre-money valuation.',
      sourceUrl: 'https://example.com/vc-state',
      topicTag: 'Finance',
      relevanceScore: 0.82,
      position: 2,
    },
    {
      title: 'GPT-5 in Real Development Teams',
      summaryShort: 'Teams using GPT-5 see 60% faster code reviews and 45% better bug detection, but architectural decisions still require senior human judgment.',
      summaryLong: 'After three months of real-world usage in production development environments, GPT-5 has proven to be a significant force multiplier for engineering teams. Code review times have been reduced by 60%, bug detection rates improved by 45%, and documentation that previously took hours can now be generated in minutes. However, the data also shows a critical limitation: teams that attempt to use GPT-5 as a replacement for senior engineering judgment — particularly in architectural decision-making — experience measurable quality degradation within weeks. The consensus among engineering leaders is clear: AI augments expertise but cannot replace it.',
      sourceUrl: 'https://example.com/gpt5-dev',
      topicTag: 'AI',
      relevanceScore: 0.91,
      position: 3,
    },
    {
      title: 'Hybrid Work Wins the Productivity Battle',
      summaryShort: 'A study of 10,000 companies shows hybrid work (3 office/2 remote) delivers the highest productivity. Communication infrastructure matters more than the model.',
      summaryLong: 'A landmark study spanning 10,000 companies across 40 countries has produced definitive data on the remote work debate. Hybrid work models with a 3-day office and 2-day remote split consistently showed the highest productivity metrics. Fully remote teams excelled at deep work and individual contribution tasks but struggled with innovation, creative collaboration, and onboarding new team members. The most surprising finding: companies with structured asynchronous communication protocols saw 35% higher output regardless of their chosen work model. The researchers conclude that communication infrastructure is more important than physical presence policies.',
      sourceUrl: 'https://example.com/remote-work-data',
      topicTag: 'Business',
      relevanceScore: 0.79,
      position: 4,
    },
  ];

  for (const story of briefingStories) {
    await prisma.briefingStory.create({
      data: {
        briefingId: briefing.id,
        ...story,
      },
    });
  }

  console.log(`Seeded briefing with ${briefingStories.length} stories`);

  // Add some library items
  const allSavedItems = await prisma.savedItem.findMany({
    where: { userId: user.id },
    take: 3,
  });

  for (const item of allSavedItems) {
    await prisma.libraryItem.create({
      data: {
        userId: user.id,
        savedItemId: item.id,
        tags: item.topicTags,
      },
    });
  }

  console.log('Seeded library items');
  console.log('Database seeding complete!');
  console.log('Demo credentials: demo@pulsepoint.app / demo123456');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
