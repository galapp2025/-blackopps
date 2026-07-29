export type PsychoBigFive = {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
};

export type PsychoProfileResult = {
  voter_id: string;
  full_name: string;
  age: number;
  neighborhood: string;
  gotv_category: string;
  confidence: number;
  osint_signals_used: string[];
  generated_at: string;
  profile: {
    socio_economic: {
      tier: number;
      estimated_income_range: string;
      likely_profession: string;
      education_level: string;
      housing_status: string;
      lifestyle_indicators: string[];
    };
    personality: {
      big_five: PsychoBigFive;
      dominant_traits: string[];
      communication_style: string;
      decision_style: string;
    };
    persuasion: {
      primary_lever: string;
      secondary_lever: string;
      emotional_triggers: string[];
      core_values: string[];
      loss_aversion_sensitivity: number;
      social_proof_weight: number;
      authority_weight: number;
      scarcity_weight: number;
      reciprocity_weight: number;
    };
    loyalty: {
      loyalty_score: number;
      volatility_score: number;
      influenceability_score: number;
      retention_risk: string;
      sway_direction: string;
    };
    recommended_approach: {
      tone: string;
      best_channel: string;
      opening_strategy: string;
      topics_to_emphasize: string[];
      topics_to_avoid: string[];
      call_to_action: string;
    };
  };
};

export type WriterFormatKey = "private_message" | "general_message" | "social_post_fb" | "social_post_x";

export type WriterFormatPayload = {
  format: string;
  text: string;
  character_count: number;
  tone: string;
  target_emotion: string;
  persuasion_lever_used: string;
  engagement_score: number;
};

export type WriterGenerateResult = {
  voter_id: string;
  full_name: string;
  gotv_category: string;
  neighborhood: string;
  psychological_profile: {
    dominant_trait: string;
    communication_style: string;
    primary_lever: string;
    emotional_triggers: string[];
  };
  formats: Partial<Record<WriterFormatKey, WriterFormatPayload>>;
  best_format: WriterFormatKey;
  campaign_topic: string;
  campaign_id?: string;
  generated_at: string;
};

export type WriterCompareResult = {
  voter_id: string;
  formats: Partial<Record<WriterFormatKey, { text: string; engagement_score: number; format?: string }>>;
  recommendation: string;
  recommendation_he?: string;
};
