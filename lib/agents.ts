import { Agent, AgentCategory } from "./types";

// 25 available Stanford character sprites
const SPRITE_KEYS = [
  "Abigail_Chen", "Adam_Smith", "Arthur_Burton", "Ayesha_Khan",
  "Carlos_Gomez", "Carmen_Ortiz", "Eddy_Lin", "Francisco_Lopez",
  "Giorgio_Rossi", "Hailey_Johnson", "Isabella_Rodriguez", "Jane_Moreno",
  "Jennifer_Moore", "John_Lin", "Klaus_Mueller", "Latoya_Williams",
  "Maria_Lopez", "Mei_Lin", "Rajiv_Patel", "Ryan_Park",
  "Sam_Moore", "Tamara_Taylor", "Tom_Moreno", "Wolfgang_Schulz",
  "Yuriko_Yamamoto",
];

interface AgentDef {
  id: string;
  name: string;
  category: AgentCategory;
}

const DEFS: AgentDef[] = [
  // Tech Entrepreneurs
  { id: "elon_musk", name: "Elon Musk", category: "tech_entrepreneur" },
  { id: "steve_jobs", name: "Steve Jobs", category: "tech_entrepreneur" },
  { id: "mark_zuckerberg", name: "Mark Zuckerberg", category: "tech_entrepreneur" },
  { id: "jeff_bezos", name: "Jeff Bezos", category: "tech_entrepreneur" },
  { id: "travis_kalanick", name: "Travis Kalanick", category: "tech_entrepreneur" },
  { id: "elizabeth_holmes", name: "Elizabeth Holmes", category: "tech_entrepreneur" },
  { id: "adam_neumann", name: "Adam Neumann", category: "tech_entrepreneur" },
  { id: "peter_thiel", name: "Peter Thiel", category: "tech_entrepreneur" },
  { id: "sam_altman", name: "Sam Altman", category: "tech_entrepreneur" },
  { id: "alexander_wang", name: "Alexander Wang", category: "tech_entrepreneur" },
  // Politicians
  { id: "donald_trump", name: "Donald Trump", category: "politician" },
  { id: "vladimir_putin", name: "Vladimir Putin", category: "politician" },
  { id: "xi_jinping", name: "Xi Jinping", category: "politician" },
  { id: "winston_churchill", name: "Winston Churchill", category: "politician" },
  { id: "barack_obama", name: "Barack Obama", category: "politician" },
  { id: "angela_merkel", name: "Angela Merkel", category: "politician" },
  { id: "narendra_modi", name: "Narendra Modi", category: "politician" },
  { id: "volodymyr_zelenskyy", name: "Volodymyr Zelenskyy", category: "politician" },
  { id: "margaret_thatcher", name: "Margaret Thatcher", category: "politician" },
  { id: "joe_biden", name: "Joe Biden", category: "politician" },
  // Artists
  { id: "kanye_west", name: "Kanye West", category: "artist" },
  { id: "banksy", name: "Banksy", category: "artist" },
  { id: "salvador_dali", name: "Salvador Dalí", category: "artist" },
  { id: "andy_warhol", name: "Andy Warhol", category: "artist" },
  { id: "lady_gaga", name: "Lady Gaga", category: "artist" },
  { id: "ai_weiwei", name: "Ai Weiwei", category: "artist" },
  { id: "damien_hirst", name: "Damien Hirst", category: "artist" },
  { id: "marina_abramovic", name: "Marina Abramović", category: "artist" },
  { id: "yoko_ono", name: "Yoko Ono", category: "artist" },
  { id: "takashi_murakami", name: "Takashi Murakami", category: "artist" },
  // Historical Figures
  { id: "napoleon_bonaparte", name: "Napoleon Bonaparte", category: "historical_figure" },
  { id: "mahatma_gandhi", name: "Mahatma Gandhi", category: "historical_figure" },
  { id: "cleopatra", name: "Cleopatra", category: "historical_figure" },
  { id: "genghis_khan", name: "Genghis Khan", category: "historical_figure" },
  { id: "martin_luther_king", name: "Martin Luther King Jr.", category: "historical_figure" },
  { id: "nikola_tesla", name: "Nikola Tesla", category: "historical_figure" },
  { id: "julius_caesar", name: "Julius Caesar", category: "historical_figure" },
  { id: "qin_shi_huang", name: "Qin Shi Huang", category: "historical_figure" },
  { id: "marie_curie", name: "Marie Curie", category: "historical_figure" },
  { id: "leonardo_da_vinci", name: "Leonardo da Vinci", category: "historical_figure" },
  // Influencers
  { id: "logan_paul", name: "Logan Paul", category: "influencer" },
  { id: "jake_paul", name: "Jake Paul", category: "influencer" },
  { id: "andrew_tate", name: "Andrew Tate", category: "influencer" },
  { id: "belle_delphine", name: "Belle Delphine", category: "influencer" },
  { id: "nikocado_avocado", name: "Nikocado Avocado", category: "influencer" },
  { id: "addison_rae", name: "Addison Rae", category: "influencer" },
  { id: "mrbeast", name: "MrBeast", category: "influencer" },
  { id: "pokimane", name: "Pokimane", category: "influencer" },
  { id: "kim_kardashian", name: "Kim Kardashian", category: "influencer" },
  { id: "pewdiepie", name: "PewDiePie", category: "influencer" },
];

export function createInitialAgents(): Record<string, Agent> {
  const agents: Record<string, Agent> = {};
  DEFS.forEach((def, i) => {
    agents[def.id] = {
      ...def,
      spriteKey: SPRITE_KEYS[i % SPRITE_KEYS.length],
      teamId: null,
      profileImage: `/assets/characters/profile/${SPRITE_KEYS[i % SPRITE_KEYS.length]}.png`,
      currentAction: "idle",
      actionDescription: "Arriving at the hackathon",
      pronunciatio: "👋",
      location: "Entrance",
      position: { x: 50, y: 70 },
    };
  });
  return agents;
}

export { DEFS as AGENT_DEFINITIONS, SPRITE_KEYS };
