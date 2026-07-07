export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      achievement_progress: {
        Row: {
          created_at: string;
          current_value: number;
          first_unlocked_at: string | null;
          id: string;
          mission_id: string;
          profile_id: string;
          stage_claimed: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          current_value?: number;
          first_unlocked_at?: string | null;
          id?: string;
          mission_id: string;
          profile_id: string;
          stage_claimed?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          current_value?: number;
          first_unlocked_at?: string | null;
          id?: string;
          mission_id?: string;
          profile_id?: string;
          stage_claimed?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'achievement_progress_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      card_favorites: {
        Row: {
          card_id: string;
          created_at: string;
          profile_id: string;
        };
        Insert: {
          card_id: string;
          created_at?: string;
          profile_id: string;
        };
        Update: {
          card_id?: string;
          created_at?: string;
          profile_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'card_favorites_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      card_mastery: {
        Row: {
          card_id: string;
          created_at: string;
          id: string;
          mastery_level: number;
          profile_id: string;
          updated_at: string;
          xp: number;
        };
        Insert: {
          card_id: string;
          created_at?: string;
          id?: string;
          mastery_level?: number;
          profile_id: string;
          updated_at?: string;
          xp?: number;
        };
        Update: {
          card_id?: string;
          created_at?: string;
          id?: string;
          mastery_level?: number;
          profile_id?: string;
          updated_at?: string;
          xp?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'card_mastery_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      cards: {
        Row: {
          artwork_url: string | null;
          attributes: Json;
          code_id: string | null;
          created_at: string;
          edition_code: string;
          id: string;
          is_active: boolean;
          overall: number;
          player_id: string;
          rarity_id: number;
        };
        Insert: {
          artwork_url?: string | null;
          attributes: Json;
          code_id?: string | null;
          created_at?: string;
          edition_code?: string;
          id?: string;
          is_active?: boolean;
          overall: number;
          player_id: string;
          rarity_id: number;
        };
        Update: {
          artwork_url?: string | null;
          attributes?: Json;
          code_id?: string | null;
          created_at?: string;
          edition_code?: string;
          id?: string;
          is_active?: boolean;
          overall?: number;
          player_id?: string;
          rarity_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'cards_player_id_fkey';
            columns: ['player_id'];
            isOneToOne: false;
            referencedRelation: 'players';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cards_rarity_id_fkey';
            columns: ['rarity_id'];
            isOneToOne: false;
            referencedRelation: 'rarities';
            referencedColumns: ['id'];
          },
        ];
      };
      collection_progress: {
        Row: {
          collection_set_id: string;
          completed_at: string | null;
          profile_id: string;
        };
        Insert: {
          collection_set_id: string;
          completed_at?: string | null;
          profile_id: string;
        };
        Update: {
          collection_set_id?: string;
          completed_at?: string | null;
          profile_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'collection_progress_collection_set_id_fkey';
            columns: ['collection_set_id'];
            isOneToOne: false;
            referencedRelation: 'collection_sets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'collection_progress_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      collection_sets: {
        Row: {
          code: string;
          description: string;
          icon: string;
          id: string;
          name: string;
          required_card_ids: string[];
          reward_pack_id: string | null;
          reward_soft_currency: number;
          sort_order: number;
          theme: string;
        };
        Insert: {
          code: string;
          description?: string;
          icon?: string;
          id?: string;
          name: string;
          required_card_ids: string[];
          reward_pack_id?: string | null;
          reward_soft_currency?: number;
          sort_order?: number;
          theme?: string;
        };
        Update: {
          code?: string;
          description?: string;
          icon?: string;
          id?: string;
          name?: string;
          required_card_ids?: string[];
          reward_pack_id?: string | null;
          reward_soft_currency?: number;
          sort_order?: number;
          theme?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'collection_sets_reward_pack_id_fkey';
            columns: ['reward_pack_id'];
            isOneToOne: false;
            referencedRelation: 'packs';
            referencedColumns: ['id'];
          },
        ];
      };
      craft_requests: {
        Row: {
          created_at: string;
          fragment_cost: number;
          id: string;
          idempotency_key: string | null;
          profile_id: string;
          resulting_user_card_id: string | null;
          status: string;
          target_card_id: string;
        };
        Insert: {
          created_at?: string;
          fragment_cost: number;
          id?: string;
          idempotency_key?: string | null;
          profile_id: string;
          resulting_user_card_id?: string | null;
          status?: string;
          target_card_id: string;
        };
        Update: {
          created_at?: string;
          fragment_cost?: number;
          id?: string;
          idempotency_key?: string | null;
          profile_id?: string;
          resulting_user_card_id?: string | null;
          status?: string;
          target_card_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'craft_requests_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'craft_requests_resulting_user_card_id_fkey';
            columns: ['resulting_user_card_id'];
            isOneToOne: false;
            referencedRelation: 'user_cards';
            referencedColumns: ['id'];
          },
        ];
      };
      daily_login: {
        Row: {
          created_at: string;
          current_day: number;
          last_claim_at: string | null;
          profile_id: string;
          streak_days: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          current_day?: number;
          last_claim_at?: string | null;
          profile_id: string;
          streak_days?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          current_day?: number;
          last_claim_at?: string | null;
          profile_id?: string;
          streak_days?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'daily_login_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      friendships: {
        Row: {
          addressee_id: string;
          created_at: string;
          id: string;
          requester_id: string;
          status: string;
        };
        Insert: {
          addressee_id: string;
          created_at?: string;
          id?: string;
          requester_id: string;
          status?: string;
        };
        Update: {
          addressee_id?: string;
          created_at?: string;
          id?: string;
          requester_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'friendships_addressee_id_fkey';
            columns: ['addressee_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'friendships_requester_id_fkey';
            columns: ['requester_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      league_members: {
        Row: {
          draws: number;
          goals_against: number;
          goals_for: number;
          group_label: string | null;
          id: string;
          league_id: string;
          losses: number;
          points: number;
          profile_id: string;
          squad_id: string | null;
          wins: number;
        };
        Insert: {
          draws?: number;
          goals_against?: number;
          goals_for?: number;
          group_label?: string | null;
          id?: string;
          league_id: string;
          losses?: number;
          points?: number;
          profile_id: string;
          squad_id?: string | null;
          wins?: number;
        };
        Update: {
          draws?: number;
          goals_against?: number;
          goals_for?: number;
          group_label?: string | null;
          id?: string;
          league_id?: string;
          losses?: number;
          points?: number;
          profile_id?: string;
          squad_id?: string | null;
          wins?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'league_members_league_id_fkey';
            columns: ['league_id'];
            isOneToOne: false;
            referencedRelation: 'leagues';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'league_members_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'league_members_squad_id_fkey';
            columns: ['squad_id'];
            isOneToOne: false;
            referencedRelation: 'squads';
            referencedColumns: ['id'];
          },
        ];
      };
      league_rounds: {
        Row: {
          id: string;
          league_id: string;
          processed_at: string | null;
          round_number: number;
          scheduled_at: string | null;
          stage: string;
          status: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          processed_at?: string | null;
          round_number: number;
          scheduled_at?: string | null;
          stage?: string;
          status?: string;
        };
        Update: {
          id?: string;
          league_id?: string;
          processed_at?: string | null;
          round_number?: number;
          scheduled_at?: string | null;
          stage?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'league_rounds_league_id_fkey';
            columns: ['league_id'];
            isOneToOne: false;
            referencedRelation: 'leagues';
            referencedColumns: ['id'];
          },
        ];
      };
      leagues: {
        Row: {
          created_at: string;
          format: string;
          id: string;
          invite_code: string | null;
          max_members: number;
          name: string;
          owner_profile_id: string | null;
          season_id: string | null;
          status: string;
          type: string;
        };
        Insert: {
          created_at?: string;
          format: string;
          id?: string;
          invite_code?: string | null;
          max_members?: number;
          name: string;
          owner_profile_id?: string | null;
          season_id?: string | null;
          status?: string;
          type: string;
        };
        Update: {
          created_at?: string;
          format?: string;
          id?: string;
          invite_code?: string | null;
          max_members?: number;
          name?: string;
          owner_profile_id?: string | null;
          season_id?: string | null;
          status?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'leagues_owner_profile_id_fkey';
            columns: ['owner_profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'leagues_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'seasons';
            referencedColumns: ['id'];
          },
        ];
      };
      match_events: {
        Row: {
          description: string;
          event_type: string;
          id: number;
          match_id: string;
          meta: Json;
          minute: number;
          primary_user_card_id: string | null;
          secondary_user_card_id: string | null;
          team_side: string;
        };
        Insert: {
          description: string;
          event_type: string;
          id?: number;
          match_id: string;
          meta?: Json;
          minute: number;
          primary_user_card_id?: string | null;
          secondary_user_card_id?: string | null;
          team_side: string;
        };
        Update: {
          description?: string;
          event_type?: string;
          id?: number;
          match_id?: string;
          meta?: Json;
          minute?: number;
          primary_user_card_id?: string | null;
          secondary_user_card_id?: string | null;
          team_side?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'match_events_match_id_fkey';
            columns: ['match_id'];
            isOneToOne: false;
            referencedRelation: 'matches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'match_events_primary_user_card_id_fkey';
            columns: ['primary_user_card_id'];
            isOneToOne: false;
            referencedRelation: 'user_cards';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'match_events_secondary_user_card_id_fkey';
            columns: ['secondary_user_card_id'];
            isOneToOne: false;
            referencedRelation: 'user_cards';
            referencedColumns: ['id'];
          },
        ];
      };
      matches: {
        Row: {
          away_profile_id: string | null;
          away_score: number | null;
          away_squad_id: string;
          created_at: string;
          engine_version: string;
          home_profile_id: string | null;
          home_score: number | null;
          home_squad_id: string;
          id: string;
          league_round_id: string | null;
          rng_seed: number;
          simulated_at: string | null;
          status: string;
        };
        Insert: {
          away_profile_id?: string | null;
          away_score?: number | null;
          away_squad_id: string;
          created_at?: string;
          engine_version: string;
          home_profile_id?: string | null;
          home_score?: number | null;
          home_squad_id: string;
          id?: string;
          league_round_id?: string | null;
          rng_seed: number;
          simulated_at?: string | null;
          status?: string;
        };
        Update: {
          away_profile_id?: string | null;
          away_score?: number | null;
          away_squad_id?: string;
          created_at?: string;
          engine_version?: string;
          home_profile_id?: string | null;
          home_score?: number | null;
          home_squad_id?: string;
          id?: string;
          league_round_id?: string | null;
          rng_seed?: number;
          simulated_at?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'matches_away_profile_id_fkey';
            columns: ['away_profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_away_squad_id_fkey';
            columns: ['away_squad_id'];
            isOneToOne: false;
            referencedRelation: 'squads';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_home_profile_id_fkey';
            columns: ['home_profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_home_squad_id_fkey';
            columns: ['home_squad_id'];
            isOneToOne: false;
            referencedRelation: 'squads';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_league_round_id_fkey';
            columns: ['league_round_id'];
            isOneToOne: false;
            referencedRelation: 'league_rounds';
            referencedColumns: ['id'];
          },
        ];
      };
      mission_progress: {
        Row: {
          claimed_at: string | null;
          created_at: string;
          current_value: number;
          id: string;
          mission_id: string;
          period_key: string;
          profile_id: string;
          updated_at: string;
        };
        Insert: {
          claimed_at?: string | null;
          created_at?: string;
          current_value?: number;
          id?: string;
          mission_id: string;
          period_key: string;
          profile_id: string;
          updated_at?: string;
        };
        Update: {
          claimed_at?: string | null;
          created_at?: string;
          current_value?: number;
          id?: string;
          mission_id?: string;
          period_key?: string;
          profile_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'mission_progress_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      pack_opening_cards: {
        Row: {
          card_id: string;
          id: number;
          pack_opening_id: string;
          user_card_id: string;
        };
        Insert: {
          card_id: string;
          id?: number;
          pack_opening_id: string;
          user_card_id: string;
        };
        Update: {
          card_id?: string;
          id?: number;
          pack_opening_id?: string;
          user_card_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'pack_opening_cards_pack_opening_id_fkey';
            columns: ['pack_opening_id'];
            isOneToOne: false;
            referencedRelation: 'pack_openings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pack_opening_cards_user_card_id_fkey';
            columns: ['user_card_id'];
            isOneToOne: false;
            referencedRelation: 'user_cards';
            referencedColumns: ['id'];
          },
        ];
      };
      pack_openings: {
        Row: {
          id: string;
          opened_at: string;
          pack_id: string;
          profile_id: string;
          rng_seed: number;
        };
        Insert: {
          id?: string;
          opened_at?: string;
          pack_id: string;
          profile_id: string;
          rng_seed: number;
        };
        Update: {
          id?: string;
          opened_at?: string;
          pack_id?: string;
          profile_id?: string;
          rng_seed?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'pack_openings_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      packs: {
        Row: {
          available_from: string | null;
          available_to: string | null;
          cards_per_pack: number;
          code: string;
          drop_table: Json;
          id: string;
          is_purchasable: boolean;
          name: string;
          price_hard: number | null;
          price_soft: number | null;
        };
        Insert: {
          available_from?: string | null;
          available_to?: string | null;
          cards_per_pack?: number;
          code: string;
          drop_table: Json;
          id?: string;
          is_purchasable?: boolean;
          name: string;
          price_hard?: number | null;
          price_soft?: number | null;
        };
        Update: {
          available_from?: string | null;
          available_to?: string | null;
          cards_per_pack?: number;
          code?: string;
          drop_table?: Json;
          id?: string;
          is_purchasable?: boolean;
          name?: string;
          price_hard?: number | null;
          price_soft?: number | null;
        };
        Relationships: [];
      };
      pity_counters: {
        Row: {
          pack_count: number;
          pity_type: string;
          profile_id: string;
          updated_at: string;
        };
        Insert: {
          pack_count?: number;
          pity_type: string;
          profile_id: string;
          updated_at?: string;
        };
        Update: {
          pack_count?: number;
          pity_type?: string;
          profile_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'pity_counters_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      player_trophies: {
        Row: {
          achievement_id: string;
          id: string;
          profile_id: string;
          reward_claimed: boolean;
          unlocked_at: string;
        };
        Insert: {
          achievement_id: string;
          id?: string;
          profile_id: string;
          reward_claimed?: boolean;
          unlocked_at?: string;
        };
        Update: {
          achievement_id?: string;
          id?: string;
          profile_id?: string;
          reward_claimed?: boolean;
          unlocked_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'player_trophies_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      players: {
        Row: {
          base_attributes: Json;
          bio_short: string | null;
          birth_year: number | null;
          created_at: string;
          era_end: number | null;
          era_start: number | null;
          full_name: string;
          height_cm: number | null;
          id: string;
          known_as: string;
          nationality_code: string;
          preferred_foot: string | null;
          primary_position: string;
          secondary_positions: string[];
          slug: string | null;
          source_notes: string | null;
        };
        Insert: {
          base_attributes: Json;
          bio_short?: string | null;
          birth_year?: number | null;
          created_at?: string;
          era_end?: number | null;
          era_start?: number | null;
          full_name: string;
          height_cm?: number | null;
          id?: string;
          known_as: string;
          nationality_code: string;
          preferred_foot?: string | null;
          primary_position: string;
          secondary_positions?: string[];
          slug?: string | null;
          source_notes?: string | null;
        };
        Update: {
          base_attributes?: Json;
          bio_short?: string | null;
          birth_year?: number | null;
          created_at?: string;
          era_end?: number | null;
          era_start?: number | null;
          full_name?: string;
          height_cm?: number | null;
          id?: string;
          known_as?: string;
          nationality_code?: string;
          preferred_foot?: string | null;
          primary_position?: string;
          secondary_positions?: string[];
          slug?: string | null;
          source_notes?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          country_code: string;
          created_at: string;
          display_name: string | null;
          elo_rating: number;
          fragment_balance: number;
          hard_currency: number;
          id: string;
          soft_currency: number;
          updated_at: string;
          username: string;
        };
        Insert: {
          avatar_url?: string | null;
          country_code?: string;
          created_at?: string;
          display_name?: string | null;
          elo_rating?: number;
          fragment_balance?: number;
          hard_currency?: number;
          id: string;
          soft_currency?: number;
          updated_at?: string;
          username: string;
        };
        Update: {
          avatar_url?: string | null;
          country_code?: string;
          created_at?: string;
          display_name?: string | null;
          elo_rating?: number;
          fragment_balance?: number;
          hard_currency?: number;
          id?: string;
          soft_currency?: number;
          updated_at?: string;
          username?: string;
        };
        Relationships: [];
      };
      rankings: {
        Row: {
          division: number;
          draws: number;
          elo_rating: number;
          final_position: number | null;
          id: string;
          losses: number;
          matches_played: number;
          profile_id: string;
          reward_claimed: boolean;
          season_id: string;
          wins: number;
        };
        Insert: {
          division?: number;
          draws?: number;
          elo_rating: number;
          final_position?: number | null;
          id?: string;
          losses?: number;
          matches_played?: number;
          profile_id: string;
          reward_claimed?: boolean;
          season_id: string;
          wins?: number;
        };
        Update: {
          division?: number;
          draws?: number;
          elo_rating?: number;
          final_position?: number | null;
          id?: string;
          losses?: number;
          matches_played?: number;
          profile_id?: string;
          reward_claimed?: boolean;
          season_id?: string;
          wins?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'rankings_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'rankings_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'seasons';
            referencedColumns: ['id'];
          },
        ];
      };
      rarities: {
        Row: {
          attribute_multiplier: number;
          code: string;
          color_primary: string;
          color_secondary: string;
          drop_weight: number;
          id: number;
          label: string;
          overall_ceiling: number;
          overall_floor: number;
        };
        Insert: {
          attribute_multiplier?: number;
          code: string;
          color_primary: string;
          color_secondary: string;
          drop_weight: number;
          id: number;
          label: string;
          overall_ceiling: number;
          overall_floor: number;
        };
        Update: {
          attribute_multiplier?: number;
          code?: string;
          color_primary?: string;
          color_secondary?: string;
          drop_weight?: number;
          id?: number;
          label?: string;
          overall_ceiling?: number;
          overall_floor?: number;
        };
        Relationships: [];
      };
      seasons: {
        Row: {
          code: string;
          ends_at: string;
          id: string;
          starts_at: string;
          status: string;
        };
        Insert: {
          code: string;
          ends_at: string;
          id?: string;
          starts_at: string;
          status?: string;
        };
        Update: {
          code?: string;
          ends_at?: string;
          id?: string;
          starts_at?: string;
          status?: string;
        };
        Relationships: [];
      };
      squad_slots: {
        Row: {
          bench_order: number | null;
          id: string;
          is_starter: boolean;
          slot_position: string;
          squad_id: string;
          user_card_id: string;
        };
        Insert: {
          bench_order?: number | null;
          id?: string;
          is_starter?: boolean;
          slot_position: string;
          squad_id: string;
          user_card_id: string;
        };
        Update: {
          bench_order?: number | null;
          id?: string;
          is_starter?: boolean;
          slot_position?: string;
          squad_id?: string;
          user_card_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'squad_slots_squad_id_fkey';
            columns: ['squad_id'];
            isOneToOne: false;
            referencedRelation: 'squads';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'squad_slots_user_card_id_fkey';
            columns: ['user_card_id'];
            isOneToOne: false;
            referencedRelation: 'user_cards';
            referencedColumns: ['id'];
          },
        ];
      };
      squads: {
        Row: {
          captain_user_card_id: string | null;
          chemistry_score: number;
          formation: string;
          id: string;
          is_active: boolean;
          name: string;
          profile_id: string;
          tactic_mentality: string;
          updated_at: string;
        };
        Insert: {
          captain_user_card_id?: string | null;
          chemistry_score?: number;
          formation?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          profile_id: string;
          tactic_mentality?: string;
          updated_at?: string;
        };
        Update: {
          captain_user_card_id?: string | null;
          chemistry_score?: number;
          formation?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          profile_id?: string;
          tactic_mentality?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'squads_captain_user_card_id_fkey';
            columns: ['captain_user_card_id'];
            isOneToOne: false;
            referencedRelation: 'user_cards';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'squads_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      user_cards: {
        Row: {
          acquired_at: string;
          acquired_via: string;
          card_id: string;
          form: number;
          id: string;
          injury_returns_at_round: number | null;
          is_injured: boolean;
          level: number;
          profile_id: string;
          suspended_matches: number;
          yellow_cards_accum: number;
        };
        Insert: {
          acquired_at?: string;
          acquired_via: string;
          card_id: string;
          form?: number;
          id?: string;
          injury_returns_at_round?: number | null;
          is_injured?: boolean;
          level?: number;
          profile_id: string;
          suspended_matches?: number;
          yellow_cards_accum?: number;
        };
        Update: {
          acquired_at?: string;
          acquired_via?: string;
          card_id?: string;
          form?: number;
          id?: string;
          injury_returns_at_round?: number | null;
          is_injured?: boolean;
          level?: number;
          profile_id?: string;
          suspended_matches?: number;
          yellow_cards_accum?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'user_cards_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      credit_soft_currency: {
        Args: { p_amount: number; p_profile_id: string };
        Returns: number;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
