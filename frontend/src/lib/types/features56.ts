export type WhatsAppVariant = {
  style: string;
  text: string;
  character_count: number;
  emoji_count: number;
};

export type WhatsAppGenerateResult = {
  voter_id: string;
  full_name: string;
  phone: string;
  gotv_category: string;
  neighborhood: string;
  osint_signals: string[];
  message_variants: {
    variant_a: WhatsAppVariant;
    variant_b: WhatsAppVariant;
    variant_c: WhatsAppVariant;
  };
  best_variant: "variant_a" | "variant_b" | "variant_c";
  recommended_send_time: string;
  personalization_score: number;
  predicted_response_rate: number;
  talking_points: string[];
  compliance: {
    opt_out_available: boolean;
    identifies_sender: boolean;
    gdpr_compliant: boolean;
  };
};

export type TurnoutPredictionResult = {
  prediction_id: string;
  generated_at: string;
  scope: string;
  model: {
    method: string;
    simulations: number;
    confidence_level: number;
    duration_ms: number;
  };
  turnout: {
    predicted: number;
    ci_lower: number;
    ci_upper: number;
    previous_election: number;
    delta: number;
    trend: string;
    distribution: Record<string, number>;
  };
  neighborhood_breakdown: Array<{
    name: string;
    voter_count: number;
    predicted_turnout: number;
    ci_range: [number, number];
    gotv_distribution: Record<string, number>;
    risk_level: string;
    recommendation: string;
  }>;
  gotv_projection: Record<string, number>;
  sensitivity_analysis: Record<string, { turnout?: number; net_gain?: number; net_loss?: number }>;
  osint_correlation: Record<string, string | number>;
  recommendations: Array<{
    action: string;
    target: string;
    urgency: string;
    expected_impact: string;
  }>;
};

export type TurnoutTrendResult = {
  trend: Array<{
    date: string;
    predicted_turnout: number;
    ci_lower: number;
    ci_upper: number;
  }>;
  overall_direction: string;
  volatility: string;
};

export type WhatIfResult = {
  scenario: string;
  baseline_turnout: number;
  scenario_turnout: number;
  net_impact: number;
  confidence: number;
  simulations_run: number;
  new_neighborhood_breakdown: {
    name: string;
    voter_count: number;
    predicted_turnout: number;
    ci_range: [number, number];
    risk_level: string;
  };
};
