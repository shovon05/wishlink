# Supabase Database Webhook Setup Guide

This guide explains how to trigger the email notification API when a new row is inserted into the `notifications` table.

## Step 1: Vercel Environment Variables Configuration
Before setting up the webhook, ensure your Vercel deployment has the necessary environment variables:
1. Go to your project on Vercel Dashboard -> **Settings** -> **Environment Variables**.
2. Add the following keys:
   - `RESEND_API_KEY`: Your API key from Resend.
   - `WEBHOOK_SECRET`: A secure, random string (e.g., generate one using a password generator).
   - `SUPABASE_SERVICE_ROLE_KEY`: Found in Supabase Dashboard -> Project Settings -> API -> `service_role` secret.
   - `NEXT_PUBLIC_SITE_URL`: Your Vercel production URL (e.g., `https://your-app.vercel.app`).
3. Redeploy your application in Vercel to apply the variables.

## Step 2: Supabase Webhook Configuration
1. Log in to the [Supabase Dashboard](https://supabase.com/dashboard) and open your project.
2. On the left sidebar, click on **Database**, then click on **Webhooks**.
3. Click the **Create Webhook** button (or "Enable Webhooks" if it's your first time).
4. Fill out the configuration form:
   - **Name**: `Send Email on Notification` (or any descriptive name).
   - **Table**: Select `notifications` from the dropdown.
   - **Events**: Check the box for `Insert`.
5. Under **Webhook Configuration**:
   - **Type**: Select `HTTP Request`.
   - **Method**: Select `POST`.
   - **URL**: Enter your full Vercel API endpoint URL. 
     *(Example: `https://your-app.vercel.app/api/webhooks/notification-created`)*
6. Under **HTTP Headers**:
   - Click "Add new header".
   - **Header Name**: `x-webhook-secret`
   - **Header Value**: Paste the exact same random string you used for `WEBHOOK_SECRET` in Vercel.
7. Click **Create Webhook** at the bottom to save.

Your webhook is now live. Whenever a user reserves a gift, a notification is inserted, the webhook fires to your Vercel app, and Resend will dispatch the email.
