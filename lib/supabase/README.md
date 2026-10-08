# Supabase Initial Schema Setup

This document explains how to apply the initial database schema to your Supabase project.

## How to Apply the Schema

1.  **Access Supabase Dashboard:**
    *   Open your web browser and navigate to the Supabase website.
    *   Log in to your account.
    *   Select your project from the dashboard.

2.  **Open SQL Editor:**
    *   On the left-hand sidebar of your project dashboard, click on the **SQL Editor** icon (it looks like a terminal window with `>_`).

3.  **Create a New Query:**
    *   Click the **New Query** button. This will open a blank SQL editor window.

4.  **Paste and Run:**
    *   Copy the entire contents of the `supabase/migrations/<timestamp>_initial_schema.sql` file.
    *   Paste it into the blank SQL editor window.
    *   Click the **Run** button (or press `Cmd/Ctrl + Enter`) to execute the SQL commands.

5.  **Verify Execution:**
    *   Look at the "Results" panel below the SQL editor. You should see a success message indicating that the commands ran without errors. If there are errors, they will be displayed here in red text.

## How to Verify the Setup

1.  **Verify Tables:**
    *   On the left-hand sidebar, click on **Table Editor**.
    *   You should see four new tables listed: `profiles`, `addresses`, `wishlist_items`, and `gift_reservations`.

2.  **Verify RLS Policies:**
    *   On the left-hand sidebar, click on **Authentication**, then select **Policies**.
    *   Verify that Row Level Security (RLS) is enabled for all four tables.
    *   Click on each table to see the specific policies that were created (e.g., "Public profiles are viewable by everyone").

3.  **Verify Triggers (Optional but Recommended):**
    *   Click on **Database** on the left sidebar, then select **Triggers**.
    *   You should see two triggers: `on_auth_user_created` (on the `auth.users` table) and `on_gift_reservation_before_insert` (on the `gift_reservations` table).

## Troubleshooting SQL Errors

*   **Syntax Errors:** If you get a syntax error, double-check that you copied the entire SQL file correctly.
*   **"Relation already exists" Errors:** This means you are trying to create a table or index that is already there. If you need to start fresh, you might have to manually drop the existing tables or use a database reset command (be careful, this deletes all data).
*   If you encounter other errors, read the error message carefully. It usually points to the specific line or operation that failed.
