export type BlogBodyNode =
  | { kind: "p"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "h3"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "callout"; tone: "note" | "tip"; text: string };

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  publishedAt: string;
  updatedAt?: string;
  author: string;
  tags: string[];
  excerpt: string;
  body: BlogBodyNode[];
  faq: Array<{ q: string; a: string }>;
}

const gentleCheckinQuestionsPost: BlogPost = {
  slug: "gentle-daily-check-in-questions-for-seniors-living-alone",
  title:
    "12 Gentle Daily Check-In Questions for Seniors Living Alone (That Don't Make Them Feel Babied)",
  description:
    "Caregiver-tested daily check-in questions aging parents will actually enjoy answering. No more 'are you okay?' — try these 12 warm, dignity-first SMS conversation openers instead.",
  keywords: [
    "daily check in questions for seniors",
    "how to check in on elderly parents living alone",
    "elderly check in text messages",
    "checking in on aging parents daily",
    "respectful things to ask senior parents each morning",
  ],
  publishedAt: "2026-08-08T00:00:00.000Z",
  updatedAt: "2026-08-08T00:00:00.000Z",
  author: "Warm-Hello Editorial",
  tags: ["Caregiving", "Daily Check-Ins", "Family Communication", "Seniors Living Alone"],
  excerpt:
    "Stop asking 'are you okay?' and leaving your parent feeling patronized. These 12 dignity-first SMS check-in questions get real answers without making seniors feel like children. Includes 3 special frames for the first week after a move to living alone.",
  body: [
    {
      kind: "h2",
      text: "Why 'Are you okay?' stops working after the first week",
    },
    {
      kind: "p",
      text:
        "Most adult children default to a short text every morning: 'Are you okay?' Then they wonder why replies go from 'Yes love you' after week one to a single thumbs-up emoji or radio silence a month later. The problem isn't your parent being stubborn — it's that 'are you okay?' frames every conversation around their potential decline, which feels like being checked on like a medication schedule rather than like a family member who still has things to say.",
    },
    {
      kind: "p",
      text:
        "The best daily check-in questions for aging parents living alone do two things at once: they quietly surface safety signals (did they get up? eat? leave the house?) AND give your parent a chance to talk about something they actually find interesting. A good question feels like a conversation opener from a caring child, not a nurse's checklist.",
    },
    {
      kind: "h2",
      text: "The 12 questions caregivers swear by (rotate 2-3 each day)",
    },
    {
      kind: "p",
      text:
        "Do NOT send all 12 in one text. Pick 2 maximum per morning check-in. Rotate them so the pattern doesn't feel like a form. If you're using Warm-Hello, these map beautifully to the daily question prompt — drop one in and the replies roll into the family dashboard automatically.",
    },
    {
      kind: "ol",
      items: [
        "What's the first thing you heard or saw this morning that made you smile?",
        "What's one small thing on today's list you're actually looking forward to?",
        "Who did you speak to yesterday, even for five minutes?",
        "Did anything surprise you — good or silly — in the last 24 hours?",
        "What's something from the fridge you're planning to turn into lunch today?",
        "Outside your window this morning — sky was blue, grey, or 'something else'?",
        "Show us one thing you can see from where you're sitting right now.",
        "Is there a song you've been humming lately? (First line counts!)",
        "What do you want saved for dinner tonight if we drop something off?",
        "Walk us through the morning in one sentence — from wake-up until right now.",
        "What's one errand we can run for you this week that would save a trip?",
        "If we had 15 minutes on the phone this evening, what should we definitely cover?",
      ],
    },
    {
      kind: "h2",
      text: "Why these specific 12 work better than generic 'how are you'",
    },
    {
      kind: "ul",
      items: [
        "They assume competence, not risk. Questions like 'what did you have for lunch' are framed as curiosity, not a medication audit.",
        "Red flags show up as silence or change in pattern, not explicit admission. If Mom always answered #5 with a recipe and suddenly says 'nothing much', you call her — no need to turn every text into an intervention.",
        "They leave room for pride. Your dad can brag about fixing the gutter or beating the grocery line instead of describing a symptom list.",
        "They reward effort. A kid sibling can reply to 'show us one thing from where you're sitting' with a photo of the grandkids, making it multi-generational, not just a caregiver chore.",
      ],
    },
    {
      kind: "callout",
      tone: "tip",
      text:
        "Pro tip: On weekends, swap the morning check-in for a video call one. Seeing a face turns the daily message into a ritual, not a task. Keep the 12 questions handy in the notes app under your parent's name so you never default back to 'you okay?' on busy mornings.",
    },
    {
      kind: "h2",
      text: "3 special question frames for after a move or a hospital discharge",
    },
    {
      kind: "p",
      text:
        "The first two weeks after a change (moving in alone, spouse loss, post-op return home) are when check-ins matter most and when parents most resent feeling 'handled'. Skip all the 'how are you holding up' and use one of these daily instead:",
    },
    {
      kind: "ol",
      items: [
        "What's one tiny thing this new place/routine does better than the old one?",
        "What do you wish someone had told you the first day of this new normal?",
        "What's something we could bring over next time that's missing and small?",
      ],
    },
    {
      kind: "h2",
      text: "When a short reply IS a red flag (and when it isn't)",
    },
    {
      kind: "p",
      text:
        "Every short answer isn't a crisis. Some days your parent is watching a show, out walking, or just doesn't feel like typing 4 sentences. The rule of thumb caregivers use: ONE short reply is fine. TWO short replies back to back? Check in with a quick call. THREE? Drive by or get a neighbor to knock. That's when Warm-Hello's escalation-after-two-misses pattern kicks in automatically — you set how many unanswered days before the family gets an email, and nobody has to remember to check again.",
    },
    {
      kind: "h2",
      text: "Putting it all together: your 30-second daily ritual",
    },
    {
      kind: "p",
      text:
        "At 7:30 or 8:00 a.m. local time, send a 2-question check-in SMS. By 9:30, most replies are in. Reply to the CONTENT of the answer, not just 'glad you're okay'. If dad mentions he's going to the hardware store, text back at noon: 'What did you end up making with that 2x4?' — that's how you build a habit of real communication on top of the safety layer. Safety and warmth, not one or the other. That's the whole point.",
    },
  ],
  faq: [
    {
      q: "What time of day should I send a daily check-in text to my elderly parent?",
      a:
        "Between 7:30 and 9:30 a.m. local time, after breakfast but before doctor appointments or senior center visits. Avoid evenings — that's when fatigue and loneliness can make even neutral questions feel like monitoring.",
    },
    {
      q: "My parent never texts back. Should I switch to phone calls only?",
      a:
        "No — not yet. Some non-texter parents actually prefer knowing the check-in is there even if they don't reply; the unanswered counter gives them a safety net if they do fall. After 2 silent days, call. Warm-Hello automates that nudge so you never have to remember.",
    },
    {
      q: "How long should a daily check-in text be?",
      a:
        "One sentence, maximum two. Anything longer feels like work on their end. The goal is a 5-second reply, not an essay. Save the long stories for a weekly call.",
    },
    {
      q: "What do I do if my parent feels the daily texts are 'policing' them?",
      a:
        "Ask THEM what they'd want instead. Say: 'These are for my peace of mind, but I don't want them to annoy you. What would feel like caring instead of checking?' Often swapping 'did you eat' for a daily photo of the grandkids changes the tone instantly.",
    },
  ],
};

const posts: BlogPost[] = [gentleCheckinQuestionsPost];

export function getAllPosts(): Array<BlogPost & { url: string }> {
  const base = "/blog";
  return posts
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    )
    .map((p) => ({ ...p, url: `${base}/${p.slug}` }));
}

export function getPostBySlug(
  slug: string,
): (BlogPost & { url: string }) | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return posts.map((p) => p.slug);
}
