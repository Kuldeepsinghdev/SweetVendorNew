# Database Design

The application uses PostgreSQL through Drizzle ORM. Relationships below are logical application relationships because the current schema does not declare SQL foreign-key constraints.

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
        jsonb sweets "embedded city sweet pricing"
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
        text address_hi
        text address_en
        varchar pincode
        text timing
        text map_url
        boolean is_active
        varchar gstin
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
        varchar center_id FK
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
    CITIES ||--o{ MITRA_APPLICATIONS : "city_id"
    CITIES ||--o{ BOOKINGS : "city_id"
    CITIES ||--o{ DISCOUNTS : "city_id"
    SALE_CENTERS ||--o{ BOOKINGS : "center_id"
    SALE_CENTERS ||--o{ DISCOUNTS : "center_id"
    FESTIVALS ||--o{ BOOKINGS : "festival_id"
    DISCOUNTS ||--o{ BOOKINGS : "discount_code"
    MITRA_APPLICATIONS ||--o{ BOOKINGS : "mitra_id"
    MASTER_SWEETS }o--o{ CITIES : "sweets.sweetId"
    MASTER_SWEETS }o--o{ BOOKINGS : "items.sweetId"
```

## Table Responsibilities

| Table | Purpose |
|---|---|
| `master_sweets` | National master catalog of sweets, variants, pricing metadata, and bilingual content. |
| `cities` | City network configuration and city-specific sweet availability/pricing stored in `sweets` JSONB. |
| `sale_centers` | Pickup and distribution centers belonging to cities. |
| `festivals` | Festival booking windows, cutoffs, distribution dates, and credit limits. |
| `mitra_applications` | Sahakar Mitra registration, approval, and credit-limit data. |
| `bookings` | Customer/Mitra orders, pickup details, payment status, discounts, and fulfillment state. |
| `discounts` | City/center-scoped coupon definitions and usage limits. |
| `audit_logs` | Administrative activity history. |
| `notification_templates` | SMS/email notification configuration and message templates. |

## Embedded JSONB Structures

- `cities.sweets`: city-specific `{ sweetId, pricePerKg, isActive }` entries.
- `master_sweets.variants`: package options such as weight, label, and optional fixed price.
- `bookings.customer`: customer contact and address details.
- `bookings.items`: snapshot of ordered sweet and variant details at booking time.
