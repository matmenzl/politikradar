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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      alert_deliveries: {
        Row: {
          event_id: string
          id: string
          sent_at: string
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          sent_at?: string
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_deliveries_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          affair_id: string | null
          business_id: string | null
          canton: string | null
          created_at: string
          dedupe_key: string
          description: string | null
          editorial_confidence: number | null
          event_date: string
          event_type: string
          exclusion_reason: string | null
          id: string
          municipality: string | null
          parliament: string
          parliament_key: string | null
          political_level: string
          political_relevance: number | null
          score_factors: Json
          selection_status: string
          social_potential: number | null
          source_id: string | null
          title: string
          topics: string[]
          updated_at: string
          voting_id: string | null
        }
        Insert: {
          affair_id?: string | null
          business_id?: string | null
          canton?: string | null
          created_at?: string
          dedupe_key: string
          description?: string | null
          editorial_confidence?: number | null
          event_date: string
          event_type: string
          exclusion_reason?: string | null
          id?: string
          municipality?: string | null
          parliament: string
          parliament_key?: string | null
          political_level?: string
          political_relevance?: number | null
          score_factors?: Json
          selection_status?: string
          social_potential?: number | null
          source_id?: string | null
          title: string
          topics?: string[]
          updated_at?: string
          voting_id?: string | null
        }
        Update: {
          affair_id?: string | null
          business_id?: string | null
          canton?: string | null
          created_at?: string
          dedupe_key?: string
          description?: string | null
          editorial_confidence?: number | null
          event_date?: string
          event_type?: string
          exclusion_reason?: string | null
          id?: string
          municipality?: string | null
          parliament?: string
          parliament_key?: string | null
          political_level?: string
          political_relevance?: number | null
          score_factors?: Json
          selection_status?: string
          social_potential?: number | null
          source_id?: string | null
          title?: string
          topics?: string[]
          updated_at?: string
          voting_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      facts: {
        Row: {
          created_at: string
          event_id: string
          fact_type: string
          id: string
          label: string
          position: number
          source_id: string | null
          value: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          event_id: string
          fact_type: string
          id?: string
          label: string
          position?: number
          source_id?: string | null
          value: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          event_id?: string
          fact_type?: string
          id?: string
          label?: string
          position?: number
          source_id?: string | null
          value?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "facts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facts_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_config: {
        Row: {
          id: string
          relevance_weights: Json
          social_weights: Json
          thresholds: Json
          updated_at: string
        }
        Insert: {
          id?: string
          relevance_weights?: Json
          social_weights?: Json
          thresholds?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          relevance_weights?: Json
          social_weights?: Json
          thresholds?: Json
          updated_at?: string
        }
        Relationships: []
      }
      slides: {
        Row: {
          body: string | null
          created_at: string
          headline: string | null
          id: string
          position: number
          slide_type: string
          source_id: string | null
          story_id: string
          updated_at: string
          visualization: Json
        }
        Insert: {
          body?: string | null
          created_at?: string
          headline?: string | null
          id?: string
          position?: number
          slide_type?: string
          source_id?: string | null
          story_id: string
          updated_at?: string
          visualization?: Json
        }
        Update: {
          body?: string | null
          created_at?: string
          headline?: string | null
          id?: string
          position?: number
          slide_type?: string
          source_id?: string | null
          story_id?: string
          updated_at?: string
          visualization?: Json
        }
        Relationships: [
          {
            foreignKeyName: "slides_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slides_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          created_at: string
          id: string
          label: string
          source_type: string
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          source_type?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          source_type?: string
          url?: string | null
        }
        Relationships: []
      }
      stories: {
        Row: {
          approved_at: string | null
          created_at: string
          editorial_confidence: number | null
          event_id: string | null
          headline: string
          id: string
          political_relevance: number | null
          published_at: string | null
          social_potential: number | null
          status: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          editorial_confidence?: number | null
          event_id?: string | null
          headline: string
          id?: string
          political_relevance?: number | null
          published_at?: string | null
          social_potential?: number | null
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          editorial_confidence?: number | null
          event_id?: string | null
          headline?: string
          id?: string
          political_relevance?: number | null
          published_at?: string | null
          social_potential?: number | null
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriber_profiles: {
        Row: {
          alerts_enabled: boolean
          created_at: string
          email: string
          keywords: string[]
          min_relevance: number
          parliaments: string[]
          topics: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          alerts_enabled?: boolean
          created_at?: string
          email: string
          keywords?: string[]
          min_relevance?: number
          parliaments?: string[]
          topics?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          alerts_enabled?: boolean
          created_at?: string
          email?: string
          keywords?: string[]
          min_relevance?: number
          parliaments?: string[]
          topics?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "editor" | "user"
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
    Enums: {
      app_role: ["admin", "editor", "user"],
    },
  },
} as const
