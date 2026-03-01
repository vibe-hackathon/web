import { Round, RoundAction, Team, HackathonPhase, GroupChat } from "./types";
import { AGENT_DEFINITIONS } from "./agents";

const SNIPPETS: Record<string, string[]> = {
  elon_musk: ["We should build something that goes to Mars.", "What if we use neural networks for this?", "I'll sleep when the hackathon is over."],
  steve_jobs: ["The design has to be insanely great.", "Think about what the user needs.", "Simplicity is the ultimate sophistication."],
  mark_zuckerberg: ["We need to connect people at scale.", "Move fast and break things.", "The metaverse is the future."],
  jeff_bezos: ["It's always Day 1.", "Start with the customer and work backwards.", "We need a two-pizza team for this."],
  travis_kalanick: ["We need to disrupt this market.", "Growth at all costs.", "Let's hustle harder than everyone."],
  elizabeth_holmes: ["This will change healthcare forever.", "The technology is revolutionary.", "Trust the vision."],
  adam_neumann: ["We're not just building an app, we're elevating consciousness.", "Community is everything.", "This is a trillion dollar idea."],
  peter_thiel: ["What important truth do few people agree with you on?", "Competition is for losers.", "We need a monopoly strategy."],
  sam_altman: ["AGI will solve this problem eventually.", "Let's think about alignment.", "Ship fast, iterate faster."],
  alexander_wang: ["Data quality is everything.", "We need to scale the labeling pipeline.", "AI infrastructure is the real opportunity."],
  donald_trump: ["This is going to be tremendous, believe me.", "Nobody builds better apps than me.", "We're winning this, big league."],
  vladimir_putin: ["Strategic patience is key.", "We must control the infrastructure.", "Security first, always."],
  xi_jinping: ["We must think long-term.", "Technology self-reliance is critical.", "Harmony in the team is essential."],
  winston_churchill: ["Never give in, never surrender.", "We shall fight on the keyboards.", "Success is stumbling from failure to failure."],
  barack_obama: ["Yes we can build this.", "Let me be clear about our approach.", "Hope is a good engineering principle."],
  angela_merkel: ["We need a systematic approach.", "Let's analyze the data first.", "Pragmatism over ideology."],
  narendra_modi: ["Digital transformation is our mission.", "Make in Hackathon!", "Innovation with purpose."],
  volodymyr_zelenskyy: ["We fight for every feature.", "I need code, not a ride.", "Resilience is our strength."],
  margaret_thatcher: ["The lady is not for pivoting.", "There is no alternative.", "We need conviction, not consensus."],
  joe_biden: ["Here's the deal, folks.", "Let's build back better.", "Come on, man, let's ship this."],
  kanye_west: ["I am a creative genius.", "This UI needs to be art. Pure art.", "No one man should have all that code."],
  banksy: ["The best art is anonymous code.", "Destroy the conventional UI.", "Make them think."],
  salvador_dali: ["The only difference between me and a madman is I am not mad.", "Surreal UX is the future.", "Persistence of memory... and cache."],
  andy_warhol: ["In the future, every app will be famous for 15 minutes.", "Pop art meets pop-up notifications.", "Repetition is key."],
  lady_gaga: ["Born this way, coded this way.", "Let's make something that slaps.", "Poker face while debugging."],
  ai_weiwei: ["Art is activism, code is revolution.", "Question everything about this design.", "Freedom of expression in every pixel."],
  damien_hirst: ["The physical impossibility of shipping on time.", "Art should provoke.", "Dots. Lots of dots in the UI."],
  marina_abramovic: ["The artist is present... at the standup.", "Endurance is key to hackathons.", "Performance art meets performance optimization."],
  yoko_ono: ["Imagine all the users.", "Peace and love in every commit.", "Cut. Piece by piece."],
  takashi_murakami: ["Superflat design philosophy.", "Kawaii meets functionality.", "Flowers everywhere in the UI."],
  napoleon_bonaparte: ["Strategy is everything.", "Divide the problem, conquer each part.", "Victory belongs to the most persevering."],
  mahatma_gandhi: ["Be the change you wish to see in the codebase.", "Non-violent refactoring.", "Simplicity is the essence of universality."],
  cleopatra: ["I will not be triumphed over.", "Charm the users.", "Rule the leaderboard."],
  genghis_khan: ["Conquer the entire problem space.", "Unite all the microservices.", "Speed and adaptability."],
  martin_luther_king: ["I have a dream... of zero bugs.", "Injustice anywhere is a bug everywhere.", "The arc of code bends toward correctness."],
  nikola_tesla: ["The present is theirs, the future is mine.", "Alternating between frontend and backend.", "Wireless everything."],
  julius_caesar: ["Veni, vidi, codi.", "Beware the Ides of deployment.", "I came, I saw, I committed."],
  qin_shi_huang: ["Unify all the codebases.", "Build a Great Firewall... component.", "Standardize everything."],
  marie_curie: ["Nothing in code is to be feared, only understood.", "Radioactive debugging energy.", "Two Nobel prizes worth of effort."],
  leonardo_da_vinci: ["The noblest pleasure is understanding.", "Art and engineering are one.", "I've been thinking about flying machines... I mean drones."],
  logan_paul: ["SMASH that deploy button!", "This is going to break the internet.", "Content is king, code is queen."],
  jake_paul: ["It's everyday bro with the coding flow.", "Let's make this go viral.", "Problem? What problem?"],
  andrew_tate: ["Top G energy in this hackathon.", "Escape the matrix... literally.", "Winners don't sleep."],
  belle_delphine: ["Selling bathwater... as a service.", "The aesthetic is everything.", "UwU let's code."],
  nikocado_avocado: ["I'm having a breakdown... through!", "This is fine. Everything is fine.", "More features! MORE!"],
  addison_rae: ["Let's make this TikTok-worthy.", "The vibes are immaculate.", "Dance break then code."],
  mrbeast: ["What if we gave $10K to whoever uses our app?", "This needs to go viral.", "Most insane hackathon project ever."],
  pokimane: ["Chat, what should we build?", "Let's be wholesome about this.", "GG, let's ship it."],
  kim_kardashian: ["This app needs to break the internet.", "The branding has to be iconic.", "Study for the bar... chart component."],
  pewdiepie: ["Big brain time.", "Floor gang code review.", "Subscribe to our API."],
};

const GENERIC = [
  "I think we should approach this differently.",
  "That's an interesting perspective.",
  "We need to focus on the core value proposition.",
  "Has anyone considered scalability?",
  "Let's prototype quickly and iterate.",
  "I have an idea that might work...",
  "The technical architecture needs more thought.",
  "What's our competitive advantage?",
];

const EMOJIS: Record<string, string[]> = {
  speak: ["💬", "🗣️", "💭", "📢"],
  think: ["🤔", "💡", "🧠", "✨"],
  code: ["💻", "⌨️", "🔧", "📝"],
  present: ["🎤", "📊", "🏆", "🎯"],
  idle: ["😴", "☕", "👀", "🫠"],
  move: ["🚶", "👟", "➡️", "🏃"],
};

const PROJECT_IDEAS = [
  "AI-Powered Meme Generator that predicts viral trends",
  "Decentralized Social Credit System on blockchain",
  "AR Navigation for finding the best street food",
  "Neural Network that writes political speeches",
  "AI Art Critic that roasts your artwork",
  "Stock predictor based on tweet sentiment",
  "VR Time Travel to historical events",
  "AI Personal Stylist via mood detection",
  "Gamified Carbon Offset Marketplace",
  "AI Debate Platform for philosophy arguments",
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function getSnippet(id: string): string {
  return pick(SNIPPETS[id] ?? GENERIC);
}

export function getPhaseForRound(r: number): HackathonPhase {
  if (r <= 12) return "free_discussion";
  if (r <= 24) return "group_brainstorm";
  if (r <= 40) return "development";
  return "results";
}

export function generateTeams(): Record<string, Team> {
  const teams: Record<string, Team> = {};
  const ids = AGENT_DEFINITIONS.map((a) => a.id);
  // Deterministic shuffle with seed
  const shuffled = [...ids].sort((a, b) => a.localeCompare(b));
  for (let i = 0; i < 10; i++) {
    const teamId = `team_${i + 1}`;
    teams[teamId] = {
      id: teamId,
      name: `Team ${i + 1}`,
      memberIds: shuffled.slice(i * 5, (i + 1) * 5),
      projectIdea: PROJECT_IDEAS[i],
      projectPlan: null,
      projectOutput: null,
      techStack: null,
    };
  }
  return teams;
}

export function generateAllRounds(teams: Record<string, Team>): Round[] {
  const rounds: Round[] = [];
  const agentIds = AGENT_DEFINITIONS.map((a) => a.id);

  const agentTeamMap: Record<string, string> = {};
  Object.values(teams).forEach((team) => {
    team.memberIds.forEach((id) => { agentTeamMap[id] = team.id; });
  });

  for (let rn = 1; rn <= 50; rn++) {
    const phase = getPhaseForRound(rn);
    const actions: RoundAction[] = [];
    const hour = 9 + Math.floor((rn - 1) / 3);
    const minute = ((rn - 1) % 3) * 20;
    const timestamp = `${hour}:${minute.toString().padStart(2, "0")} AM`;

    for (let i = 0; i < agentIds.length; i++) {
      const agentId = agentIds[i];
      const teamMembers = Object.values(teams)
        .find((t) => t.memberIds.includes(agentId))
        ?.memberIds.filter((id) => id !== agentId) ?? [];
      const roll = Math.random();

      let action: RoundAction;

      if (phase === "free_discussion") {
        if (roll < 0.6) {
          const ti = (i + 1 + Math.floor(Math.random() * 4)) % agentIds.length;
          action = { agentId, type: "speak", description: `Chatting with ${AGENT_DEFINITIONS[ti].name}`, pronunciatio: pick(EMOJIS.speak), targetAgentIds: [agentIds[ti]], chatContent: getSnippet(agentId), location: "Common Area" };
        } else if (roll < 0.8) {
          action = { agentId, type: "think", description: "Thinking about project ideas...", pronunciatio: pick(EMOJIS.think), location: "Walkway" };
        } else if (roll < 0.9) {
          action = { agentId, type: "move", description: "Walking around the venue", pronunciatio: pick(EMOJIS.move), location: "Moving" };
        } else {
          action = { agentId, type: "idle", description: "Getting coffee", pronunciatio: pick(EMOJIS.idle), location: "Cafe" };
        }
      } else if (phase === "group_brainstorm") {
        if (roll < 0.7 && teamMembers.length > 0) {
          action = { agentId, type: "speak", description: "Brainstorming with team", pronunciatio: pick(EMOJIS.speak), targetAgentIds: teamMembers, chatContent: getSnippet(agentId), location: "Team Area" };
        } else if (roll < 0.9) {
          action = { agentId, type: "think", description: "Refining the project concept", pronunciatio: pick(EMOJIS.think), location: "Team Area" };
        } else {
          action = { agentId, type: "idle", description: "Taking a short break", pronunciatio: pick(EMOJIS.idle), location: "Team Area" };
        }
      } else if (phase === "development") {
        if (roll < 0.4) {
          action = { agentId, type: "code", description: "Writing code for the project", pronunciatio: pick(EMOJIS.code), location: "Workspace" };
        } else if (roll < 0.8 && teamMembers.length > 0) {
          action = { agentId, type: "speak", description: "Discussing implementation", pronunciatio: pick(EMOJIS.speak), targetAgentIds: [pick(teamMembers)], chatContent: getSnippet(agentId), location: "Workspace" };
        } else if (roll < 0.9) {
          action = { agentId, type: "think", description: "Debugging a tricky issue", pronunciatio: pick(EMOJIS.think), location: "Workspace" };
        } else {
          action = { agentId, type: "idle", description: "Taking a mental break", pronunciatio: pick(EMOJIS.idle), location: "Workspace" };
        }
      } else {
        if (roll < 0.5) {
          action = { agentId, type: "present", description: "Presenting team project", pronunciatio: pick(EMOJIS.present), location: "Main Stage" };
        } else if (roll < 0.8) {
          action = { agentId, type: "speak", description: "Discussing presentations", pronunciatio: pick(EMOJIS.speak), chatContent: getSnippet(agentId), location: "Audience" };
        } else {
          action = { agentId, type: "idle", description: "Watching presentations", pronunciatio: "👏", location: "Audience" };
        }
      }

      actions.push(action);
    }

    rounds.push({ number: rn, phase, actions, groupChats: [], timestamp });
  }

  return rounds;
}
