export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      delays: {
        Row: {
          id: string
          employee_id: string
          date: string
          scheduled_time: string
          actual_time: string
          duration: unknown
          reason: string | null
          status: Database["public"]["Enums"]["request_status"] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          date: string
          scheduled_time: string
          actual_time: string
          duration: unknown
          reason?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          date?: string
          scheduled_time?: string
          actual_time?: string
          duration?: unknown
          reason?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delays_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
      leave_requests: {
        Row: {
          id: string
          employee_id: string
          start_date: string
          end_date: string
          type: Database["public"]["Enums"]["leave_type"]
          status: Database["public"]["Enums"]["request_status"] | null
          reason: string | null
          day_type: string
          created_at: string
          updated_at: string
          period: string | null
          rejection_reason: string | null
        }
        Insert: {
          id?: string
          employee_id: string
          start_date: string
          end_date: string
          type: Database["public"]["Enums"]["leave_type"]
          status?: Database["public"]["Enums"]["request_status"] | null
          reason?: string | null
          day_type: string
          created_at?: string
          updated_at?: string
          period?: string | null
          rejection_reason?: string | null
        }
        Update: {
          id?: string
          employee_id?: string
          start_date?: string
          end_date?: string
          type?: Database["public"]["Enums"]["leave_type"]
          status?: Database["public"]["Enums"]["request_status"] | null
          reason?: string | null
          day_type?: string
          created_at?: string
          updated_at?: string
          period?: string | null
          rejection_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Enums: {
      leave_type: "vacation" | "annual" | "paternity" | "maternity" | "sickChild" | "unpaidUnexcused" | "unpaidExcused" | "unpaid" | "rtt" | "familyEvent"
      request_status: "pending" | "approved" | "rejected"
    }
  }
}