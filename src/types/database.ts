export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nickname: string;
          area: string | null;
          is_practice: boolean;
          instruments: string[];
          genres: string[];
          favorite_artists: string[];
          favorite_tracks: string[];
          bio: string | null;
          avatar_url: string | null;
          sns_links: Json;
          onboarded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nickname: string;
          area?: string | null;
          is_practice?: boolean;
          instruments?: string[];
          genres?: string[];
          favorite_artists?: string[];
          favorite_tracks?: string[];
          bio?: string | null;
          avatar_url?: string | null;
          sns_links?: Json;
          onboarded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nickname?: string;
          area?: string | null;
          is_practice?: boolean;
          instruments?: string[];
          genres?: string[];
          favorite_artists?: string[];
          favorite_tracks?: string[];
          bio?: string | null;
          avatar_url?: string | null;
          sns_links?: Json;
          onboarded_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          author_id: string;
          title: string;
          body: string | null;
          audio_url: string;
          waveform_peaks: number[] | null;
          is_practice: boolean;
          tags: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          title: string;
          body?: string | null;
          audio_url: string;
          waveform_peaks?: number[] | null;
          is_practice?: boolean;
          tags?: string[];
          created_at?: string;
        };
        Update: {
          title?: string;
          body?: string | null;
          audio_url?: string;
          waveform_peaks?: number[] | null;
          is_practice?: boolean;
          tags?: string[];
        };
        Relationships: [
          {
            foreignKeyName: "sessions_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      answers: {
        Row: {
          id: string;
          session_id: string;
          sender_id: string;
          audio_url: string;
          waveform_peaks: number[] | null;
          message: string | null;
          status: "pending" | "approved" | "declined";
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          sender_id: string;
          audio_url: string;
          waveform_peaks?: number[] | null;
          message?: string | null;
          status?: "pending" | "approved" | "declined";
          created_at?: string;
        };
        Update: {
          status?: "pending" | "approved" | "declined";
        };
        Relationships: [
          {
            foreignKeyName: "answers_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "answers_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      messages: {
        Row: {
          id: string;
          session_id: string;
          sender_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          sender_id: string;
          body: string;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "messages_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      schedule_polls: {
        Row: {
          id: string;
          session_id: string;
          created_by: string;
          candidates: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          created_by: string;
          candidates: Json;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "schedule_polls_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "schedule_polls_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      schedule_poll_responses: {
        Row: {
          poll_id: string;
          session_id: string;
          user_id: string;
          answers: Json;
          updated_at: string;
        };
        Insert: {
          poll_id: string;
          session_id: string;
          user_id: string;
          answers: Json;
          updated_at?: string;
        };
        Update: {
          answers?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "schedule_poll_responses_poll_id_session_id_fkey";
            columns: ["poll_id", "session_id"];
            isOneToOne: false;
            referencedRelation: "schedule_polls";
            referencedColumns: ["id", "session_id"];
          },
          {
            foreignKeyName: "schedule_poll_responses_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      saves: {
        Row: {
          user_id: string;
          session_id: string;
        };
        Insert: {
          user_id: string;
          session_id: string;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "saves_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saves_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          reported_user_id: string | null;
          reported_session_id: string | null;
          category: string;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          reported_user_id?: string | null;
          reported_session_id?: string | null;
          category: string;
          comment?: string | null;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      blocks: {
        Row: {
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          blocker_id: string;
          blocked_id: string;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Session = Database["public"]["Tables"]["sessions"]["Row"];
export type Answer = Database["public"]["Tables"]["answers"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type Save = Database["public"]["Tables"]["saves"]["Row"];
export type SchedulePoll = Database["public"]["Tables"]["schedule_polls"]["Row"];
export type SchedulePollResponse = Database["public"]["Tables"]["schedule_poll_responses"]["Row"];

export type ScheduleAnswerValue = "ok" | "maybe" | "no";
export interface ScheduleCandidate {
  id: string;
  iso: string;
}
