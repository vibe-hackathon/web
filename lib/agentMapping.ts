/**
 * Agent ID Mapping: A_00 → elon_musk
 * Maps real data agent IDs to frontend agent IDs
 */

export const AGENT_ID_MAP: Record<string, string> = {
  A_00: "elon_musk",
  A_01: "steve_jobs",
  A_02: "mark_zuckerberg",
  A_03: "jeff_bezos",
  A_04: "travis_kalanick",
  A_05: "elizabeth_holmes",
  A_06: "adam_neumann",
  A_07: "peter_thiel",
  A_08: "sam_altman",
  A_09: "alexander_wang",
  A_10: "donald_trump",
  A_11: "vladimir_putin",
  A_12: "xi_jinping",
  A_13: "winston_churchill",
  A_14: "barack_obama",
  A_15: "angela_merkel",
  A_16: "narendra_modi",
  A_17: "volodymyr_zelenskyy",
  A_18: "margaret_thatcher",
  A_19: "joe_biden",
  A_20: "kanye_west",
  A_21: "banksy",
  A_22: "salvador_dali",
  A_23: "andy_warhol",
  A_24: "lady_gaga",
  A_25: "ai_weiwei",
  A_26: "damien_hirst",
  A_27: "marina_abramovic",
  A_28: "yoko_ono",
  A_29: "takashi_murakami",
  A_30: "napoleon_bonaparte",
  A_31: "mahatma_gandhi",
  A_32: "cleopatra",
  A_33: "genghis_khan",
  A_34: "martin_luther_king",
  A_35: "nikola_tesla",
  A_36: "julius_caesar",
  A_37: "qin_shi_huang",
  A_38: "marie_curie",
  A_39: "leonardo_da_vinci",
  A_40: "logan_paul",
  A_41: "jake_paul",
  A_42: "andrew_tate",
  A_43: "belle_delphine",
  A_44: "nikocado_avocado",
  A_45: "addison_rae",
  A_46: "mrbeast",
  A_47: "pokimane",
  A_48: "kim_kardashian",
  A_49: "pewdiepie",
};

// Judge mappings
export const JUDGE_MAP: Record<string, string> = {
  J_01: "judge_1",
  J_02: "judge_2",
  J_03: "judge_3",
  J_04: "judge_4",
  J_05: "judge_5",
};

// Reverse mapping: elon_musk → A_00
export const REVERSE_AGENT_ID_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(AGENT_ID_MAP).map(([k, v]) => [v, k])
);

// Convert A_XX or J_XX to frontend ID
export function toFrontendId(realId: string): string {
  return AGENT_ID_MAP[realId] || JUDGE_MAP[realId] || realId;
}

// Convert frontend ID to A_XX
export function toRealId(frontendId: string): string {
  return REVERSE_AGENT_ID_MAP[frontendId] || frontendId;
}
