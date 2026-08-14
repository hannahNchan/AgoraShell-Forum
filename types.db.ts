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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          created_at: string
          id: string
          metadata: Json
          target_id: string | null
          target_label: string | null
          target_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_label?: string | null
          target_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_label?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "user_reputation_badges"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "user_reputation_scores"
            referencedColumns: ["user_id"]
          },
        ]
      }
      app_settings: {
        Row: {
          foro_bloqueado: boolean | null
          id: number
          max_reply_depth: number | null
          max_tags_per_topic: number | null
        }
        Insert: {
          foro_bloqueado?: boolean | null
          id?: number
          max_reply_depth?: number | null
          max_tags_per_topic?: number | null
        }
        Update: {
          foro_bloqueado?: boolean | null
          id?: number
          max_reply_depth?: number | null
          max_tags_per_topic?: number | null
        }
        Relationships: []
      }
      channels: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "channels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_reputation_badges"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "channels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_reputation_scores"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string | null
          id: string
          read: boolean | null
          reply_id: string | null
          topic_id: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string | null
          id?: string
          read?: boolean | null
          reply_id?: string | null
          topic_id?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string | null
          id?: string
          read?: boolean | null
          reply_id?: string | null
          topic_id?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "user_reputation_badges"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "user_reputation_scores"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_reputation_badges"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_reputation_scores"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banned_reason: string | null
          bio: string | null
          created_at: string | null
          id: string
          moderation_previous_role_id: number | null
          moderation_updated_at: string | null
          moderation_updated_by: string | null
          role: string | null
          role_id: number | null
          suspended_until: string | null
          suspension_reason: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          banned_reason?: string | null
          bio?: string | null
          created_at?: string | null
          id: string
          moderation_previous_role_id?: number | null
          moderation_updated_at?: string | null
          moderation_updated_by?: string | null
          role?: string | null
          role_id?: number | null
          suspended_until?: string | null
          suspension_reason?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          banned_reason?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          moderation_previous_role_id?: number | null
          moderation_updated_at?: string | null
          moderation_updated_by?: string | null
          role?: string | null
          role_id?: number | null
          suspended_until?: string | null
          suspension_reason?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_moderation_previous_role_id_fkey"
            columns: ["moderation_previous_role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_moderation_updated_by_fkey"
            columns: ["moderation_updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_moderation_updated_by_fkey"
            columns: ["moderation_updated_by"]
            isOneToOne: false
            referencedRelation: "user_reputation_badges"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profiles_moderation_updated_by_fkey"
            columns: ["moderation_updated_by"]
            isOneToOne: false
            referencedRelation: "user_reputation_scores"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      replies: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          parent_id: string | null
          topic_id: string | null
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          topic_id?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          topic_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_reputation_badges"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_reputation_scores"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "replies_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "replies_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      reply_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          reply_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          reply_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          reply_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reply_reactions_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reply_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reply_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_reputation_badges"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reply_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_reputation_scores"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reports: {
        Row: {
          assigned_moderator_id: string | null
          created_at: string
          details: string | null
          handled_at: string | null
          handled_by_id: string | null
          id: string
          moderator_note: string | null
          reason: string
          reported_user_id: string | null
          reporter_id: string
          status: string
          target_reply_id: string | null
          target_topic_id: string | null
          target_type: string
          target_user_id: string | null
          updated_at: string
        }
        Insert: {
          assigned_moderator_id?: string | null
          created_at?: string
          details?: string | null
          handled_at?: string | null
          handled_by_id?: string | null
          id?: string
          moderator_note?: string | null
          reason: string
          reported_user_id?: string | null
          reporter_id: string
          status?: string
          target_reply_id?: string | null
          target_topic_id?: string | null
          target_type: string
          target_user_id?: string | null
          updated_at?: string
        }
        Update: {
          assigned_moderator_id?: string | null
          created_at?: string
          details?: string | null
          handled_at?: string | null
          handled_by_id?: string | null
          id?: string
          moderator_note?: string | null
          reason?: string
          reported_user_id?: string | null
          reporter_id?: string
          status?: string
          target_reply_id?: string | null
          target_topic_id?: string | null
          target_type?: string
          target_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_assigned_moderator_id_fkey"
            columns: ["assigned_moderator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_assigned_moderator_id_fkey"
            columns: ["assigned_moderator_id"]
            isOneToOne: false
            referencedRelation: "user_reputation_badges"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reports_assigned_moderator_id_fkey"
            columns: ["assigned_moderator_id"]
            isOneToOne: false
            referencedRelation: "user_reputation_scores"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reports_handled_by_id_fkey"
            columns: ["handled_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_handled_by_id_fkey"
            columns: ["handled_by_id"]
            isOneToOne: false
            referencedRelation: "user_reputation_badges"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reports_handled_by_id_fkey"
            columns: ["handled_by_id"]
            isOneToOne: false
            referencedRelation: "user_reputation_scores"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "user_reputation_badges"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "user_reputation_scores"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "user_reputation_badges"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "user_reputation_scores"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reports_target_reply_id_fkey"
            columns: ["target_reply_id"]
            isOneToOne: false
            referencedRelation: "replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_target_topic_id_fkey"
            columns: ["target_topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "user_reputation_badges"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reports_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "user_reputation_scores"
            referencedColumns: ["user_id"]
          },
        ]
      }
      roles: {
        Row: {
          description: string | null
          id: number
          name: string
        }
        Insert: {
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          description?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_reputation_badges"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_reputation_scores"
            referencedColumns: ["user_id"]
          },
        ]
      }
      topic_stars: {
        Row: {
          created_at: string | null
          id: string
          topic_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          topic_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          topic_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topic_stars_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_stars_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_stars_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_reputation_badges"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "topic_stars_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_reputation_scores"
            referencedColumns: ["user_id"]
          },
        ]
      }
      topic_tags: {
        Row: {
          tag_id: string
          topic_id: string
        }
        Insert: {
          tag_id: string
          topic_id: string
        }
        Update: {
          tag_id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_tags_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          author_id: string | null
          channel_id: string | null
          content: string
          created_at: string | null
          id: string
          is_closed: boolean | null
          is_pinned: boolean | null
          replies_count: number | null
          stars_count: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          channel_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_closed?: boolean | null
          is_pinned?: boolean | null
          replies_count?: number | null
          stars_count?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          channel_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_closed?: boolean | null
          is_pinned?: boolean | null
          replies_count?: number | null
          stars_count?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topics_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topics_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_reputation_badges"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "topics_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_reputation_scores"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "topics_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reputation_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json
          points: number
          source_id: string
          source_type: string
          target_user_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          points: number
          source_id: string
          source_type: string
          target_user_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          points?: number
          source_id?: string
          source_type?: string
          target_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reputation_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reputation_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "user_reputation_badges"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_reputation_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "user_reputation_scores"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_reputation_events_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reputation_events_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "user_reputation_badges"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_reputation_events_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "user_reputation_scores"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      user_reputation_badges: {
        Row: {
          badges: string[] | null
          user_id: string | null
        }
        Relationships: []
      }
      user_reputation_scores: {
        Row: {
          level_name: string | null
          level_range: string | null
          replies_created: number | null
          reply_reactions_received: number | null
          shell_score: number | null
          stars_received: number | null
          topics_created: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_reply_thread_by_reply_id: {
        Args: { p_reply_id: string }
        Returns: {
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          parent_id: string | null
          topic_id: string | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "replies"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_topic_reply_threads_page: {
        Args: { p_limit?: number; p_offset?: number; p_topic_id: string }
        Returns: {
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          parent_id: string | null
          topic_id: string | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "replies"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      record_reputation_event: {
        Args: {
          p_action: string
          p_actor_id: string
          p_metadata?: Json
          p_points: number
          p_source_id: string
          p_source_type: string
          p_target_user_id: string
        }
        Returns: undefined
      }
      user_can_create_content: { Args: { user_id: string }; Returns: boolean }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
