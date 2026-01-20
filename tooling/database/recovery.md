# Recover a Cloud SQL database from backup (GCP)

This guide describes how to recover a Cloud SQL database using an automated backup in Google Cloud Console.

## Before you start (read first)
- **Confirm environment:** be 100% sure you are operating in **dev vs prod** (project selector in GCP console).
- **Prefer restoring to a new instance** when possible:
    - Safer (doesn’t overwrite the current DB)
    - Typically faster to “get service back” (you can switch traffic when ready)
    - Easier rollback (switch back to old instance if needed)

### Prerequisites
- Access to the correct **GCP project** and **Cloud SQL Admin** permissions.
- The target Cloud SQL instance and an available **backup** for the desired point in time.
- Knowledge of where your application configures DB connectivity (connection name/host, user, password, DB name).

## Decision guide
- **Recommended:** Restore to a **new instance** → validate → switch application connection → decommission old instance when safe.
- **Alternative (higher risk):** Restore **in place** on the existing instance → overwrites data on that instance.

---

## Step 1 — Find the right backup
1. Open Google Cloud Console: https://console.cloud.google.com/
2. Select the correct **project** (double-check dev/prod).
3. Go to **Cloud SQL** → select the **instance** you want to recover.
4. Open the **Backups** tab.
5. Choose the appropriate backup

---

## Option A (recommended) — Restore to a *new* instance
Use this when you want the safest recovery with an easy rollback.

1. In **Backups**, click **Restore** on the chosen backup.
2. Select **Restore to a new instance**.
3. Configure the new instance:
    - **Name:** use a clear suffix (e.g. `-restore-YYYYMMDD-HHMM`)
    - **Region:** same as original (unless you have a specific reason)
    - Keep settings consistent with the original unless you intentionally want changes
4. Start the restore and wait for completion.

### After restore: validate before switching traffic
- Confirm the instance is **healthy** in Cloud SQL overview.
- Connect and run basic checks:
    - expected DB exists
    - core tables/row counts look sane
    - critical app queries/load paths work
- If the application uses migrations, ensure you understand the state before applying anything new.

### Switch the application to the restored instance
- Update the application configuration (connection string / Cloud SQL connection name) to point to the **new instance**.
- Restart/redeploy the application if needed.
- Monitor logs and key metrics (errors, latency, connection pool saturation).

### Rollback plan
If anything looks wrong after switching:
- Point the application back to the **original instance** (still untouched).
- Re-investigate backup selection and restore again if needed.

---

## Option B — Restore *in place* (overwrite existing instance)
Only use this if you explicitly want to replace the data in the current instance.

1. In **Backups**, click **Restore** on the chosen backup.
2. Select **Restore to the existing instance**.
3. Confirm the warning prompts (this will overwrite data).
4. Wait for the restore to complete.
5. Validate application behavior and data.

---

## Estimated time
- A ~200 MB database restore often takes **~5–7 minutes** when restoring to the existing instance.
- Restoring to a **new instance** is generally recommended for **speed-to-recovery** and **safety**, even if total end-to-end time includes validation and a config switch.
