export type Locality = {
  slug: string;
  name: string;
  title: string;
  description: string;
  intro: string;
};

export const localities: Locality[] = [
  {
    slug: "gachibowli",
    name: "Gachibowli",
    title: "Dog & Cat Adoption in Gachibowli, Hyderabad",
    description: "Meet dogs and cats available for adoption in Gachibowli, Hyderabad. Browse local rescue profiles and find a companion near you.",
    intro: "Looking to adopt a pet in Gachibowli? Hyderabad Paws brings together profiles shared by local shelters and independent rescuers, so you can begin your search close to home. This busy west Hyderabad neighbourhood has apartment communities, quiet residential lanes, parks, and plenty of people who enjoy having a companion alongside everyday life. Each animal has their own rhythm: some are ready for a lively household, while others need a calm introduction and time to settle. Read the available pet profiles, learn what the rescue knows about their age, health, and temperament, and send an adoption enquiry directly from the pet’s page. A thoughtful match considers your routine, your home, and the animal’s needs. Before adopting, speak with the caregiver, arrange a suitable meeting, and make sure everyone in your household is ready for long-term care. Start with the Gachibowli listings below, or browse all Hyderabad pets if you are open to meeting a friend from another neighbourhood.",
  },
  {
    slug: "hitech-city",
    name: "Hitech City",
    title: "Adopt a Dog or Cat in Hitech City, Hyderabad",
    description: "Find a rescue dog or cat for adoption near Hitech City. Meet Hyderabad pets and connect with their local caregivers.",
    intro: "Hitech City moves quickly, but bringing an animal into your life is a decision worth making at a gentle pace. Hyderabad Paws helps residents around this technology and business district discover dogs and cats currently cared for by nearby rescuers. Consider the hours you work, the time you can offer for exercise or play, building pet policies, and whether someone will be home during the day. A good match is about more than distance: it is about finding an animal whose needs fit your household and offering support as they adjust. The profiles below share the details currently available from each caregiver, including neighbourhood, age, size, and health notes. If a pet catches your eye, open their profile and tell the rescue about your home and routine. Ask questions, plan a calm introduction, and confirm any care needs before deciding. If there are no suitable listings in Hitech City today, check back later or explore nearby Hyderabad areas. The right companion is worth a little patience.",
  },
  {
    slug: "madhapur",
    name: "Madhapur",
    title: "Pet Adoption in Madhapur, Hyderabad",
    description: "Browse adoptable pets in Madhapur, Hyderabad. Connect with local rescuers and take the first step towards adoption.",
    intro: "A new companion can make Madhapur feel even more like home. Hyderabad Paws shares adoption profiles from local shelters and independent rescuers, helping people meet dogs and cats that need a caring family. Every pet arrives with a distinct personality and history, so give each profile a thoughtful read rather than choosing by appearance alone. Think about your household’s activity level, available space, travel plans, and the time needed for daily care. These practical details help a rescue guide you towards a sustainable match. The listings on this page show pets currently marked available in Madhapur; information is provided by the people looking after them and can change as adoption conversations progress. Visit a pet’s page to learn their story and submit an enquiry. The caregiver can explain what the animal enjoys, what support they may need, and how to arrange a safe first meeting. Adoption is a lifelong commitment, but it begins with one friendly conversation. Browse the local profiles below and meet the pet who might be your next best friend.",
  },
  {
    slug: "kondapur",
    name: "Kondapur",
    title: "Adopt a Pet in Kondapur, Hyderabad",
    description: "Meet rescue dogs and cats available for adoption in Kondapur, Hyderabad. Find a companion and contact their caregiver.",
    intro: "Kondapur is home to families, professionals, and people who know how much joy an animal can bring to everyday life. Hyderabad Paws makes it easier to find local adoption profiles shared by shelters and independent rescuers. Before you apply, consider the kind of companionship you can provide: a young pet may need patient training and play, while an adult animal may already have settled routines. Check with your apartment association or landlord about pet rules, and think through veterinary care, exercise, and holiday plans. Each profile includes the details currently known by the caregiver; an open conversation helps fill in the rest. Explore the pets listed for Kondapur below, choose a profile that interests you, and send a note about your household. The rescue team can talk through the pet’s temperament and arrange a suitable introduction. If your ideal match is not listed right now, nearby areas may have a companion who fits your life just as well. Take your time: a caring, lasting home is the goal.",
  },
  {
    slug: "banjara-hills",
    name: "Banjara Hills",
    title: "Dog & Cat Adoption in Banjara Hills, Hyderabad",
    description: "Discover dogs and cats for adoption around Banjara Hills. Explore local pet profiles from Hyderabad rescuers.",
    intro: "Thinking about adopting in Banjara Hills? Hyderabad Paws helps you discover pets cared for by Hyderabad’s local rescue community. The best adoption starts with curiosity and honest expectations. Consider who lives at home, whether there are children or other animals, how much daily activity you can offer, and how you will handle medical care over time. Some pets love new people straight away; others need a quieter introduction and a little space to build trust. The profiles below describe each animal as shared by their current caregiver, giving you a starting point for the questions that matter. Open a pet’s page to read more, then send an enquiry that tells the rescue about your home and routine. They can provide further context and help plan a safe meet-and-greet. Adoption is not a purchase or a quick decision: it is a promise to care for another life for years to come. Browse the available Banjara Hills pets and begin with a conversation when one feels like a promising fit.",
  },
  {
    slug: "secunderabad",
    name: "Secunderabad",
    title: "Pet Adoption in Secunderabad, Hyderabad",
    description: "Find adoptable dogs and cats in Secunderabad. Meet local rescue pets and contact their caregivers through Hyderabad Paws.",
    intro: "There are wonderful companions waiting for homes across Secunderabad. Hyderabad Paws connects prospective adopters with profiles from local shelters and independent rescuers, making it easier to start nearby. Before welcoming a pet, picture an ordinary week in your household: feeding, walks or enrichment, veterinary visits, and time for a new animal to feel safe. If you rent or live in a shared community, confirm that pets are welcome. These details help you and the rescue decide whether a match can thrive long term. The Secunderabad listings below include the information currently available for each pet, but a conversation with their caregiver is the best way to learn about habits, preferences, and any extra care needed. Select a profile to read more and send an adoption enquiry. You do not need to know everything before reaching out; thoughtful questions are a good beginning. If no profile feels right today, explore other parts of Hyderabad or return as new pets are added. A careful match makes a kinder start for everyone.",
  },
];

export function getLocality(slug: string): Locality | undefined {
  return localities.find((locality) => locality.slug === slug);
}
