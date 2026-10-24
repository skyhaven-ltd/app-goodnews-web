import type { QuoteService } from "../lib/quote";

export type ProjectService = Exclude<QuoteService, "Other">;

export interface Project {
  file: string;
  image: ImageMetadata;
  alt: string;
  service: ProjectService;
}

const images = import.meta.glob<{ default: ImageMetadata }>("../assets/projects/*.jpg", { eager: true });

function image(file: string): ImageMetadata {
  const module = images[`../assets/projects/${file}`];
  if (!module) {
    throw new Error(`Missing project image ${file}; run npm run images`);
  }
  return module.default;
}

const entries: Omit<Project, "image">[] = [
  { file: "plastered-room-with-tools.jpg", service: "Plastering", alt: "Freshly plastered walls and ceiling with plastering tools and a step on the floor" },
  { file: "steel-beams-and-ceiling-joists.jpg", service: "Carpentry & panelling", alt: "New steel beams and timber ceiling joists fitted during a structural alteration" },
  { file: "close-board-fence.jpg", service: "Gardening & Landscaping", alt: "Newly installed close-board timber fence with concrete posts and gravel boards" },
  { file: "finished-landing.jpg", service: "Painting & Decorating", alt: "Finished landing with freshly painted walls, white doors and new carpet" },
  { file: "plastered-loft-room.jpg", service: "Plastering", alt: "Loft room with freshly skimmed walls and sloping ceiling drying out" },
  { file: "plastering-large-room.jpg", service: "Plastering", alt: "Plastering under way in a large open room, with boards laid across the floor" },
  { file: "timber-floor-joists.jpg", service: "Carpentry & panelling", alt: "New timber floor joists laid in a grid over a damp-proof membrane" },
  { file: "freshly-plastered-wall.jpg", service: "Plastering", alt: "Smooth, freshly plastered wall above a radiator" },
  { file: "fitted-kitchen.jpg", service: "Kitchen fitting", alt: "Fitted kitchen with cream cabinets and solid wood worktops" },
  { file: "plastered-hallway.jpg", service: "Plastering", alt: "Long hallway with newly plastered walls and doorways" },
  { file: "plastered-window-reveal.jpg", service: "Plastering", alt: "Newly plastered wall and window reveal beside a white front door" },
  { file: "stair-wall-panelling.jpg", service: "Carpentry & panelling", alt: "Staircase wall finished with white decorative panel moulding" },
  { file: "plasterboarded-corridor.jpg", service: "Plastering", alt: "Corridor with new plasterboard fixed to the walls, ready for skimming" },
  { file: "plastered-wall-with-access-panel.jpg", service: "Plastering", alt: "Freshly plastered wall beside a door, with a white access panel fitted" },
  { file: "vaulted-ceiling.jpg", service: "Painting & Decorating", alt: "Finished vaulted ceiling painted white, with a crystal chandelier" },
  { file: "plastered-alcove-in-kitchen.jpg", service: "Plastering", alt: "Plastered chimney breast alcove above new kitchen base units" },
  { file: "plastered-stairwell.jpg", service: "Plastering", alt: "Stairwell with freshly plastered walls and ceiling" },
  { file: "finished-bedroom.jpg", service: "Painting & Decorating", alt: "Finished bedroom with a fitted wardrobe, painted walls and an oak beam" },
  { file: "plastered-stair-bulkhead.jpg", service: "Plastering", alt: "Freshly plastered bulkhead and walls over a staircase" },
  { file: "extension-roof-rafters.jpg", service: "Carpentry & panelling", alt: "Extension roof with timber rafters, roof windows and insulation boards ready to fit" },
  { file: "fence-along-cleared-garden.jpg", service: "Gardening & Landscaping", alt: "New timber fence running along a cleared garden" },
  { file: "plastered-landing-with-loft-hatch.jpg", service: "Plastering", alt: "Small landing with freshly plastered walls and a loft hatch above" },
  { file: "loft-conversion-stud-framing.jpg", service: "Loft conversion", alt: "Timber stud framing going up in a loft conversion" },
  { file: "wall-panelling-in-progress.jpg", service: "Carpentry & panelling", alt: "Decorative wall panelling being fitted to a painted wall" },
  { file: "plastered-narrow-staircase.jpg", service: "Plastering", alt: "Narrow staircase with newly plastered walls" },
  { file: "roof-insulation-boards.jpg", service: "Loft conversion", alt: "Foil-faced insulation boards fitted between roof rafters and walls" },
  { file: "kitchen-hob-and-oven.jpg", service: "Kitchen fitting", alt: "New kitchen with a built-in oven, hob, extractor hood and wood worktop" },
  { file: "raised-timber-planters.jpg", service: "Gardening & Landscaping", alt: "Two raised timber planters on legs, built for a garden" },
];

export const projects: Project[] = entries.map((entry) => ({ ...entry, image: image(entry.file) }));

export function projectByFile(file: string): Project {
  const project = projects.find((entry) => entry.file === file);
  if (!project) {
    throw new Error(`Unknown project ${file}`);
  }
  return project;
}

export interface BeforeAfterPair {
  room: string;
  before: Project;
  after: Project;
}

const pairEntries: { room: string; before: string; after: string }[] = [];

export const beforeAfterPairs: BeforeAfterPair[] = pairEntries.map((pair) => ({
  room: pair.room,
  before: projectByFile(pair.before),
  after: projectByFile(pair.after),
}));
