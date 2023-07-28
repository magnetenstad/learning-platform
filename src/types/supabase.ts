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
      books: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      chapters: {
        Row: {
          book_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          book_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          book_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_book_id_fkey"
            columns: ["book_id"]
            referencedRelation: "books"
            referencedColumns: ["id"]
          }
        ]
      }
      questions: {
        Row: {
          chapter_id: string
          choices: string[]
          correctAnswer: string
          created_at: string
          id: string
          question: string
          source: string
        }
        Insert: {
          chapter_id: string
          choices: string[]
          correctAnswer: string
          created_at?: string
          id?: string
          question: string
          source: string
        }
        Update: {
          chapter_id?: string
          choices?: string[]
          correctAnswer?: string
          created_at?: string
          id?: string
          question?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_chapter_id_fkey"
            columns: ["chapter_id"]
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
