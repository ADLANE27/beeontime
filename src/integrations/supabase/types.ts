export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      delays: {
        Row: {
          actual_time: string
          created_at: string
          date: string
          duration: unknown
          employee_id: string
          id: string
          reason: string | null
          scheduled_time: string
          status: Database["public"]["Enums"]["request_status"] | null
          updated_at: string
        }
        Insert: {
          actual_time: string
          created_at?: string
          date: string
          duration: unknown
          employee_id: string
          id?: string
          reason?: string | null
          scheduled_time: string
          status?: Database["public"]["Enums"]["request_status"] | null
          updated_at?: string
        }
        Update: {
          actual_time?: string
          created_at?: string
          date?: string
          duration?: unknown
          employee_id?: string
          id?: string
          reason?: string | null
          scheduled_time?: string
          status?: Database["public"]["Enums"]["request_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delays_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          employee_id: string | null
          file_path: string
          id: string
          title: string
          type: string
          updated_at: string
          uploaded_by: string
          viewed: boolean | null
        }
        Insert: {
          created_at?: string
          employee_id?: string | null
          file_path: string
          id?: string
          title: string
          type: string
          updated_at?: string
          uploaded_by: string
          viewed?: boolean | null
        }
        Update: {
          created_at?: string
          employee_id?: string | null
          file_path?: string
          id?: string
          title?: string
          type?: string
          updated_at?: string
          uploaded_by?: string
          viewed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          birth_country: string | null
          birth_date: string | null
          birth_place: string | null
          city: string | null
          contract_type: string | null
          country: string | null
          created_at: string
          current_year_used_days: number | null
          current_year_vacation_days: number | null
          email: string
          first_name: string
          id: string
          initial_password: string
          last_name: string
          last_vacation_credit_date: string | null
          phone: string | null
          position: string | null
          postal_code: string | null
          previous_year_used_days: number | null
          previous_year_vacation_days: number | null
          social_security_number: string | null
          start_date: string | null
          street_address: string | null
          updated_at: string
          work_schedule: Json | null
        }
        Insert: {
          birth_country?: string | null
          birth_date?: string | null
          birth_place?: string | null
          city?: string | null
          contract_type?: string | null
          country?: string | null
          created_at?: string
          current_year_used_days?: number | null
          current_year_vacation_days?: number | null
          email: string
          first_name: string
          id: string
          initial_password?: string
          last_name: string
          last_vacation_credit_date?: string | null
          phone?: string | null
          position?: string | null
          postal_code?: string | null
          previous_year_used_days?: number | null
          previous_year_vacation_days?: number | null
          social_security_number?: string | null
          start_date?: string | null
          street_address?: string | null
          updated_at?: string
          work_schedule?: Json | null
        }
        Update: {
          birth_country?: string | null
          birth_date?: string | null
          birth_place?: string | null
          city?: string | null
          contract_type?: string | null
          country?: string | null
          created_at?: string
          current_year_used_days?: number | null
          current_year_vacation_days?: number | null
          email?: string
          first_name?: string
          id?: string
          initial_password?: string
          last_name?: string
          last_vacation_credit_date?: string | null
          phone?: string | null
          position?: string | null
          postal_code?: string | null
          previous_year_used_days?: number | null
          previous_year_vacation_days?: number | null
          social_security_number?: string | null
          start_date?: string | null
          street_address?: string | null
          updated_at?: string
          work_schedule?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_event_documents: {
        Row: {
          event_id: string
          file_name: string
          file_path: string
          file_type: string
          id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          event_id: string
          file_name: string
          file_path: string
          file_type: string
          id?: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          event_id?: string
          file_name?: string
          file_path?: string
          file_type?: string
          id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_event_documents_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "hr_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_event_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_events: {
        Row: {
          category: Database["public"]["Enums"]["event_category"]
          created_at: string
          created_by: string
          description: string | null
          employee_id: string
          event_date: string
          id: string
          severity: Database["public"]["Enums"]["event_severity"]
          status: Database["public"]["Enums"]["event_status"]
          subcategory: Database["public"]["Enums"]["event_subcategory"]
          title: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          category: Database["public"]["Enums"]["event_category"]
          created_at?: string
          created_by: string
          description?: string | null
          employee_id: string
          event_date?: string
          id?: string
          severity?: Database["public"]["Enums"]["event_severity"]
          status?: Database["public"]["Enums"]["event_status"]
          subcategory: Database["public"]["Enums"]["event_subcategory"]
          title: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          category?: Database["public"]["Enums"]["event_category"]
          created_at?: string
          created_by?: string
          description?: string | null
          employee_id?: string
          event_date?: string
          id?: string
          severity?: Database["public"]["Enums"]["event_severity"]
          status?: Database["public"]["Enums"]["event_status"]
          subcategory?: Database["public"]["Enums"]["event_subcategory"]
          title?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_events_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_events_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_request_documents: {
        Row: {
          file_name: string
          file_path: string
          file_type: string
          id: string
          leave_request_id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          file_name: string
          file_path: string
          file_type: string
          id?: string
          leave_request_id: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          file_name?: string
          file_path?: string
          file_type?: string
          id?: string
          leave_request_id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_request_documents_leave_request_id_fkey"
            columns: ["leave_request_id"]
            isOneToOne: false
            referencedRelation: "leave_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_request_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          created_at: string
          day_type: string
          employee_id: string
          end_date: string
          id: string
          period: string | null
          reason: string | null
          rejection_reason: string | null
          start_date: string
          status: Database["public"]["Enums"]["request_status"] | null
          type: Database["public"]["Enums"]["leave_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_type: string
          employee_id: string
          end_date: string
          id?: string
          period?: string | null
          reason?: string | null
          rejection_reason?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["request_status"] | null
          type: Database["public"]["Enums"]["leave_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_type?: string
          employee_id?: string
          end_date?: string
          id?: string
          period?: string | null
          reason?: string | null
          rejection_reason?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["request_status"] | null
          type?: Database["public"]["Enums"]["leave_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      overtime_requests: {
        Row: {
          created_at: string
          date: string
          employee_id: string
          end_time: string
          hours: number
          id: string
          reason: string | null
          start_time: string
          status: Database["public"]["Enums"]["request_status"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          employee_id: string
          end_time: string
          hours: number
          id?: string
          reason?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["request_status"] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          employee_id?: string
          end_time?: string
          hours?: number
          id?: string
          reason?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["request_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "overtime_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      time_records: {
        Row: {
          created_at: string
          date: string
          employee_id: string
          evening_out: string | null
          id: string
          lunch_in: string | null
          lunch_out: string | null
          morning_in: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          employee_id: string
          evening_out?: string | null
          id?: string
          lunch_in?: string | null
          lunch_out?: string | null
          morning_in?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          employee_id?: string
          evening_out?: string | null
          id?: string
          lunch_in?: string | null
          lunch_out?: string | null
          morning_in?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      vacation_history: {
        Row: {
          action_date: string | null
          action_type: string
          created_at: string | null
          days_affected: number
          details: Json | null
          employee_id: string | null
          id: string
          year: number
        }
        Insert: {
          action_date?: string | null
          action_type: string
          created_at?: string | null
          days_affected: number
          details?: Json | null
          employee_id?: string | null
          id?: string
          year: number
        }
        Update: {
          action_date?: string | null
          action_type?: string
          created_at?: string | null
          days_affected?: number
          details?: Json | null
          employee_id?: string | null
          id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vacation_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_working_days: {
        Args: {
          start_date: string
          end_date: string
        }
        Returns: number
      }
      credit_monthly_vacation: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      handle_previous_year_vacation_expiration: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      event_category: "disciplinary" | "evaluation" | "administrative" | "other"
      event_severity: "critical" | "standard" | "minor"
      event_status: "open" | "closed"
      event_subcategory:
        | "verbal_warning"
        | "written_warning"
        | "reminder"
        | "suspension"
        | "dismissal"
        | "annual_review"
        | "quarterly_review"
        | "pdp"
        | "promotion"
        | "position_change"
        | "training"
        | "certification"
        | "extended_leave"
        | "specific_meeting"
        | "feedback"
      leave_type:
        | "vacation"
        | "annual"
        | "paternity"
        | "maternity"
        | "sickChild"
        | "unpaidUnexcused"
        | "unpaidExcused"
        | "unpaid"
        | "rtt"
        | "familyEvent"
      request_status: "pending" | "approved" | "rejected"
      user_role: "employee" | "hr"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
