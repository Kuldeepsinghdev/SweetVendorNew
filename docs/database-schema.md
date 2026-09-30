# Database Design

The application uses PostgreSQL through Drizzle ORM. Most relationships are logical (application-enforced), but the location hierarchy and the `users` identity references are enforced by real SQL foreign-key constraints (see the Foreign Keys section below). Relationships that are not backed by a constraint remain logical only.

The location network is a three-level hierarchy:

```
City
  └── Sale Centre            (grouping layer; sweet menu + pricing, discount + Mitra scope)
        ├── sweet menu + price   (sale_center_sweets: which sweets, at what price)
        ├── Distribution Centre   (pickup point, own address + pincode; inherits the menu)
        ├── Distribution Centre
        └── Distribution Centre

Order (booking)
  └── Distribution Centre    (selected at checkout; sale_center_id kept for grouping)
```

```mermaid
erDiagram
    CITIES {
        varchar id PK
        text name_hi
        text name_en
        text state_hi
        text state_en
        text district_hi
        text admin_name
        varchar admin_phone
        boolean is_active
        jsonb sweets "DEPRECATED: pricing moved to sale_center_sweets"
    }

    MASTER_SWEETS {
        varchar id PK
        text name_hi
        text name_en
        varchar category
        varchar hsn_code
        real gst_percent
        text description_hi
        text description_en
        text image_url
        jsonb images
        real base_price
        real discount_percent
        integer shelf_life_days
        text pack_size_info
        jsonb variants
        boolean is_pure_veg
        text ingredients_hi
    }

    SALE_CENTERS {
        varchar id PK
        varchar city_id FK
        text name_hi
        text name_en
        varchar type
        text owner_name
        varchar owner_phone
        text owner_email
        varchar owner_user_id FK
        text address_hi
        text address_en
        varchar pincode
        text timing
        text map_url
        boolean is_active
        varchar gstin
    }

    DISTRIBUTION_CENTERS {
        varchar id PK
        varchar sale_center_id FK
        varchar city_id FK
        text name_hi
        text name_en
        text address_hi
        text address_en
        varchar pincode "own pincode"
        text timing
        varchar phone
        boolean is_active
    }

    SALE_CENTER_SWEETS {
        varchar sale_center_id PK_FK
        varchar sweet_id PK_FK
        real price_per_kg
        boolean is_active
    }

    FESTIVALS {
        varchar id PK
        text name_hi
        text name_en
        varchar status
        varchar start_date
        varchar cutoff_date
        varchar distribution_start_date
        varchar distribution_end_date
        real max_kg_per_booking
        real default_mitra_credit_limit
    }

    MITRA_APPLICATIONS {
        varchar id PK
        varchar city_id FK
        text city_name_hi
        text full_name
        varchar phone
        text email
        varchar pincode
        text address
        boolean agreed_to_center
        varchar status
        text rejection_reason
        text created_at
        text temp_password
        real credit_limit
    }

    BOOKINGS {
        varchar id PK
        varchar festival_id FK
        text festival_name_hi
        varchar city_id FK
        text city_name_hi
        varchar center_id FK "distribution centre (pickup point)"
        varchar sale_center_id FK "parent sale centre (grouping)"
        text center_name_hi
        text center_address_hi
        varchar center_phone
        varchar booked_by_role
        varchar mitra_id FK
        text mitra_name
        jsonb customer
        jsonb items
        real total_kg
        real total_amount
        varchar payment_method
        varchar payment_status
        varchar status
        varchar pickup_date
        varchar delivery_otp
        text created_at
        text delivered_at
        varchar invoice_id
        real subtotal_amount
        varchar discount_code FK
        real discount_amount
        text zoho_payment_id
        text zoho_payment_session_id
        text zoho_order_id
        text zoho_payment_mode
    }

    DISCOUNTS {
        varchar id PK
        varchar code UK
        text title_hi
        text title_en
        text description_hi
        varchar city_id FK
        varchar center_id FK
        varchar discount_type
        real discount_value
        real min_order_amount
        real max_discount_amount
        varchar start_date
        varchar expiry_date
        integer usage_limit
        integer times_used
        boolean is_active
        text created_at
    }

    AUDIT_LOGS {
        varchar id PK
        text actor
        text action_hi
        text timestamp
    }

    NOTIFICATION_TEMPLATES {
        varchar id PK
        text event_hi
        boolean sms_enabled
        boolean email_enabled
        text template_text_hi
        boolean dlt_approved
    }

    CITIES ||--o{ SALE_CENTERS : "city_id"
    CITIES ||--o{ DISTRIBUTION_CENTERS : "city_id"
    CITIES ||--o{ MITRA_APPLICATIONS : "city_id"
    CITIES ||--o{ BOOKINGS : "city_id"
    CITIES ||--o{ DISCOUNTS : "city_id"
    SALE_CENTERS ||--o{ DISTRIBUTION_CENTERS : "sale_center_id"
    DISTRIBUTION_CENTERS ||--o{ BOOKINGS : "center_id (pickup point)"
    SALE_CENTERS ||--o{ BOOKINGS : "sale_center_id (grouping)"
    SALE_CENTERS ||--o{ DISCOUNTS : "center_id (sale-centre scope)"
    SALE_CENTERS ||--o{ SALE_CENTER_SWEETS : "sale_center_id"
    MASTER_SWEETS ||--o{ SALE_CENTER_SWEETS : "sweet_id"
    FESTIVALS ||--o{ BOOKINGS : "festival_id"
    DISCOUNTS ||--o{ BOOKINGS : "discount_code"
    MITRA_APPLICATIONS ||--o{ BOOKINGS : "mitra_id"
    MASTER_SWEETS }o--o{ BOOKINGS : "items.sweetId"
```

## Table Responsibilities

| Table | Purpose |
|---|---|
| `master_sweets` | National master catalog of sweets, variants, pricing metadata, and bilingual content. |
| `cities` | City network configuration. **Note:** the `sweets` JSONB column is deprecated — sweet availability/pricing now lives in `sale_center_sweets`. |
| `sale_centers` | Grouping layer belonging to cities; parents of distribution centres. Scope level for sweet pricing (via `sale_center_sweets`), discounts, and Sahakar Mitra attachment. |
| `sale_center_sweets` | Per-sale-centre sweet menu and pricing. Composite key `(sale_center_id, sweet_id)`. A sweet is offered by a centre only if a row exists (and `is_active`); distribution centres inherit their parent sale centre's menu. Replaces `cities.sweets`. |
| `distribution_centers` | Pickup points belonging to a sale centre. Each carries its own address and pincode and is what a customer selects at checkout and what a booking references. |
| `festivals` | Festival booking windows, cutoffs, distribution dates, and credit limits. |
| `mitra_applications` | Sahakar Mitra registration, approval, and credit-limit data. |
| `bookings` | Customer/Mitra orders. `center_id` references the pickup **distribution centre**; `sale_center_id` records its parent sale centre for grouping/reporting. Also holds pickup details, payment status, discounts, and fulfillment state. |
| `discounts` | City/sale-centre-scoped coupon definitions and usage limits. `center_id` refers to a **sale centre**, so a coupon applies to every distribution centre under that sale centre. |
| `audit_logs` | Administrative activity history. |
| `notification_templates` | SMS/email notification configuration and message templates. |

## Foreign Keys (enforced at the database)

The location hierarchy is enforced by SQL foreign-key constraints (added idempotently in `src/db/initDb.ts`):

| Constraint | Column | References |
|---|---|---|
| `sale_centers_city_id_fkey` | `sale_centers.city_id` | `cities.id` |
| `distribution_centers_sale_center_id_fkey` | `distribution_centers.sale_center_id` | `sale_centers.id` |
| `distribution_centers_city_id_fkey` | `distribution_centers.city_id` | `cities.id` |
| `bookings_sale_center_id_fkey` | `bookings.sale_center_id` | `sale_centers.id` |
| `bookings_center_id_fkey` | `bookings.center_id` | `distribution_centers.id` |
| `sale_center_sweets_sale_center_id_fkey` | `sale_center_sweets.sale_center_id` | `sale_centers.id` |
| `sale_center_sweets_sweet_id_fkey` | `sale_center_sweets.sweet_id` | `master_sweets.id` |

Identity references to the `users` table are also enforced: `cities.admin_user_id`, `sale_centers.owner_user_id`, `mitra_applications.user_id`, `audit_logs.actor_user_id`, and `bookings.customer_user_id` / `mitra_user_id` / `pickup_mitra_user_id`.

Because of these constraints, delete/reseed operations must remove rows in child → parent order (bookings → sale_center_sweets → distribution_centers → sale_centers → cities, and sale_center_sweets before master_sweets); the seed routine already does this.

All other relationships shown in the diagram (e.g. `discounts.city_id`, `discounts.center_id`, `bookings.discount_code`, JSONB `sweetId` references) remain logical and are enforced only in application code.

## Embedded JSONB Structures

- `cities.sweets`: **deprecated** city-specific `{ sweetId, pricePerKg, isActive }` entries. Superseded by the `sale_center_sweets` table; retained for backward compatibility only.
- `master_sweets.variants`: package options such as weight, label, and optional fixed price.
- `bookings.customer`: customer contact and address details.
- `bookings.items`: snapshot of ordered sweet and variant details at booking time.
