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
    description: "Plastering, painting and decorating, and garden work in Solihull by Darren Goodchild, with over 25 years in the trade.",
    copy: [
      "Solihull is a town in the West Midlands, south-east of Birmingham, and the centre of the Metropolitan Borough of Solihull. Darren Goodchild takes on plastering, painting and decorating, and garden work for homeowners across the town and the borough around it.",
      "Most of his work is plastering: skimming tired walls, boarding out new ceilings and bringing stairwells and landings back to a smooth finish. Because he decorates as well, a Solihull room can go from bare plaster to painted walls and woodwork without you finding a second tradesman. If the job is bigger than one room, such as a kitchen refit, new wall panelling or a loft room, mention it when you get in touch and he will say what he can take on.",
      "Outside, he puts up close-board fences with concrete posts, clears overgrown gardens and builds raised timber planters.",
      "To get a price, use the quote form on this site, send a WhatsApp message with a few photos of the walls or garden, or ring him directly. He will reply by WhatsApp or phone to talk the job through.",
    ],
  },
  {
    slug: "knowle-and-dorridge",
    name: "Knowle & Dorridge",
    region: "West Midlands",
    description: "Skimming, decorating, fencing and garden clearances for homes in Knowle & Dorridge, from plasterer Darren Goodchild.",
    copy: [
      "Knowle and Dorridge are neighbouring villages in the Metropolitan Borough of Solihull, to the south-east of Solihull town. Darren Goodchild plasters, decorates and works on gardens for households in both villages.",
      "He can skim a room and then paint it, so the plastering and the decorating are both in one pair of hands. He also plasterboards walls and ceilings, finishes window reveals and alcoves, and plasters sloping loft ceilings. For woodwork, he fits decorative wall panelling, and he paints doors, frames and skirting boards to finish a room.",
      "In the garden he can replace a tired fence, add gravel boards, clear an overgrown plot or build raised planters.",
      "If you live in Knowle or Dorridge, the quickest way to start is the quote form: give your postcode, pick a service and describe the job in a few lines. Prefer to talk? Call Darren or message him on WhatsApp, where you can send photos of the rooms or garden as well.",
    ],
  },
  {
    slug: "sutton-coldfield",
    name: "Sutton Coldfield",
    region: "Birmingham",
    description: "Plastering, ceilings, decorating and garden work in Sutton Coldfield by Darren Goodchild. Ask for a quote online or by phone.",
    copy: [
      "Sutton Coldfield is a town in the north of the City of Birmingham, home to the large open space of Sutton Park. Darren covers homes across Sutton Coldfield for plastering, painting and decorating, and gardening.",
      "On the plastering side, that means skimming over old walls, boarding and skimming new partitions, and plastering ceilings, bulkheads and stairwells. He has more than 25 years in the trade, and plastering is the work he started with. Once the plaster is dry he can paint the walls and ceilings and finish the doors and skirting, including high or vaulted ceilings.",
      "He also takes on kitchen fitting, timber joists and framing, and the carpentry and boarding inside loft conversions. For gardens, ask about close-board fencing, clearances and raised planters.",
      "Send your details through the quote form, and Darren will come back to you by WhatsApp or phone about the job in Sutton Coldfield. You can also ring him if you would rather explain the job over the phone.",
    ],
  },
  {
    slug: "edgbaston-and-harborne",
    name: "Edgbaston & Harborne",
    region: "Birmingham",
    description: "Plastering, decorating, wall panelling and garden work in Edgbaston & Harborne from Darren Goodchild of Good News Plastering.",
    copy: [
      "Edgbaston and Harborne are neighbouring suburbs to the south-west of Birmingham city centre. Darren Goodchild offers plastering, decorating and garden work to homeowners in both. His experience in plastering and the trades around it runs to more than 25 years.",
      "Hallways, landings and narrow staircases are all work he does, from fixing new plasterboard to the final skim. He plasters around window reveals and into chimney breast alcoves. After plastering he can decorate the same rooms, painting walls, ceilings and woodwork, so you are not waiting on a separate decorator. Decorative panel moulding on a stair wall or a feature wall is another job he can quote for, and kitchen fitting and loft conversion work can be discussed too.",
      "Outdoors, he builds close-board fences, clears neglected gardens and makes raised timber planters.",
      "For a price on work in Edgbaston or Harborne, fill in the quote form with your postcode and a short description. You can also send him photos on WhatsApp alongside your message.",
    ],
  },
  {
    slug: "barnt-green-and-bromsgrove",
    name: "Barnt Green & Bromsgrove",
    region: "Worcestershire",
    description: "Plasterer and decorator Darren Goodchild covers Barnt Green & Bromsgrove for skimming, boarding, painting and gardens.",
    copy: [
      "Bromsgrove is a market town in north Worcestershire, and Barnt Green is a village in the same district, close to the Lickey Hills. Darren takes on plastering, painting and decorating, and gardening jobs in the town, the village and the surrounding area.",
      "Whether it is a single wall above a radiator or a whole floor of rooms, he can skim it to a smooth finish ready for paint. He boards out new walls and ceilings, including stud walls and sloping loft ceilings, before plastering them. When the plaster has dried, he can carry on with the painting, from ceilings and walls to doors, frames and skirting. His wider work includes fitting kitchens, laying timber joists and fitting decorative panelling.",
      "In gardens around Bromsgrove and Barnt Green he can put up a new fence, fit gravel boards, clear an overgrown space or build raised planters.",
      "Get in touch through the quote form, by WhatsApp or by phone, and say which service you need and roughly what the job involves.",
    ],
  },
  {
    slug: "malvern",
    name: "Malvern",
    region: "Worcestershire",
    description: "Plastering after building work, re-skimming, decorating and fencing in Malvern by Darren Goodchild. Request a quote online.",
    copy: [
      "Malvern is a Worcestershire town that sits along the eastern slopes of the Malvern Hills. Darren Goodchild covers Malvern for plastering, decorating and garden work.",
      "If you are renovating, he can plasterboard and skim rooms after building work, including ceilings over new timber joists. He also re-skims existing walls and ceilings where the old surface is cracked or uneven. Stairwells and landings, with their high walls and awkward corners, are part of his plastering work. His decorating covers walls, ceilings, doors and skirting, and he paints high and vaulted ceilings too.",
      "For bigger projects he also does kitchen fitting and the framing, insulation and boarding for loft rooms. He can help with the garden as well, from close-board fencing to clearing and raised timber planters.",
      "To ask for a quote in Malvern, use the form on the quote page and Darren will reply by WhatsApp or phone. WhatsApp is also a good way to show him the job, because you can send photos with your message.",
    ],
  },
  {
    slug: "broadway",
    name: "Broadway",
    region: "Worcestershire",
    description: "Plastering, loft room ceilings, decorating, panelling and garden fencing in Broadway, Worcestershire, by Darren Goodchild.",
    copy: [
      "Broadway is a village in the south-east of Worcestershire, within the Cotswolds. Darren offers plastering, painting and decorating, and garden work to homeowners in and around Broadway.",
      "He can fix new plasterboard where a wall or ceiling needs it, then skim it smooth, or skim straight over a sound existing surface. Loft rooms with sloping ceilings and window reveals are both plastering jobs he takes on. He can also decorate afterwards, painting walls and ceilings and finishing doors, frames and skirting. If a room needs more, he fits decorative wall panelling and kitchens, and works on the timber framing in loft conversions.",
      "Garden work includes new close-board fences on concrete posts, clearing overgrown ground and building raised planters.",
      "To start, send Darren your details from the quote page, with your Broadway postcode and a few words about the job. He will answer by WhatsApp or phone. Calling him directly works just as well if you prefer.",
    ],
  },
  {
    slug: "pershore",
    name: "Pershore",
    region: "Worcestershire",
    description: "Skimming, plasterboarding, decorating, kitchens and garden work in Pershore and nearby villages from Darren Goodchild.",
    copy: [
      "Pershore is a market town in Worcestershire on the River Avon, south-east of Worcester. Darren Goodchild takes on plastering, decorating and gardening work across Pershore and nearby villages.",
      "His plastering covers skimming, plasterboarding and ceilings, from a small landing with a loft hatch to a large open-plan room. He can take care of the decorating once the plaster is dry, so the walls, ceilings and woodwork are finished by the same person. Kitchen fitting, carpentry and panelling, and loft conversion work are also on offer, so ask if your job goes beyond plastering.",
      "For the garden he puts up timber fencing, clears plots that have got out of hand and builds raised planters on legs.",
      "Use the quote form to send your name, phone number, postcode and a description of the work in Pershore. Darren will get back to you by WhatsApp or phone, and you can message him photos if that makes the job easier to explain.",
    ],
  },
  {
    slug: "evesham",
    name: "Evesham",
    region: "Worcestershire",
    description: "Plastering, painting and decorating, kitchen fitting and gardening in Evesham and the Vale of Evesham by Darren Goodchild.",
    copy: [
      "Evesham is a market town in south Worcestershire on the River Avon, at the heart of the Vale of Evesham. Evesham is one of the three places named in the area Darren covers, alongside Birmingham and Worcestershire. He offers plastering, painting and decorating, and gardening to homes in the town and across the Vale.",
      "That can mean skimming a single wall, plastering a stairwell and bulkhead, or boarding and skimming a whole corridor. With the plaster dry, he can paint the room through, including walls, ceilings, doors and skirting. He also fits kitchens with base units, worktops and appliances, and builds the stud framing for loft rooms.",
      "Outside, he can fit close-board fencing with gravel boards, clear a garden or build raised timber planters.",
      "For a quote in Evesham, fill in the form, message Darren on WhatsApp or give him a call. Tell him your postcode and what needs doing, and he will reply by WhatsApp or phone.",
    ],
  },
  {
    slug: "stratford-upon-avon",
    name: "Stratford-upon-Avon",
    region: "Warwickshire",
    description: "Plastering, decorating, panelling and garden work in Stratford-upon-Avon by Darren Goodchild. Send your job details online.",
    copy: [
      "Stratford-upon-Avon is a market town in south Warwickshire on the River Avon. It is in Warwickshire rather than Worcestershire, and Darren covers it for plastering, decorating and garden work.",
      "Plastering is the main part of his work: skimming walls and ceilings, boarding new walls and plastering stairwells, landings and loft rooms. He has been in the trade for more than 25 years. After plastering, he can decorate the room, painting walls and ceilings and finishing the woodwork. Painting high and vaulted ceilings is part of the decorating he does. Ask him about decorative wall panelling, kitchen fitting or loft conversion work too.",
      "Gardens are covered as well, with close-board fencing, clearances and raised timber planters.",
      "To arrange a quote in Stratford-upon-Avon, use the quote form and include your postcode and a short description of the job. Darren replies by WhatsApp or phone, and you are welcome to send photos over WhatsApp first. If you would rather talk it through, ring him instead.",
    ],
  },
];

export const areas: Area[] = entries.map((entry) => ({ ...entry, title: title(entry.name) }));

export function areaHref(area: Pick<Area, "slug">): string {
  return `/areas/${area.slug}`;
}
