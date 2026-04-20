export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          badge_key: string
          id: string
          unlocked_at: string | null
          user_id: string | null
        }
        Insert: {
          badge_key: string
          id?: string
          unlocked_at?: string | null
          user_id?: string | null
        }
        Update: {
          badge_key?: string
          id?: string
          unlocked_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_usage: {
        Row: {
          created_at: string
          id: string
          question: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question?: string
          user_id?: string
        }
        Relationships: []
      }
      device_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform?: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string
          created_at: string
          currency: string
          current_streak: number | null
          full_name: string
          id: string
          last_active_date: string | null
          longest_streak: number | null
          monthly_saved: number
          nickname: string
          referral_count: number | null
          referred_by: string | null
          total_saved: number
          updated_at: string
          user_id: string
          weekly_saved: number
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          birth_date: string
          created_at?: string
          currency?: string
          current_streak?: number | null
          full_name: string
          id?: string
          last_active_date?: string | null
          longest_streak?: number | null
          monthly_saved?: number
          nickname: string
          referral_count?: number | null
          referred_by?: string | null
          total_saved?: number
          updated_at?: string
          user_id: string
          weekly_saved?: number
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string
          created_at?: string
          currency?: string
          current_streak?: number | null
          full_name?: string
          id?: string
          last_active_date?: string | null
          longest_streak?: number | null
          monthly_saved?: number
          nickname?: string
          referral_count?: number | null
          referred_by?: string | null
          total_saved?: number
          updated_at?: string
          user_id?: string
          weekly_saved?: number
          xp?: number
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string
          feedback: string
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback: string
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          created_at?: string
          feedback?: string
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: []
      }
      saving_list_items: {
        Row: {
          average_price: number | null
          city: string | null
          created_at: string | null
          currency: string | null
          displayed_price: number | null
          expires_at: string
          id: string
          notified_expiry: boolean | null
          search_query: string | null
          store_name: string
          user_id: string
        }
        Insert: {
          average_price?: number | null
          city?: string | null
          created_at?: string | null
          currency?: string | null
          displayed_price?: number | null
          expires_at?: string
          id?: string
          notified_expiry?: boolean | null
          search_query?: string | null
          store_name: string
          user_id: string
        }
        Update: {
          average_price?: number | null
          city?: string | null
          created_at?: string | null
          currency?: string | null
          displayed_price?: number | null
          expires_at?: string
          id?: string
          notified_expiry?: boolean | null
          search_query?: string | null
          store_name?: string
          user_id?: string
        }
        Relationships: []
      }
      savings_entries: {
        Row: {
          amount_saved: number
          amount_spent: number
          average_price: number
          created_at: string
          currency: string
          goal_id: string | null
          id: string
          search_query: string | null
          store_name: string
          user_id: string
        }
        Insert: {
          amount_saved: number
          amount_spent: number
          average_price: number
          created_at?: string
          currency?: string
          goal_id?: string | null
          id?: string
          search_query?: string | null
          store_name: string
          user_id: string
        }
        Update: {
          amount_saved?: number
          amount_spent?: number
          average_price?: number
          created_at?: string
          currency?: string
          goal_id?: string | null
          id?: string
          search_query?: string | null
          store_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_entries_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "savings_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_goals: {
        Row: {
          created_at: string
          currency: string
          emoji: string
          id: string
          name: string
          target_amount: number
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          emoji?: string
          id?: string
          name: string
          target_amount: number
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          emoji?: string
          id?: string
          name?: string
          target_amount?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_profile_xp: {
        Args: { amount_in: number; user_id_in: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
