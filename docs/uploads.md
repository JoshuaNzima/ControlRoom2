
# How-To: Upload Data by Module

Below are step-by-step instructions for each uploadable item, including navigation and what to expect.

---

## 1) Admin Dashboard

### 1.1 Clients — Bulk Import (Excel/CSV)
1. Go to **Admin → Clients**.
2. Click **Bulk Import** button.
3. **Optional**: Click **Download Template** to get a pre-formatted Excel file.
4. Fill the spreadsheet with client data (columns: Name, Contact Person, Phone, Email, Billing Start Date, etc.).
5. Click **Choose File** (or drag & drop) and select your `.xlsx/.xls/.csv` file.
6. Click **Import Clients**.
7. Review the results: you’ll see counts of successful imports and any row-level errors.

### 1.2 Guards — Add/Edit Guard (Photo)
1. Go to **Admin → Guards**.
2. Click **Add Guard** (or click **Edit** on an existing guard).
3. Fill in guard details.
4. In the **Photo** section:
   - Click **Choose File** and select an image (jpg/png/etc.).
   - Max 5MB.
5. Click **Save**.
6. The photo will be stored and displayed on the guard’s profile.

---

## 2) Super Admin Dashboard

### 2.1 Guards/Drivers — Add/Edit (Photo)
1. Go to **Super Admin → Guards** (or **Drivers**).
2. Click **Add Guard**/**Add Driver** or **Edit** an existing record.
3. Fill in the form.
4. In the **Photo** field:
   - Select an image file (max 5MB).
5. Click **Save**.
6. The photo is attached to the guard/driver record.

---

## 3) Supervisor Dashboard

### 3.1 Attendance — Check-In/Check-Out with Photo
1. Go to **Supervisor → Attendance** (or open the Scanner modal from the Dashboard).
2. Select a guard and site.
3. **Check-In**:
   - Optionally add notes or adjust time.
   - If required, select a photo as proof (max 5MB).
   - Click **Check In**.
4. **Check-Out**:
   - Select the guard.
   - Optionally add notes or adjust time.
   - Optionally select a photo as proof (max 5MB).
   - Click **Check Out**.
5. Photos are stored under `attendance/YYYY-MM-DD/...`.

### 3.2 Downs — Create Down Report with Photo
1. In the Supervisor/Control Room flow, create a Down Report.
2. Choose site and checkpoint.
3. Add a reason.
4. Optionally attach a photo (max 5MB) as evidence.
5. Submit the report.
6. Photo is stored under `downs/YYYY-MM-DD/...`.

---

## 4) Requisitions (System-wide)

### 4.1 Create Requisition with Attachments
1. Click **New requisition** (Quick Requisition modal or Requisitions page).
2. Fill title, category, amount, description, needed by date.
3. In the **Attachments** section:
   - Click **Choose File** (or drag & drop).
   - You can select multiple files.
   - Allowed: PDF, images, Word, Excel (max 10MB each, up to 10 files).
4. Click **Submit requisition**.
5. Files are stored under `requisitions/YYYY/MM/...`.

### 4.2 Add/Remove Attachments Later (Owner Only)
1. Open the requisition details modal.
2. In the **Attachments** section:
   - Click **Choose File** to add more files (same limits as above).
   - Click **Delete** next to any file to remove it.
   - Click **Download** to view a file.
3. Only the original requester can modify attachments, and only while status is `pending_admin`.

---

## 5) Control Room

### 5.1 Create Ticket with Attachments
1. Go to **Control Room → Tickets**.
2. Click **Create Ticket**.
3. Fill title, category, priority, description.
4. In the **Attachments** section:
   - Click **Choose File** and select one or more files.
   - Max 5MB per file (any file type).
5. Click **Create Ticket**.
6. Files are stored under `ticket-attachments/...`.

---

## 6) HR Dashboard

### 6.1 HR Policies — Attach Files to a Policy
1. Go to **HR → Policies**.
2. Click **Edit** on an existing policy (attachments are only available for saved policies).
3. In the **Attachments** section:
   - Click **Upload** and select a file (max 20MB; any file type).
   - Click **Upload** again to confirm.
4. To remove: click **Remove** next to a file.
5. Files are stored under `policies/...`.
6. Only users with `hr.employees.manage` permission can upload/remove files.

---

## 7) Public Website

### 7.1 Careers — Apply with Resume
1. Go to **Public → Careers**.
2. Click **Apply** on a job posting.
3. Fill your name, email, phone, notes.
4. In the **Resume** field:
   - Click **Choose File** and select a PDF/DOC/DOCX (max 5MB).
5. Click **Submit**.
6. Resume is stored under `resumes/...`.

### 7.2 Public Intake — Submit Ticket/Down/Incident with Attachments
1. Use the public intake form (e.g., from the public site).
2. Fill details.
3. Optionally attach one or more files (max 5MB each; any file type).
4. Submit.
5. Files are stored under `public-intake/...`.

---

# Troubleshooting & Common Errors

## File type rejected
- **Clients bulk import**: must be `.xlsx`, `.xls`, or `.csv`.
- **Careers resume**: must be `.pdf`, `.doc`, or `.docx`.
- **Requisition attachments**: must be one of:
  - `pdf/jpg/jpeg/png/doc/docx/xls/xlsx`
- **Images** (avatar/guard/attendance/down): must be a valid image file.

## File too large
- Common limits:
  - **4MB** avatar
  - **5MB** guard photo / attendance photo / down photo / ticket attachments / public intake attachments / resume
  - **10MB** requisition attachments
  - **20MB** HR policy files

## “Forbidden” / 403 errors
- Requisition attachments: only the **request owner** can upload/delete, and only while status is `pending_admin`.
- HR policy files: requires permission `hr.employees.manage`.

---

# Status

## Included in this documentation (confirmed from code)
- **Admin**: Clients bulk import; Guards photo upload  
- **Super Admin**: Guards/Drivers photo upload  
- **Supervisor**: Attendance photos; Down report photo  
- **Requisitions**: Attachments (create + later upload/delete/download)  
- **Control Room**: Ticket attachments  
- **HR**: Policy attachments upload/remove  
- **Public**: Careers resume upload; Public intake attachments  

If you want, I can also turn this into a **Markdown file inside the repo** (e.g. `docs/uploads.md`) and link it from your main documentation area.
