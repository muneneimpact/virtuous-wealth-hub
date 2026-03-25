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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          performed_by: string | null
          record_id: string | null
          table_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          performed_by?: string | null
          record_id?: string | null
          table_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          performed_by?: string | null
          record_id?: string | null
          table_name?: string | null
        }
        Relationships: []
      }
      contributions: {
        Row: {
          amount: number
          created_at: string
          id: string
          member_id: string
          month: string
          notes: string | null
          recorded_by: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          member_id: string
          month: string
          notes?: string | null
          recorded_by: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          member_id?: string
          month?: string
          notes?: string | null
          recorded_by?: string
        }
        Relationships: []
      }
      loan_guarantors: {
        Row: {
          amount: number
          created_at: string
          guarantor_id: string
          id: string
          loan_id: string
          responded_at: string | null
          status: Database["public"]["Enums"]["guarantor_status"]
        }
        Insert: {
          amount: number
          created_at?: string
          guarantor_id: string
          id?: string
          loan_id: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["guarantor_status"]
        }
        Update: {
          amount?: number
          created_at?: string
          guarantor_id?: string
          id?: string
          loan_id?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["guarantor_status"]
        }
        Relationships: [
          {
            foreignKeyName: "loan_guarantors_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_requests: {
        Row: {
          amount: number
          created_at: string | null
          guarantor_ids: string[] | null
          id: string
          interest_rate: number | null
          member_id: string
          monthly_payment: number | null
          repayment_months: number | null
          status: string | null
          total_cost: number | null
          total_interest: number | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          guarantor_ids?: string[] | null
          id?: string
          interest_rate?: number | null
          member_id: string
          monthly_payment?: number | null
          repayment_months?: number | null
          status?: string | null
          total_cost?: number | null
          total_interest?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          guarantor_ids?: string[] | null
          id?: string
          interest_rate?: number | null
          member_id?: string
          monthly_payment?: number | null
          repayment_months?: number | null
          status?: string | null
          total_cost?: number | null
          total_interest?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      loans: {
        Row: {
          amount: number
          approved_by: string | null
          created_at: string
          deduct_fee_from_loan: boolean
          disbursement_date: string | null
          id: string
          interest_amount: number | null
          interest_rate: number
          member_id: string
          monthly_payment: number | null
          processing_fee: number
          rejection_reason: string | null
          repaid_amount: number
          repayment_months: number | null
          self_guaranteed: boolean | null
          status: Database["public"]["Enums"]["loan_status"]
          total_cost: number | null
          total_interest: number | null
          updated_at: string
        }
        Insert: {
          amount: number
          approved_by?: string | null
          created_at?: string
          deduct_fee_from_loan?: boolean
          disbursement_date?: string | null
          id?: string
          interest_amount?: number | null
          interest_rate?: number
          member_id: string
          monthly_payment?: number | null
          processing_fee?: number
          rejection_reason?: string | null
          repaid_amount?: number
          repayment_months?: number | null
          self_guaranteed?: boolean | null
          status?: Database["public"]["Enums"]["loan_status"]
          total_cost?: number | null
          total_interest?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_by?: string | null
          created_at?: string
          deduct_fee_from_loan?: boolean
          disbursement_date?: string | null
          id?: string
          interest_amount?: number | null
          interest_rate?: number
          member_id?: string
          monthly_payment?: number | null
          processing_fee?: number
          rejection_reason?: string | null
          repaid_amount?: number
          repayment_months?: number | null
          self_guaranteed?: boolean | null
          status?: Database["public"]["Enums"]["loan_status"]
          total_cost?: number | null
          total_interest?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      members: {
        Row: {
          loan_balance: number | null
          member_id: number
          name: string | null
          savings_balance: number | null
        }
        Insert: {
          loan_balance?: number | null
          member_id?: number
          name?: string | null
          savings_balance?: number | null
        }
        Update: {
          loan_balance?: number | null
          member_id?: number
          name?: string | null
          savings_balance?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      payment_requests: {
        Row: {
          amount: number
          id: string
          member_id: string
          mpesa_code: string | null
          mpesa_message: string | null
          notes: string | null
          payment_date: string
          payment_method: string | null
          payment_month: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
        }
        Insert: {
          amount: number
          id?: string
          member_id: string
          mpesa_code?: string | null
          mpesa_message?: string | null
          notes?: string | null
          payment_date: string
          payment_method?: string | null
          payment_month: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
        }
        Update: {
          amount?: number
          id?: string
          member_id?: string
          mpesa_code?: string | null
          mpesa_message?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          payment_month?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          id: number
          member_id: number | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: number
          member_id?: number | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: number
          member_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["member_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          email: string | null
          id: string
          membership_number: string | null
          phone: string | null
          savings: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          membership_number?: string | null
          phone?: string | null
          savings?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          membership_number?: string | null
          phone?: string | null
          savings?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          id: string
          interest_rate: number
          investment_target: number
          minimum_balance: number
          minimum_contribution: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          interest_rate?: number
          investment_target?: number
          minimum_balance?: number
          minimum_contribution?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          interest_rate?: number
          investment_target?: number
          minimum_balance?: number
          minimum_contribution?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          member_id: string | null
          reference_id: string | null
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          member_id?: string | null
          reference_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          member_id?: string | null
          reference_id?: string | null
          type?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      generate_membership_number: { Args: never; Returns: string }
      get_group_financials: { Args: never; Returns: Json }
      get_member_savings: { Args: { _user_id: string }; Returns: number }
      get_user_status: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      lookup_member_by_number: {
        Args: { _membership_number: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "treasurer" | "member"
      guarantor_status: "pending" | "accepted" | "declined"
      loan_status:
        | "draft"
        | "pending_guarantors"
        | "pending_approval"
        | "approved"
        | "rejected"
        | "disbursed"
        | "repaid"
      notification_type:
        | "guarantor_request"
        | "guarantor_accepted"
        | "guarantor_declined"
        | "loan_approved"
        | "loan_rejected"
        | "loan_disbursed"
        | "contribution_recorded"
        | "member_approved"
        | "member_rejected"
        | "contribution_approved"
        | "payment_rejected"
        | "contribution_submitted"
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
      app_role: ["admin", "treasurer", "member"],
      guarantor_status: ["pending", "accepted", "declined"],
      loan_status: [
        "draft",
        "pending_guarantors",
        "pending_approval",
        "approved",
        "rejected",
        "disbursed",
        "repaid",
      ],
      notification_type: [
        "guarantor_request",
        "guarantor_accepted",
        "guarantor_declined",
        "loan_approved",
        "loan_rejected",
        "loan_disbursed",
        "contribution_recorded",
        "member_approved",
        "member_rejected",
        "contribution_approved",
        "payment_rejected",
        "contribution_submitted",
      ],
    },
  },
} as const
