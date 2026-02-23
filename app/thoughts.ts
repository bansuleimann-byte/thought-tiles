export type Thought = {
  id: number;
  title: string;
  content: string;
  date: string;
  x: number;
  y: number;
  image: string;
};

const thoughtsRaw: Thought[] = [
  {
    id: 1,
    title: "first thought",
    content: `When asked about motivation and reason for creating something,
sometimes the answer is:

"I just wanted something like this to exist."`,
    date: "2026-02-21",
    x: 18,
    y: 28,
    image: "/tiles/tile10.jpg",
  },
  {
    id: 2,
    title: "i like quiet mornings",
    content: `There is something about the quiet before the world wakes up.
No urgency. No noise.
Just the soft permission to exist.`,
    date: "2026-02-20",
    x: 62,
    y: 34,
    image: "/tiles/tile11.jpg",
  },
  {
    id: 3,
    title: "words grow slowly",
    content: "",
    date: "",
    x: 38,
    y: 72,
    image: "/tiles/tile13.jpg",
  },
  {
    id: 4,
    title: "thought tiles",
    content: "",
    date: "",
    x: 78,
    y: 66,
    image: "/tiles/tile17.jpg",
  },
  {
    id: 5,
    title: "a place to land",
    content: `Ideas need somewhere to rest.
Not every thought needs to become something.
Some just need to be held for a moment.`,
    date: "2026-02-19",
    x: 22,
    y: 55,
    image: "/tiles/tile1.jpg",
  },
  {
    id: 6,
    title: "small rituals",
    content: `Coffee first. Then the page.
The order matters less than the showing up.`,
    date: "2026-02-18",
    x: 45,
    y: 41,
    image: "/tiles/tile2.jpg",
  },
  {
    id: 7,
    title: "between the lines",
    content: `What we don't say often says more.
The space between words carries its own weight.`,
    date: "2026-02-17",
    x: 68,
    y: 19,
    image: "/tiles/tile3.jpg",
  },
  {
    id: 8,
    title: "patterns repeat",
    content: `We are creatures of habit.
Sometimes that's the problem.
Sometimes it's the only thing holding us together.`,
    date: "2026-02-16",
    x: 12,
    y: 73,
    image: "/tiles/tile4.jpg",
  },
];
const toTime = (d: string) => {
  const t = Date.parse(d);
  return Number.isFinite(t) ? t : 0;
};

export const thoughts: Thought[] = [...thoughtsRaw].sort(
  (a, b) => toTime(b.date) - toTime(a.date) || b.id - a.id
);
