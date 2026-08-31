# 🎓 Giterp — Multi-School Enterprise ERP Platform (PWA v1.2.0)

A high-performance, installable Progressive Web App (PWA) and multi-tenant CBSE School ERP suite hosted on **Netlify** and powered by an online **MongoDB Atlas** cloud database.

---

## 🌟 Tech Stack & Infrastructure
- **Frontend**: Next.js 16 (Turbopack), React 19, TypeScript, Tailwind CSS, Lucide Icons.
- **PWA Capabilities**: Service Worker (`sw.js` v6), Web App Manifest (`manifest.webmanifest`), 100% Zero-Touch Background Auto-Updates, and Home Screen / Desktop App installation.
- **Backend & APIs**: Next.js App Router Serverless API Routes (`src/app/api/...`).
- **Database**: MongoDB Atlas (`mongodb` driver with serverless singleton connection caching) + Local Media Vault for lightweight instant image loads.
- **Deployment**: Netlify via `@netlify/plugin-nextjs` and `netlify.toml`.

---

## 🚀 Deployment Environment Configuration
Ensure these environment variables are set in your **Netlify Site Configuration**:
- **`MONGODB_URI`**: `mongodb+srv://blistedx_db_user:b7TGgj57Xu8jX3C1@aierp.3kejnhw.mongodb.net/edugit?retryWrites=true&w=majority&appName=AIERP`
- **`ADMIN_NOTIFICATION_EMAIL`**: `blistedx@gmail.com`
- **`SMTP_HOST`**: `smtp.gmail.com`
- **`SMTP_PORT`**: `465`
- **`SMTP_USER`**: `blistedx@gmail.com`
- **`SMTP_PASS`**: `nwnfrdibwtqnfvjd`

---

## 📋 Comprehensive Enterprise Modules
- **Overview Dashboard**: Campus turnout KPIs, daily biometric roll call ledger, real-time fee revenues, and instant quick actions.
- **Student Information System (SIS)**: 504+ preloaded scholars with full CBSE data, APAAR IDs, categories, parents info, and batch promotion studio.
- **Faculty & Staff Portal**: Teacher biometric credentials, CTET qualifications, departments, and payroll profiles.
- **Classes & Sections**: Pre-Primary to Class XII sections, chronological ordering, and capacity monitoring.
- **CBSE Curriculum & Subjects**: Standardized CBSE subject catalog, periods allocation, and teacher assignments.
- **Daily Attendance Ledger**: Real-time student & faculty attendance roll call with session history.
- **Fee Management & Invoicing**: Term fee invoicing, payment receipts, collection rates, and dues tracking.
- **Download & Upload Hub**: High-speed CSV/Excel bulk ingestion and data export engine.
- **CBSE Exams, Marksheets & Reports**: Formative & Summative assessment engines, broadsheets, and report card generators.
- **Certificate Studio**: Automated Transfer Certificates (TC), Bonafide, Character, and Merit certificates.
- **Homework & Digital Diary**: Daily subject coursework assignments and submissions.
- **Leave & Approvals Workflow**: Gate passes, staff leave petitions, and administrative dispatches.
- **Emergency Broadcast**: Multi-channel SMS, Email, and Web Push notifications.
- **Notice Board**: Central gazette and digital circulars.
- **Audit Logs & Security Trail**: Tamper-evident administrative audit records.
- **Institutional Settings**: School profile, CBSE affiliation codes, UDISE+, OASIS, and custom branding logos.

