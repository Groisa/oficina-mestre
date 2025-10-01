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
      categories: {
        Row: {
          created_at: string
          id: number
          name: string
          user_id: string | null // Adicionado
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          user_id?: string | null // Adicionado
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          user_id?: string | null // Adicionado
        }
        Relationships: [
          {
            foreignKeyName: "categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          email: string | null
          id: number
          name: string
          phone: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: number
          name: string
          phone?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: number
          name?: string
          phone?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category_id: number | null
          cost_price: number
          created_at: string
          current_stock: number
          id: number
          last_update: string
          minimum_stock: number
          name: string
          sale_price: number
          supplier_id: number | null
          user_id: string | null // Adicionado
        }
        Insert: {
          category_id?: number | null
          cost_price?: number
          created_at?: string
          current_stock?: number
          id?: number
          last_update?: string
          minimum_stock?: number
          name: string
          sale_price?: number
          supplier_id?: number | null
          user_id?: string | null // Adicionado
        }
        Update: {
          category_id?: number | null
          cost_price?: number
          created_at?: string
          current_stock?: number
          id?: number
          last_update?: string
          minimum_stock?: number
          name?: string
          sale_price?: number
          supplier_id?: number | null
          user_id?: string | null // Adicionado
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      makes: {
        Row: {
          created_at: string
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          id: string
          full_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          id?: string
          full_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      service_orders: {
        Row: {
          client_id: number
          created_at: string
          id: number
          items: Json | null
          observations: string | null
          status: string
          total_value: number
          vehicle_id: number
          user_id: string | null
        }
        Insert: {
          client_id: number
          created_at?: string
          id?: number
          items?: Json | null
          observations?: string | null
          status?: string
          total_value?: number
          vehicle_id: number
          user_id?: string | null
        }
        Update: {
          client_id?: number
          created_at?: string
          id?: number
          items?: Json | null
          observations?: string | null
          status?: string
          total_value?: number
          vehicle_id?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          created_at: string
          id: number
          name: string
          user_id: string | null // Adicionado
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          user_id?: string | null // Adicionado
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          user_id?: string | null // Adicionado
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          client_id: number
          created_at: string
          id: number
          license_plate: string
          make: string
          model: string
          year: number | null
          user_id: string | null
        }
        Insert: {
          client_id: number
          created_at?: string
          id?: number
          license_plate: string
          make: string
          model: string
          year?: number | null
          user_id?: string | null
        }
        Update: {
          client_id?: number
          created_at?: string
          id?: number
          license_plate?: string
          make?: string
          model?: string
          year?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_new_user: {
        Args: {
          email: string
          password: string
          full_name: string
          role: string
        }
        Returns: Json
      }
      delete_user_by_id: {
        Args: {
          user_id_to_delete: string
        }
        Returns: undefined
      }
      decrement_stock: {
        Args: {
          item_id: number
          decrement_quantity: number
        }
        Returns: undefined
      }
    }
    Enums: {
      user_role: "admin" | "mecanico"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

