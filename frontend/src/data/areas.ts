export interface Area {
  slug: string;
  name: string;
  region: string;
  title: string;
  description: string;
  copy: string[];
}

function title(name: string): string {
  return `Plastering & Decorating in ${name} | Good News Plastering`;
}

const entries: Omit<Area, "title">[] = [
  {
    slug: "solihull",
    name: "Solihull",
    region: "West Midlands",
    description: "Plastering, painting and decorating, and garden work in Solihull, from a plasterer with over 25 years in the trade.",
    copy: [
      "Solihull is a town in the West Midlands, south-east of Birmingham, and the centre of the Metropolitan Borough of Solihull. We take on plastering, painting and decorating, and garden work for homeowners across the town and the borough around it.",
      "Plastering is our main trade. We skim tired walls, board out new ceilings and bring stairwells and landings back to a smooth finish. Because we decorate as well, a Solihull room can go from bare plaster to painted walls and woodwork without you finding a second tradesman. If the job is bigger than one room, such as a kitchen refit, new wall panelling or a loft room, mention it when you get in touch and we'll say what we can take on.",
      "Outside, we put up close-board fences with concrete posts, clear overgrown gardens and build raised timber planters.",
      "To get a price, use the quote form on this site, send a WhatsApp message with a few photos of the walls or garden, or give us a ring. We'll reply by WhatsApp or phone to talk the job through.",
    ],
  },
  {
    slug: "knowle-and-dorridge",
    name: "Knowle & Dorridge",
    region: "West Midlands",
    description: "Skimming, decorating, fencing and garden clearances for homes in Knowle & Dorridge, from Good News Plastering.",
    copy: [
      "Knowle and Dorridge are neighbouring villages in the Metropolitan Borough of Solihull, to the south-east of Solihull town. We plaster, decorate and work on gardens for households in both villages.",
      "We can skim a room and then paint it, so the plastering and the decorating are both in one pair of hands. We also plasterboard walls and ceilings, finish window reveals and alcoves, and plaster sloping loft ceilings. On the woodwork side, we fit decorative wall panelling and paint doors, frames and skirting boards to finish a room.",
      "In the garden we can replace a tired fence, add gravel boards, clear an overgrown plot or build raised planters.",
      "If you live in Knowle or Dorridge, the quickest way to start is the quote form: give your postcode, pick a service and describe the job in a few lines. Prefer to talk? Give us a call or message us on WhatsApp, where you can send photos of the rooms or garden as well.",
    ],
  },
  {
    slug: "sutton-coldfield",
    name: "Sutton Coldfield",
    region: "Birmingham",
    description: "Plastering, ceilings, decorating and garden work in Sutton Coldfield. Ask us for a quote online or by phone.",
    copy: [
      "Sutton Coldfield is a town in the north of the City of Birmingham, home to the large open space of Sutton Park. We cover homes across Sutton Coldfield for plastering, painting and decorating, and gardening.",
      "On the plastering side, that means skimming over old walls, boarding and skimming new partitions, and plastering ceilings, bulkheads and stairwells. We've got more than 25 years in the trade, and plastering is the main thing we do. Once the plaster is dry we can paint the walls and ceilings and finish the doors and skirting, high or vaulted ceilings included.",
      "We also take on kitchen fitting, timber joists and framing, and the carpentry and boarding inside loft conversions. For gardens, ask about close-board fencing, clearances and raised planters.",
      "Send your details through the quote form and we'll come back to you by WhatsApp or phone about the job in Sutton Coldfield. You can also ring us if you'd rather explain the job over the phone.",
    ],
  },
  {
    slug: "edgbaston-and-harborne",
    name: "Edgbaston & Harborne",
    region: "Birmingham",
    description: "Plastering, decorating, wall panelling and garden work in Edgbaston & Harborne from Good News Plastering.",
    copy: [
      "Edgbaston and Harborne are neighbouring suburbs to the south-west of Birmingham city centre. We offer plastering, decorating and garden work to homeowners in both. Our experience in plastering and the trades around it goes back more than 25 years.",
      "Hallways, landings and narrow staircases are all work we do, from fixing new plasterboard to the final skim. We plaster around window reveals and into chimney breast alcoves. After plastering we can decorate the same rooms, painting walls, ceilings and woodwork, so you're not waiting on a separate decorator. We can quote for decorative panel moulding on a stair wall or a feature wall too, and we're happy to talk about kitchen fitting and loft conversion work.",
      "Outdoors, we build close-board fences, clear neglected gardens and make raised timber planters.",
      "For a price on work in Edgbaston or Harborne, fill in the quote form with your postcode and a short description. You can also send us photos on WhatsApp along with your message.",
    ],
  },
  {
    slug: "barnt-green-and-bromsgrove",
    name: "Barnt Green & Bromsgrove",
    region: "Worcestershire",
    description: "Plastering and decorating in Barnt Green & Bromsgrove: skimming, boarding, painting and garden work.",
    copy: [
      "Bromsgrove is a market town in north Worcestershire, and Barnt Green is a village in the same district, close to the Lickey Hills. We take on plastering, painting and decorating, and gardening jobs in the town, the village and the surrounding area.",
      "Whether it's a single wall above a radiator or a whole floor of rooms, we can skim it to a smooth finish ready for paint. We board out new walls and ceilings, including stud walls and sloping loft ceilings, before plastering them. When the plaster has dried, we can carry on with the painting: ceilings, walls, doors, frames and skirting. We also fit kitchens, lay timber joists and fit decorative panelling.",
      "In gardens around Bromsgrove and Barnt Green we can put up a new fence, fit gravel boards, clear an overgrown space or build raised planters.",
      "Get in touch through the quote form, by WhatsApp or by phone, and say which service you need and roughly what the job involves.",
    ],
  },
  {
    slug: "malvern",
    name: "Malvern",
    region: "Worcestershire",
    description: "Plastering after building work, re-skimming, decorating and fencing in Malvern. Ask us for a quote online.",
    copy: [
      "Malvern is a Worcestershire town that sits along the eastern slopes of the Malvern Hills. We cover Malvern for plastering, decorating and garden work.",
      "If you're renovating, we can plasterboard and skim rooms after building work, including ceilings over new timber joists. We also re-skim existing walls and ceilings where the old surface is cracked or uneven. Stairwells and landings, with their high walls and awkward corners, are part of our plastering work. Our decorating covers walls, ceilings, doors and skirting, and we paint high and vaulted ceilings too.",
      "For bigger projects we also do kitchen fitting and the framing, insulation and boarding for loft rooms. We can help with the garden as well, from close-board fencing to clearing and raised timber planters.",
      "To ask for a quote in Malvern, use the form on the quote page and we'll reply by WhatsApp or phone. WhatsApp is also a good way to show us the job, because you can send photos with your message.",
    ],
  },
  {
    slug: "broadway",
    name: "Broadway",
    region: "Worcestershire",
    description: "Plastering, loft room ceilings, decorating, panelling and garden fencing in Broadway, Worcestershire.",
    copy: [
      "Broadway is a village in the south-east of Worcestershire, within the Cotswolds. We do plastering, painting and decorating, and garden work for homeowners in and around Broadway.",
      "We can fix new plasterboard where a wall or ceiling needs it and then skim it smooth, or skim straight over a sound existing surface. Loft rooms with sloping ceilings and window reveals are both plastering jobs we take on. We can decorate afterwards too, painting walls and ceilings and finishing doors, frames and skirting. If a room needs more, we fit decorative wall panelling and kitchens, and work on the timber framing in loft conversions.",
      "Garden work includes new close-board fences on concrete posts, clearing overgrown ground and building raised planters.",
      "To start, send us your details from the quote page, with your Broadway postcode and a few words about the job. We'll answer by WhatsApp or phone. Calling us works just as well if you prefer.",
    ],
  },
  {
    slug: "pershore",
    name: "Pershore",
    region: "Worcestershire",
    description: "Skimming, plasterboarding, decorating, kitchens and garden work in Pershore and nearby villages from Good News Plastering.",
    copy: [
      "Pershore is a market town in Worcestershire on the River Avon, south-east of Worcester. We take on plastering, decorating and gardening work across Pershore and nearby villages.",
      "Our plastering covers skimming, plasterboarding and ceilings, from a small landing with a loft hatch to a large open-plan room. We can do the decorating once the plaster is dry, so the walls, ceilings and woodwork are finished by the same person. We also do kitchen fitting, carpentry and panelling, and loft conversion work, so ask if your job goes beyond plastering.",
      "For the garden we put up timber fencing, clear plots that have got out of hand and build raised planters on legs.",
      "Use the quote form to send your name, phone number, postcode and a description of the work in Pershore. We'll get back to you by WhatsApp or phone, and you can message us photos if that makes the job easier to explain.",
    ],
  },
  {
    slug: "evesham",
    name: "Evesham",
    region: "Worcestershire",
    description: "Plastering, painting and decorating, kitchen fitting and gardening in Evesham and the Vale of Evesham.",
    copy: [
      "Evesham is a market town in south Worcestershire on the River Avon, in the middle of the Vale of Evesham. It's one of the three places named in the area we cover, along with Birmingham and Worcestershire. We offer plastering, painting and decorating, and gardening to homes in the town and across the Vale.",
      "That can mean skimming a single wall, plastering a stairwell and bulkhead, or boarding and skimming a whole corridor. With the plaster dry, we can paint the room through, including walls, ceilings, doors and skirting. We also fit kitchens with base units, worktops and appliances, and build the stud framing for loft rooms.",
      "Outside, we can fit close-board fencing with gravel boards, clear a garden or build raised timber planters.",
      "For a quote in Evesham, fill in the form, message us on WhatsApp or give us a call. Tell us your postcode and what needs doing, and we'll reply by WhatsApp or phone.",
    ],
  },
  {
    slug: "stratford-upon-avon",
    name: "Stratford-upon-Avon",
    region: "Warwickshire",
    description: "Plastering, decorating, panelling and garden work in Stratford-upon-Avon. Send us your job details online.",
    copy: [
      "Stratford-upon-Avon is a market town in south Warwickshire on the River Avon. It's in Warwickshire rather than Worcestershire, and we cover it for plastering, decorating and garden work.",
      "Plastering is the main part of our work: skimming walls and ceilings, boarding new walls and plastering stairwells, landings and loft rooms. We've been in the trade for more than 25 years. After plastering, we can decorate the room, painting walls and ceilings and finishing the woodwork. That includes high and vaulted ceilings. Ask us about decorative wall panelling, kitchen fitting or loft conversion work too.",
      "We do gardens as well: close-board fencing, clearances and raised timber planters.",
      "To arrange a quote in Stratford-upon-Avon, use the quote form and include your postcode and a short description of the job. We reply by WhatsApp or phone, and you're welcome to send photos over WhatsApp first. If you'd rather talk it through, give us a ring instead.",
    ],
  },
];

export const areas: Area[] = entries.map((entry) => ({ ...entry, title: title(entry.name) }));

export function areaHref(area: Pick<Area, "slug">): string {
  return `/areas/${area.slug}`;
}
