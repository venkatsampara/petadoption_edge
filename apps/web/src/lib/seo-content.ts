export type AdoptionCategory = {
  slug: string;
  species: "dog" | "cat";
  title: string;
  description: string;
  h1: string;
  intro: string;
  listingTitle: string;
  listingDescription: string;
  fixedFilters?: Record<string, string>;
  showBreedFilter?: boolean;
  ageFilter?: "range" | "puppy" | "cat";
  sections: { title: string; paragraphs: string[]; bullets?: string[] }[];
  faqs: { question: string; answer: string }[];
};

export const adoptionCategories: AdoptionCategory[] = [
  {
    slug: "dogs-for-adoption",
    species: "dog",
    title: "Dog Adoption in Hyderabad | Adopt a Loving Dog – Hyderabad Paws",
    description:
      "Looking to adopt a dog in Hyderabad? Discover rescued dogs and puppies available for adoption. Explore pet profiles and connect with responsible rescuers through Hyderabad Paws.",
    h1: "Find Your Perfect Companion – Dogs Available for Adoption in Hyderabad",
    intro:
      "Meet dogs and puppies whose caregivers have shared a profile on Hyderabad Paws. Browse current Hyderabad listings, learn what is known about each animal, and contact the caregiver to discuss whether your home and routines are a good match.",
    listingTitle: "Dogs looking for homes in Hyderabad",
    listingDescription:
      "Availability and profile details can change. Ask the caregiver about history, temperament and care before making a decision.",
    showBreedFilter: true,
    ageFilter: "range",
    sections: [
      {
        title: "Why adopt rather than buy?",
        paragraphs: [
          "Adoption gives a dog already in a caregiver’s care the chance to join a committed home. It also lets you learn about an individual dog’s known personality and needs instead of choosing on appearance alone.",
          "There is no one-size-fits-all match. Talk openly with the rescuer, meet the dog safely, and consider the time, veterinary care and long-term costs your household can provide.",
        ],
      },
      {
        title: "Why consider an Indie dog?",
        paragraphs: [
          "Indie is a commonly used name for Indian native dogs, but a street-rescued or mixed-breed dog is not automatically a purebred Indian Pariah Dog. Read each profile’s breed description as provided, and ask the caregiver what is known rather than inferring ancestry from appearance.",
          "A dog’s temperament and individual needs matter more than a label. Explore the dedicated guide to [Indie dog adoption](/indie-dogs-for-adoption) for more context.",
        ],
      },
      {
        title: "A thoughtful adoption process",
        paragraphs: [
          "Start with a profile, then ask about the dog’s routine, comfort around children or other animals, medical records and any known training. Arrange a calm meeting with the caregiver’s guidance and make sure everyone in the household is ready.",
          "Before bringing a dog home, confirm pet rules with your landlord or apartment association, prepare a safe resting area, and plan ongoing veterinary care. Adoption requirements are set by each caregiver; Hyderabad Paws does not promise a single process for every listing.",
        ],
      },
      {
        title: "Responsible dog ownership in Hyderabad",
        paragraphs: [
          "Daily care includes fresh water, suitable food, exercise and enrichment, patient training, identification, and preventive and routine veterinary care. Plan walks around the day’s heat and provide shade and ventilation at home.",
          "Use neighbourhood filters to discover listings shared in areas such as Gachibowli, Madhapur or Secunderabad. A nearby listing can make a first conversation easier, but the right match should be based on the dog’s needs and your ability to care for them.",
        ],
      },
    ],
    faqs: [
      {
        question: "How do I adopt a dog in Hyderabad through Hyderabad Paws?",
        answer:
          "Browse the available profiles, open a dog’s page and use the enquiry options shown there. The listed caregiver can explain their process and arrange next steps.",
      },
      {
        question: "Is dog adoption free in Hyderabad?",
        answer:
          "Costs and any adoption contribution vary by caregiver and are not assumed by Hyderabad Paws. Ask directly about any contribution, records and care already provided.",
      },
      {
        question: "Are the dogs’ vaccination details verified?",
        answer:
          "Profiles show information supplied by caregivers. Ask to see available veterinary records and consult a registered veterinarian about any follow-up care.",
      },
      {
        question: "Can I find a dog near my neighbourhood?",
        answer:
          "Use the neighbourhood filter to see listings whose caregivers selected that area. The pet’s profile is the source for its current location information.",
      },
    ],
  },
  {
    slug: "cats-for-adoption",
    species: "cat",
    title: "Cat Adoption in Hyderabad | Adopt a Cat – Hyderabad Paws",
    description:
      "Want to adopt a cat in Hyderabad? Explore rescued cats and kittens looking for loving homes. Discover profiles and connect with local rescuers through Hyderabad Paws.",
    h1: "Adopt a Cat in Hyderabad – Find Your New Feline Companion",
    intro:
      "Explore cat and kitten profiles shared by Hyderabad caregivers. Each listing reflects the information currently available about that individual cat; talk with the rescuer about health history, temperament and the kind of home that will help them settle.",
    listingTitle: "Cats and kittens available for adoption",
    listingDescription:
      "Ask the caregiver about the cat’s age, routine and veterinary history. Listing details are provided by the person currently caring for the animal.",
    ageFilter: "cat",
    showBreedFilter: true,
    sections: [
      {
        title: "Why adopt a rescued cat?",
        paragraphs: [
          "Adopting gives a cat in someone’s care a chance to settle into a safe, lasting home. A conversation with the caregiver can help you understand what is known about the cat’s personality, handling preferences and previous routine.",
          "Kittens and adult cats can both make wonderful companions. Consider the time, safe indoor space and long-term care you can offer before deciding which profile to contact.",
        ],
      },
      {
        title: "Prepare a safe home for a cat",
        paragraphs: [
          "Set up a quiet room with food, water, a litter tray placed away from food, a hiding place and a comfortable resting spot. Let a newly adopted cat explore gradually and choose when to approach.",
          "Secure windows and balconies with suitable barriers, keep potentially harmful household products inaccessible, and provide scratching and play opportunities. Ask the caregiver what the cat already knows and prefers.",
        ],
      },
      {
        title: "Responsible cat ownership",
        paragraphs: [
          "Plan for appropriate food, clean water, litter maintenance, enrichment and routine veterinary care. Ask a registered veterinarian about vaccinations, parasite prevention, sterilisation and any health questions based on the cat’s history.",
          "Cats often need time and predictable routines to feel secure in a new place. Keep introductions to family members and other pets gradual, and give the cat a way to retreat.",
          "For a settling-in checklist, read the [first 30 days after adopting a cat](/pet-adoption-guide/first-30-days-after-adopting-a-cat).",
        ],
      },
      {
        title: "Adopting a cat in your neighbourhood",
        paragraphs: [
          "Use the filters to find cats listed around your chosen Hyderabad neighbourhood, then open a profile to contact the caregiver. Location is only a starting point: make a careful match based on the cat’s needs and your home.",
          "If no profile fits today, check back later or explore [all available pets](/adopt). New listings and adoption status can change over time.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can I adopt a kitten in Hyderabad?",
        answer:
          "Browse current cat listings and check each profile for the age information shared by the caregiver. Ask about the kitten’s care history and needs before applying.",
      },
      {
        question: "Should a newly adopted cat stay indoors?",
        answer:
          "Discuss the cat’s history and a safe transition plan with the caregiver. Secure doors, windows and balconies, and consult a veterinarian for advice suited to the cat.",
      },
      {
        question: "How long does a cat take to settle in?",
        answer:
          "It varies by cat. A quiet safe room, predictable routines and patient, non-forced introductions can help; ask the caregiver for guidance about that cat.",
      },
    ],
  },
  {
    slug: "indie-dogs-for-adoption",
    species: "dog",
    title: "Indie Dog Adoption in Hyderabad | Adopt an Indian Native Dog – Hyderabad Paws",
    description:
      "Looking to adopt an Indie dog in Hyderabad? Discover Indian native dogs and rescued Indie puppies looking for loving homes through Hyderabad Paws.",
    h1: "Adopt an Indie Dog in Hyderabad – Give a Desi Dog a Loving Home",
    intro:
      "Find dogs whose caregiver-provided breed information identifies them as Indie or Indian Pariah. Hyderabad Paws does not infer a dog’s breed from appearance; mixed-breed and unclassified dogs are not presented as purebred Indian Pariah Dogs.",
    listingTitle: "Indie and Indian Pariah dogs listed for adoption",
    listingDescription:
      "These results use the breed names provided in each pet profile. Confirm breed history and the dog’s individual needs with the caregiver.",
    fixedFilters: { breed: "Indie,Indian Pariah" },
    ageFilter: "range",
    showBreedFilter: false,
    sections: [
      {
        title: "What does “Indie dog” mean?",
        paragraphs: [
          "Indie is a familiar term for Indian native dogs and is also used in adoption listings. “Indian Pariah” may appear as a breed label in a caregiver’s profile. A label in a listing is not independent pedigree verification, so ask the caregiver what they know about the dog’s background.",
          "A rescued dog of unknown or mixed ancestry should be described as such rather than assumed to be a purebred native dog. Hyderabad Paws uses the breed field supplied for each listing.",
        ],
      },
      {
        title: "Get to know the individual dog",
        paragraphs: [
          "Dogs differ in energy, confidence, sociability and comfort with new situations. Meet the dog with the caregiver’s guidance and ask about daily routines, handling, other animals, children and any support that may help the transition.",
          "Apartment life can work for some dogs when their exercise, enrichment, rest and training needs are met. Consider building rules, lift or stair routines, noise, and the time you can offer every day.",
        ],
      },
      {
        title: "Care in Hyderabad’s climate",
        paragraphs: [
          "Offer fresh water, shade and a well-ventilated resting place. Schedule activity for cooler parts of the day when possible, and avoid forcing exercise in hot conditions.",
          "Heavy or unusual panting, weakness, vomiting, confusion or collapse can signal an emergency. Move the dog away from heat and contact a veterinarian immediately; see the [Hyderabad pet weather guide](/pet-adoption-guide/pet-care-hyderabad-weather) for prevention advice.",
        ],
      },
      {
        title: "Training, socialisation and adoption",
        paragraphs: [
          "Use patient, reward-based training and give the dog time to adapt. Introduce new people, places and animals gradually, watching the dog’s comfort and allowing space to retreat.",
          "Read the pet profile, ask the caregiver questions and agree on a safe meet-and-greet. Browse the current listings below; only dogs explicitly labelled Indie or Indian Pariah by their caregiver appear here.",
        ],
      },
      {
        title: "Myths and facts about Indie dogs",
        paragraphs: [
          "Myth: every street-rescued dog is a purebred Indian Pariah. Fact: ancestry cannot be confirmed from location or appearance alone; use the caregiver’s stated information and ask what is known.",
          "Myth: a breed label tells you exactly how a dog will behave. Fact: each dog is an individual. Learn about the specific dog’s routines, health and comfort through the caregiver and a suitable introduction.",
        ],
      },
    ],
    faqs: [
      {
        question: "Are all rescued street dogs Indian Pariah Dogs?",
        answer:
          "No. A street-rescued dog may be mixed-breed or of unknown ancestry. Hyderabad Paws uses profile labels supplied by caregivers and does not infer a pure breed from appearance.",
      },
      {
        question: "Can an Indie dog live in an apartment?",
        answer:
          "It depends on the individual dog and the household. Consider the dog’s activity and comfort needs, daily schedule, building rules and access to safe exercise.",
      },
      {
        question: "What should I ask before adopting an Indie dog?",
        answer:
          "Ask what is known about the dog’s background, health records, routine, behaviour and support needs, and how the caregiver handles introductions and adoption.",
      },
    ],
  },
  {
    slug: "puppies-for-adoption",
    species: "dog",
    title: "Puppy Adoption Near Me in Hyderabad | Adopt a Puppy – Hyderabad Paws",
    description:
      "Searching for puppies for adoption near you? Explore rescued puppies in Hyderabad, view their profiles and connect with responsible rescuers through Hyderabad Paws.",
    h1: "Looking for a Puppy to Adopt in Hyderabad?",
    intro:
      "Browse Hyderabad puppy profiles shared by their current caregivers. This page serves the Hyderabad area; it does not try to determine your precise location. Check the age information in each profile and ask the rescuer about the puppy’s history and care.",
    listingTitle: "Puppies currently listed for adoption",
    listingDescription:
      "Age filters use the information in the pet profile. A puppy’s vaccination or deworming history should be confirmed with the caregiver and reviewed with a veterinarian.",
    ageFilter: "puppy",
    showBreedFilter: true,
    sections: [
      {
        title: "Before you adopt a puppy",
        paragraphs: [
          "Puppies need frequent attention, patient training, safe exploration, feeding routines and veterinary care. Think honestly about work hours, travel, household support and the time you can commit every day.",
          "Ask the caregiver what is known about the puppy’s age, diet, health, vaccination and deworming records, and any early social experiences. Do not assume a treatment has been completed unless records or the caregiver confirm it.",
        ],
      },
      {
        title: "Prepare and puppy-proof your home",
        paragraphs: [
          "Create a calm sleeping area and remove or secure accessible cables, medicines, cleaning products, small objects and foods that are unsafe for dogs. Use gates or barriers where needed and supervise new spaces.",
          "Choose an appropriate food plan with veterinary guidance. Keep fresh water available, introduce changes gradually and ask the caregiver what the puppy currently eats.",
        ],
      },
      {
        title: "Health, training and socialisation",
        paragraphs: [
          "Arrange a veterinary consultation soon after adoption and take any available records. A veterinarian can recommend a vaccination and parasite-control plan based on the puppy’s age, health and previous care.",
          "Use gentle, reward-based training and gradual positive introductions to household sounds, people and safe environments. Avoid overwhelming the puppy; rest is an important part of adjustment.",
        ],
      },
      {
        title: "Find a puppy around Hyderabad",
        paragraphs: [
          "Use the neighbourhood filter to see where current puppy listings are located. A profile’s age may be unknown, so age-based results cannot include every young dog.",
          "When you are ready, contact the caregiver through the pet profile and ask how they handle meetings and adoption. You can also explore [all dogs available for adoption](/dogs-for-adoption).",
        ],
      },
    ],
    faqs: [
      {
        question: "How do I know whether a listed dog is a puppy?",
        answer:
          "The age filter uses the age in the listing. If age is unknown or not current, ask the caregiver directly before deciding whether the puppy’s needs suit your home.",
      },
      {
        question: "Are puppies on this page vaccinated?",
        answer:
          "The page does not assume that a puppy is vaccinated. Ask for available veterinary records and have a registered veterinarian advise on any next steps.",
      },
      {
        question: "What does adopting a puppy cost?",
        answer:
          "Any adoption contribution varies by caregiver. Ask directly and plan separately for food, veterinary visits, preventive care, training and other ongoing needs.",
      },
    ],
  },
];

export type GuideSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type GuideArticle = {
  slug: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  sections: GuideSection[];
  related: string[];
  references?: { label: string; href: string }[];
};

export const guideArticles: GuideArticle[] = [
  {
    slug: "adopting-a-pet-in-hyderabad",
    title: "Complete Guide to Adopting a Pet in Hyderabad",
    description:
      "A practical Hyderabad guide to finding a pet, speaking with a rescuer, preparing your home and planning for responsible lifelong care.",
    h1: "Complete Guide to Adopting a Pet in Hyderabad",
    intro:
      "Adoption is a long-term commitment that starts with an honest conversation. This guide helps you move from browsing a profile to preparing a safe, stable home—without assuming every rescuer uses the same process.",
    sections: [
      { title: "Where to find pets available for adoption", paragraphs: ["Start with the current [Hyderabad Paws adoption listings](/adopt), where profiles are shared by local shelters and independent caregivers. Check a profile’s update and availability with its caregiver; an online listing may change while you are considering it."] },
      { title: "How to evaluate an adoption listing", paragraphs: ["Read the whole profile, not only the photograph. Note what is known about age, health history, routine, temperament, and the area where the pet is currently cared for. Treat missing information as a question to ask, not a fact to fill in yourself.", "A pet’s behaviour in one setting does not guarantee how they will respond in another. Ask how the caregiver learned each detail and whether they can share records or arrange a suitable introduction."] },
      { title: "Questions to ask the rescuer", bullets: ["What is known about the pet’s history, age and daily routine?", "Are there veterinary records, and what care is still recommended?", "How does the pet respond to handling, visitors, children or other animals?", "What food, equipment or transition support will help during the first days?", "What are your adoption steps, and are there any costs or follow-up expectations?"] },
      { title: "The application and meeting process", paragraphs: ["Hyderabad Paws provides profile enquiry options; the caregiver explains their own application and matching process. Share accurate information about your household, schedule, experience and home so both sides can discuss whether the match is suitable.", "Meet in a way agreed with the caregiver and keep the pet’s safety first. Avoid pressure to decide immediately. Confirm who is responsible for transport, records and follow-up before the pet moves."] },
      { title: "Prepare your home and budget", paragraphs: ["Set up a quiet resting space, food and water, and species-appropriate essentials before arrival. Secure balconies, windows, doors, cables, medicines and cleaning products. If you rent or live in an apartment community, confirm its pet rules first.", "Budget for food, routine veterinary visits, preventive care, grooming or litter, identification and unexpected treatment. Adoption is not a one-time expense; plan for the pet’s entire life."] },
      { title: "Health, sterilisation and Hyderabad considerations", paragraphs: ["Ask for available vaccination, deworming and sterilisation records rather than assuming these are complete. Arrange a consultation with a registered veterinarian to review the pet’s history and recommend care suited to their age and health.", "Hyderabad’s hot periods make shade, ventilation, water and careful timing of outdoor activity important. Plan a safe transport and settling-in routine, and discuss local veterinary options before an urgent need arises."] },
      { title: "Your post-adoption checklist", bullets: ["Save the caregiver’s contact details and all available medical records.", "Book a veterinary consultation and confirm the next care plan.", "Update identification and household contact details.", "Keep the first days calm, establish predictable routines and allow the pet to approach at their own pace.", "Ask for help early if eating, behaviour or health concerns arise."] },
    ],
    related: ["dogs-for-adoption", "cats-for-adoption", "first-30-days-after-adopting-a-dog", "first-30-days-after-adopting-a-cat"],
  },
  {
    slug: "pet-vaccination-guide-hyderabad",
    title: "Pet Vaccination Guide for Hyderabad",
    description:
      "Understand pet vaccination records and questions to ask in Hyderabad. Timing depends on each animal; consult a registered veterinarian for an individual plan.",
    h1: "Pet Vaccination Guide for Hyderabad",
    intro:
      "Vaccination is preventive veterinary care, but no single timetable fits every puppy, kitten or adult pet. This overview helps adopters understand records and prepare questions; it is not a personalised schedule or a substitute for a veterinary examination.",
    sections: [
      { title: "Why a veterinarian should set the schedule", paragraphs: ["Timing and vaccine choices depend on species, age, health, prior vaccination history, local disease risks and the vaccine product. A registered veterinarian should review the pet and determine what is due.", "Do not repeat or skip a dose based only on an online schedule. Bring any cards, certificates or messages from the previous caregiver to the appointment."] },
      { title: "Puppy vaccination schedule", paragraphs: ["Puppies may need a planned series of core vaccinations and later boosters. The starting point and intervals depend on the puppy’s age, health, prior doses, vaccine product and veterinary guidance; this guide intentionally does not prescribe a timetable.", "Take any records to a registered veterinarian and ask what is due next, how to handle an unknown history, and whether temporary precautions are appropriate."] },
      { title: "Kitten vaccination schedule", paragraphs: ["Kittens may need a planned series of core vaccinations and later boosters. Timing depends on age, health, previous doses, vaccine product and veterinary advice; do not apply a generic puppy timetable to a kitten.", "Ask the veterinarian to review available records and write down the next recommended visit. If the history is unknown, explain that rather than guessing at prior doses."] },
      { title: "Core vaccines, rabies and boosters", paragraphs: ["Core vaccines protect against important diseases, while other recommendations depend on an animal’s circumstances and local guidance. Rabies vaccination is a key topic to discuss with a veterinarian in India, including the correct product, timing and documentation.", "Booster needs vary. Ask the veterinarian to write down the next due date and explain how to handle a missed or uncertain dose."] },
      { title: "Deworming and complete records", paragraphs: ["Deworming is separate from vaccination. Product and timing depend on the pet; ask for veterinary advice rather than giving a human medicine or an unverified dose.", "Keep a paper or digital record with the pet’s identity, product name, administration date, clinic and next recommended visit. Share it with future caregivers or boarding providers when needed."] },
      { title: "Adopting a pet with an incomplete history", paragraphs: ["Ask the rescuer for available records and what they know about prior care. Schedule a veterinary check-up and let the veterinarian decide what should happen next. Hyderabad Paws listings are provided by caregivers and are not independent medical verification.", "For evidence-based guidance, see the [WSAVA 2024 vaccination guidelines for dogs and cats](https://wsava.org/global-guidelines/vaccination-guidelines/). They are professional guidance for veterinary teams, not a personal prescription."] },
    ],
    related: ["adopting-a-pet-in-hyderabad", "first-30-days-after-adopting-a-dog", "first-30-days-after-adopting-a-cat"],
    references: [{ label: "WSAVA Vaccination Guidelines", href: "https://wsava.org/global-guidelines/vaccination-guidelines/" }],
  },
  {
    slug: "pet-care-hyderabad-weather",
    title: "Caring for Pets in Hyderabad’s Climate",
    description:
      "Practical hot-weather and monsoon precautions for Hyderabad pet owners, including hydration, safe walks and signs that need urgent veterinary attention.",
    h1: "Caring for Pets in Hyderabad’s Climate",
    intro:
      "Heat and seasonal rain change how pets experience a normal day. Use these practical precautions, adapt them to your pet and home, and contact a veterinarian if you are concerned about their health.",
    sections: [
      { title: "Plan for hot days", paragraphs: ["Keep clean drinking water available and make sure your pet has a shaded, well-ventilated place to rest. Never leave an animal unattended in a parked vehicle or an unventilated area.", "Choose walks and play for cooler hours, reduce strenuous activity on very hot or humid days, and let your pet set the pace. Check pavement temperature and use a shaded route; if a surface feels too hot for your hand, choose another path."] },
      { title: "Hydration, shade and indoor comfort", paragraphs: ["Place water where your pet can reach it and provide more than one cool resting option when practical. Fans or air conditioning can improve comfort, but the room still needs fresh air and a safe temperature.", "Do not force exercise or rely on grooming as a substitute for shade and water. Ask a veterinarian about coat care for your pet’s breed and health rather than shaving a coat without advice."] },
      { title: "Monsoon routines", paragraphs: ["After wet walks, dry your pet and bedding, and check paws for dirt or irritation. Keep food and water clean, and maintain a dry resting area with ventilation.", "Use secure doors, windows and identification during storms or fireworks; frightened pets may bolt. Ask your veterinarian about local parasite prevention based on your pet’s lifestyle."] },
      { title: "Recognise possible heat stress", paragraphs: ["Unusual heavy panting, excessive drooling, weakness, vomiting, confusion, breathing difficulty or collapse can be warning signs of overheating. Move the pet away from heat and contact a veterinary hospital immediately; do not wait for symptoms to pass.", "The [American Animal Hospital Association’s heatstroke guidance](https://www.aaha.org/resources/heatstroke-in-pets/) explains warning signs and prevention. A veterinarian should direct treatment—this article is not an emergency-care substitute."] },
      { title: "Make a household heat-safety plan", bullets: ["Keep a working water bowl and know which rooms stay coolest.", "Walk during cooler hours and shorten or skip strenuous activity during extreme heat.", "Know your regular veterinary clinic and how you would travel there.", "Watch your pet closely; age, health, coat and body shape can affect heat tolerance."] },
    ],
    related: ["dogs-for-adoption", "indie-dogs-for-adoption", "adopting-a-pet-in-hyderabad"],
    references: [{ label: "AAHA: Heatstroke in Pets", href: "https://www.aaha.org/resources/heatstroke-in-pets/" }, { label: "Cornell University: Summer Heat Safety Tips for Dogs", href: "https://www.vet.cornell.edu/departments-centers-and-institutes/riney-canine-health-center/canine-health-topics/summer-heat-safety-tips-dogs" }],
  },
  {
    slug: "diwali-pet-safety",
    title: "Diwali Safety Guide for Pets in Hyderabad",
    description:
      "Help pets feel safer during Diwali in Hyderabad with a quiet indoor space, secure exits, identification and careful handling of festive foods.",
    h1: "Diwali Safety Guide for Pets in Hyderabad",
    intro:
      "Loud, unfamiliar sounds and busy homes can unsettle pets during Diwali. Prepare a calm space ahead of time, prevent accidental escapes and contact your veterinarian for individual anxiety or health concerns.",
    sections: [
      { title: "Set up a quiet indoor safe space", paragraphs: ["Choose a familiar interior room away from doors and windows. Add your pet’s bed, water, familiar toys and a place to hide. Close windows and curtains, and use familiar background sound if your pet finds it calming.", "Let your pet choose whether to hide or seek company. Stay calm and do not punish fearful behaviour or force the pet to watch fireworks."] },
      { title: "Prevent escapes and keep identification current", paragraphs: ["Keep pets indoors during fireworks and secure doors, windows, balconies and gates. Ask visitors to take care when entering or leaving, and check that identification details are current.", "If your pet is microchipped, confirm your contact details are up to date. A collar with identification can also help, if your pet is comfortable wearing one."] },
      { title: "Keep festive foods and decorations out of reach", paragraphs: ["Do not share sweets, rich foods, chocolate, alcohol, or other festive foods unless a veterinarian confirms they are safe. Keep wrappers, candles, diyas, wires and small decorations where curious pets cannot reach them.", "If you think a pet has eaten something harmful or is injured, contact a veterinary clinic promptly and share what was ingested and when. Do not induce vomiting unless a veterinarian instructs you."] },
      { title: "Support a frightened pet", paragraphs: ["Offer access to the safe room and let the pet settle at their own pace. If your pet has a history of severe noise fear, discuss a plan with a veterinarian well before the festival; do not give human medication or sedatives without veterinary direction.", "Do not publish or rely on unverified emergency numbers. Save the contact details of your regular veterinary clinic and identify a nearby emergency veterinary service in advance."] },
    ],
    related: ["pet-care-hyderabad-weather", "adopting-a-pet-in-hyderabad", "first-30-days-after-adopting-a-dog"],
  },
  {
    slug: "first-30-days-after-adopting-a-dog",
    title: "First 30 Days After Adopting a Dog",
    description:
      "A calm first-month plan for a newly adopted dog: settling in, routines, feeding, house training, introductions and veterinary follow-up.",
    h1: "The First 30 Days After Adopting a Dog",
    intro:
      "A move into a new home can be a lot for a dog, even when the match is right. Keep expectations gentle: the first month is for safety, trust and learning what helps this individual dog feel secure.",
    sections: [
      { title: "The first 24 hours: quiet and predictable", paragraphs: ["Prepare a resting area, water, familiar food if available, and a secure route outside for toilet breaks. Keep visitors and introductions limited. Let the dog explore one safe area at a time and do not insist on interaction.", "Ask the caregiver what the dog has been eating and how they usually rest or go outside. Keep identification and a leash secure before opening exterior doors."] },
      { title: "The first week: establish simple routines", paragraphs: ["Use a consistent rhythm for meals, toilet breaks, rest and gentle activity. Reward desired behaviour calmly and supervise rather than expecting the dog to know household rules immediately.", "Avoid busy outings and introductions to many new people at once. Allow sleep and quiet time; contact the caregiver if a known routine or comfort item may help."] },
      { title: "Weeks two to four: build trust gradually", paragraphs: ["Add new experiences at a pace the dog can handle. Use positive reinforcement, short training sessions and calm exposure to everyday sounds. If the dog seems worried, increase distance or return to an easier situation.", "Introduce family members and other pets thoughtfully, with safe separation and supervision. Seek a qualified trainer or veterinary behaviour professional if you need help with persistent fear or difficult behaviour."] },
      { title: "Food, toilet training and veterinary care", paragraphs: ["Make any food transition gradually with veterinary advice, and keep fresh water available. Take the dog out regularly and reward outdoor toileting; accidents are information, not a reason for punishment.", "Book a veterinary consultation, bring all available records and ask about vaccination, parasite prevention, sterilisation, identification and a suitable ongoing care plan. See our [pet vaccination guide](/pet-adoption-guide/pet-vaccination-guide-hyderabad)."] },
      { title: "Common early mistakes to avoid", bullets: ["Giving the dog unrestricted access to the entire home before they are settled.", "Forcing greetings, handling or contact with other animals.", "Changing food suddenly or giving medication without veterinary advice.", "Expecting adult behaviour or perfect house training immediately.", "Leaving doors, balconies or gates unsecured while the dog is learning the home."] },
    ],
    related: ["dogs-for-adoption", "puppies-for-adoption", "pet-vaccination-guide-hyderabad"],
  },
  {
    slug: "first-30-days-after-adopting-a-cat",
    title: "First 30 Days After Adopting a Cat",
    description:
      "A gentle first-month guide for a newly adopted cat, from a safe room and litter setup to introductions, trust and veterinary follow-up.",
    h1: "The First 30 Days After Adopting a Cat",
    intro:
      "Cats vary in how quickly they feel at home. Give a newly adopted cat a predictable, secure starting space and let them control the pace of exploration and contact.",
    sections: [
      { title: "Prepare a safe room", paragraphs: ["Before arrival, choose a quiet room with food, water, a litter box, a comfortable bed, hiding places and a scratching surface. Keep food and water separate from the litter area.", "Secure windows and balconies, remove accessible hazards and make sure the cat cannot slip outside. Start with this room rather than opening the whole home immediately."] },
      { title: "The first days: food, water and litter", paragraphs: ["Offer the food the caregiver says the cat is used to, then ask a veterinarian about any diet changes. Keep fresh water available and place the litter tray in a quiet, accessible location.", "Give the cat space to hide and observe. Sit quietly nearby and allow them to approach; do not pull them from hiding or carry them around to meet people."] },
      { title: "Introduce family members and other pets slowly", paragraphs: ["Let household members enter calmly and avoid crowding the cat. Supervise children and teach them to respect the cat’s resting space and signals.", "For other pets, begin with separation and gradual scent introduction, then move to brief, supervised visual contact only when both animals remain comfortable. Ask the caregiver or veterinarian for help if introductions are difficult."] },
      { title: "Weeks two to four: build confidence", paragraphs: ["When the cat is eating, using the litter and exploring comfortably, allow access to another safe area at a time. Keep a retreat available and maintain a predictable routine.", "Offer play and scratching options that suit the cat. Let the cat decide when handling is welcome, and use calm rewards to build positive associations."] },
      { title: "Veterinary follow-up and common mistakes", paragraphs: ["Arrange a veterinary check-up with any available medical records. Ask about vaccinations, parasite prevention, sterilisation, microchip details and questions specific to the cat’s age and history.", "Avoid forcing contact, allowing outdoor access before you have a safe plan, or changing the cat’s food and environment all at once. Patience helps you learn what this cat needs."] },
    ],
    related: ["cats-for-adoption", "pet-vaccination-guide-hyderabad", "adopting-a-pet-in-hyderabad"],
  },
];

export function getAdoptionCategory(slug: string): AdoptionCategory | undefined {
  return adoptionCategories.find((category) => category.slug === slug);
}

export function getGuideArticle(slug: string): GuideArticle | undefined {
  return guideArticles.find((article) => article.slug === slug);
}
