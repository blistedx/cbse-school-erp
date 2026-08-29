# 🎓 EduGit — Multi-School Enterprise ERP Platform (PWA)

A high-performance, installable Progressive Web App (PWA) and multi-tenant School ERP suite hosted on **Netlify** and powered by an online **MongoDB Atlas** cloud database.

---

## 🌟 Tech Stack (Netlify Native & PWA Ready)
- **Frontend**: Next.js 16 (Turbopack), React 19, TypeScript, Tailwind CSS, Lucide Icons.
- **PWA Capabilities**: Service Worker (`sw.js`), Web App Manifest (`manifest.webmanifest`), offline asset caching, and standalone home screen installation.
- **Backend**: Next.js App Router API Routes (`src/app/api/...`).
- **Database**: MongoDB Atlas (`mongodb` driver with serverless singleton connection caching).
- **Deployment**: Netlify via `@netlify/plugin-nextjs` and `netlify.toml`.

---

## 🚀 How to Deploy to Netlify (1-Click / Git Integration)

### Method 1: Push to GitHub & Import to Netlify
1. Push this repository to your GitHub account:
   ```bash
   git add .
   git commit -m "feat: EduGit PWA ERP with MongoDB Atlas & Netlify"
   git branch -M main
   git push -u origin main
   ```
2. Go to **[https://app.netlify.com](https://app.netlify.com)** → **Add new site** → **Import an existing project**.
3. In the **Site configuration > Environment variables** section, add:
   - **`MONGODB_URI`**: `mongodb+srv://blistedx_db_user:b7TGgj57Xu8jX3C1@aierp.3kejnhw.mongodb.net/edugit?retryWrites=true&w=majority&appName=AIERP`
   - **`ADMIN_NOTIFICATION_EMAIL`**: `blistedx@gmail.com`
   - **`SMTP_HOST`**: `smtp.gmail.com`
   - **`SMTP_PORT`**: `465`
   - **`SMTP_USER`**: `blistedx@gmail.com`
   - **`SMTP_PASS`**: `nwnfrdibwtqnfvjd`
4. Click **Deploy Site**! 🚀

---

### Method 2: Deploy via Netlify CLI
```bash
npm install -g netlify-cli
netlify deploy --build --prod
```

---

## 📱 Mobile & PWA Installation
- **Android**: Open URL in Chrome → Tap menu (⋮) → **Install App**
- **iOS**: Open URL in Safari → Tap Share (⎙) → **Add to Home Screen**
- **Desktop**: Click the **Install** button in Chrome/Edge address bar

---

## 📋 Core Modules & Routes
- `/` — EduGit Landing Page & Institutional Register
- `/login` — School Portal Sign-In (Admin, Faculty, Students)
- `/agency` — Super-Admin / Agency Hub & School Onboarding Approvals
- `/request-demo` — Instant school workspace registration
- `/app` — Full ERP workspace (SIS, Attendance, Fees, Timetable, Staff, Notices)
- `/api/...` — RESTful Next.js Serverless API endpoints
