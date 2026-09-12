/**
 * Hand-written to match supabase/migrations/0001_init.sql.
 *
 * Once the project is linked to a real Supabase project, regenerate this
 * for perfect accuracy (see SETUP.md):
 *   npx supabase gen types typescript --linked > src/lib/database.types.ts
 */
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: { user_id: string; display_name: string | null; created_at: string };
        Insert: { user_id: string; display_name?: string | null; created_at?: string };
        Update: { user_id?: string; display_name?: string | null; created_at?: string };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          is_visible: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["categories"]["Row"]> & {
          name: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Row"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          category_id: string | null;
          name: string;
          slug: string;
          description: string | null;
          short_description: string | null;
          price_cents: number;
          compare_at_price_cents: number | null;
          status: "draft" | "active" | "archived";
          is_featured: boolean;
          display_order: number;
          seo_title: string | null;
          seo_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["products"]["Row"]> & {
          name: string;
          slug: string;
          price_cents: number;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          alt_text: string | null;
          display_order: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["product_images"]["Row"]> & {
          product_id: string;
          url: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_images"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          sku: string;
          size: string | null;
          color: string | null;
          inventory_quantity: number;
          is_active: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["product_variants"]["Row"]> & {
          product_id: string;
          sku: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_variants"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      store_settings: {
        Row: {
          id: boolean;
          store_name: string;
          store_email: string;
          announcement_bar_enabled: boolean;
          announcement_bar_text: string | null;
          default_shipping_cents: number;
          free_shipping_threshold_cents: number | null;
          maintenance_mode: boolean;
          social_links: Json;
          return_policy_summary: string;
          footer_text: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["store_settings"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["store_settings"]["Row"]>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          stripe_checkout_session_id: string | null;
          stripe_payment_intent_id: string | null;
          customer_email: string;
          customer_name: string | null;
          shipping_address: Json | null;
          billing_address: Json | null;
          subtotal_cents: number;
          shipping_cents: number;
          tax_cents: number;
          total_cents: number;
          currency: string;
          payment_status: "pending" | "paid" | "failed" | "refunded";
          fulfillment_status: "unfulfilled" | "processing" | "shipped" | "completed" | "cancelled";
          tracking_number: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["orders"]["Row"]> & {
          order_number: string;
          customer_email: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Row"]>;
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          variant_id: string | null;
          product_name: string;
          variant_label: string | null;
          sku: string | null;
          unit_price_cents: number;
          quantity: number;
          line_total_cents: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["order_items"]["Row"]> & {
          order_id: string;
          product_name: string;
          unit_price_cents: number;
          quantity: number;
          line_total_cents: number;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      webhook_events: {
        Row: { event_id: string; event_type: string; processed_at: string };
        Insert: { event_id: string; event_type: string; processed_at?: string };
        Update: { event_id?: string; event_type?: string; processed_at?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      fn_record_stripe_order: {
        Args: { payload: Json };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
