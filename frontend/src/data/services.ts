import { projectByFile, projects, type Project, type ProjectService } from "./projects";

export interface Service {
  name: ProjectService;
  summary: string;
  photo: Project;
}

export interface LeadService extends Service {
  slug: string;
  title: string;
  description: string;
  intro: string[];
  includes: string[];
  photos: Project[];
}

function photosOf(name: ProjectService): Project[] {
  return projects.filter((project) => project.service === name);
}

const leadEntries: (Omit<LeadService, "photo" | "photos"> & { photo: string })[] = [
  {
    slug: "plastering",
    name: "Plastering",
    title: "Plastering in Birmingham & Worcestershire | Good News Plastering",
    description: "Skimming, plasterboarding and ceilings from a plasterer with over 25 years in the trade.",
    summary: "Skimming, boarding and ceilings, whether it's one wall or a whole floor.",
    intro: [
      "Plastering is our main trade, and we've been at it for more than 25 years.",
      "We plaster single walls, whole rooms, hallways, stairwells and loft rooms. We also board out new walls and ceilings ready to skim.",
    ],
    includes: [
      "Skimming walls and ceilings",
      "Plasterboarding new and stripped walls",
      "Stairwells, landings and bulkheads",
      "Window reveals and alcoves",
      "Loft rooms and sloping ceilings",
    ],
    photo: "freshly-plastered-wall.jpg",
  },
  {
    slug: "painting-and-decorating",
    name: "Painting & Decorating",
    title: "Painting & Decorating in Birmingham & Worcestershire | Good News Plastering",
    description: "Interior painting and decorating for walls, ceilings and woodwork, often straight after we've done the plastering.",
    summary: "Walls, ceilings and woodwork finished and ready to live in.",
    intro: [
      "Once the plaster has dried we can decorate the room too, so the same person sees the job through from bare walls to the last coat.",
      "We paint walls, ceilings, doors and woodwork in landings and bedrooms, and we can reach high or vaulted ceilings.",
    ],
    includes: ["Walls and ceilings", "Doors, frames and skirting", "Landings and stairwells", "High and vaulted ceilings"],
    photo: "finished-landing.jpg",
  },
  {
    slug: "gardening-and-landscaping",
    name: "Gardening & Landscaping",
    title: "Gardening & Landscaping in Birmingham & Worcestershire | Good News Plastering",
    description: "Fencing, garden clearances and raised timber planters for homes across Birmingham, Worcestershire and Evesham.",
    summary: "Fencing, clearances and raised planters.",
    intro: [
      "Outside the house, we put up fences, clear overgrown gardens and build timber planters.",
      "Tell us what the garden needs and we'll give you a quote.",
    ],
    includes: ["Close-board fencing with concrete posts", "Gravel boards", "Garden clearances", "Raised timber planters"],
    photo: "close-board-fence.jpg",
  },
];

const secondaryEntries: { name: ProjectService; summary: string; photo: string }[] = [
  { name: "Kitchen fitting", summary: "Cabinets, worktops and appliances fitted.", photo: "fitted-kitchen.jpg" },
  { name: "Carpentry & panelling", summary: "Joists, framing and decorative wall panelling.", photo: "stair-wall-panelling.jpg" },
  { name: "Loft conversion", summary: "Framing, insulation and boarding for loft rooms.", photo: "loft-conversion-stud-framing.jpg" },
];

export const leadServices: LeadService[] = leadEntries.map((entry) => ({
  ...entry,
  photo: projectByFile(entry.photo),
  photos: photosOf(entry.name),
}));

export const secondaryServices: Service[] = secondaryEntries.map((entry) => ({ ...entry, photo: projectByFile(entry.photo) }));

export function serviceHref(service: Pick<LeadService, "slug">): string {
  return `/services/${service.slug}`;
}
