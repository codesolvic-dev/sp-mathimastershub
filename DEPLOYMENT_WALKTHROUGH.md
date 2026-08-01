# Separate Deployment Walkthrough: Vercel (Backend) + Hostinger (Frontend)

We have updated the codebase to support separate deployments. This is a much cleaner architecture:
- **Backend (Express)** will live on Vercel as a standalone serverless API.
- **Frontend (Vite)** will be compiled into static HTML/JS/CSS files and uploaded to Hostinger.

Here is the step-by-step guide to complete this setup.

---

## 🛠️ Step 1: Deploy Backend to Vercel

Since the backend needs to be in its own repository for standalone Vercel hosting, follow these steps to isolate and deploy it:

### 1. Create a New Git Repository for the Backend
Open a separate terminal window on your computer and run these commands to isolate the `backend` folder:

```bash
# 1. Go into your project's backend directory
cd d:\sir-ammar\sp_builder\backend

# 2. Initialize a new Git repository here
git init

# 3. Add all files in this directory
git add .

# 4. Commit the files
git commit -m "Initial commit for standalone Vercel backend"
```

### 2. Push Backend to a New GitHub Repository
1. Go to **GitHub** and create a new **private or public repository** named `sp-builders-backend`.
2. Copy the Git push commands provided by GitHub (under "push an existing repository") and run them in your terminal:
   ```bash
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/sp-builders-backend.git
   git branch -M main
   git push -u origin main
   ```

### 3. Import and Configure the Backend on Vercel
1. Go to the **[Vercel Dashboard](https://vercel.com/)**.
2. Click **Add New...** → **Project**.
3. Import your newly created `sp-builders-backend` repository.
4. **Project Settings:**
   - **Framework Preset:** Leave it as **Other**.
   - **Root Directory:** `./`
5. **Environment Variables:** Expand this section and add your backend configuration:

| Key | Value | Description |
| :--- | :--- | :--- |
| **`MONGO_URI`** | `mongodb+srv://abbasjabbar0344_db_user:hee59yyRTDyOgOzC@cluster0.wf1yadn.mongodb.net/sp_builder?appName=Cluster0` | MongoDB Connection URI |
| **`JWT_SECRET`** | `sd9f8sdf7sdf8sdf78sdf78sdf` | Auth Token Secret |
| **`STRIPE_SECRET_KEY`** | `sk_test_51...` (Your Stripe Key) | Stripe Secret Key |
| **`CLOUDINARY_CLOUD_NAME`** | `dzd6t77ep` | Cloudinary Name |
| **`CLOUDINARY_API_KEY`** | `543222148229338` | Cloudinary API Key |
| **`CLOUDINARY_API_SECRET`** | `KYr_P10YP_hBNlvowVTYNrKE0SI` | Cloudinary API Secret |
| **`FRONTEND_URLS`** | `https://your-hostinger-domain.com` | Your live Hostinger domain (for CORS) |

6. Click **Deploy**. Vercel will build and assign you a backend URL (e.g. `https://sp-builders-backend.vercel.app`). **Copy this URL.**

---

## 💻 Step 2: Build the Frontend for Hostinger

Now that the backend is deployed on Vercel, we need to build the frontend with the Vercel URL baked in.

### 1. Update the Frontend environment config
Open your local `d:\sir-ammar\sp_builder\frontend\.env` file and set the backend URL:

```env
# Point this to your new Vercel Backend URL
VITE_API_URL=https://sp-builders-backend.vercel.app
```

### 2. Run the Build Command
In your local terminal, navigate to the `frontend` folder and run the production build:

```bash
cd d:\sir-ammar\sp_builder\frontend
npm run build
```

This will run `vite build` and generate a `dist` directory (`d:\sir-ammar\sp_builder\frontend\dist`).
This `dist` folder contains:
- `index.html`
- `assets/` (compiled JavaScript, CSS, images)
- `logo-removebg-preview.png` and favicon files

---

## 🌐 Step 3: Upload Frontend to Hostinger

Hostinger provides standard web/file hosting. You just need to upload the contents of the `dist` folder to your site's root:

1. Log in to your **Hostinger hPanel**.
2. Go to **File Manager** for your domain.
3. Open the **`public_html`** folder (which is the root directory of your website).
4. **Upload all files and folders** inside `d:\sir-ammar\sp_builder\frontend\dist` directly into the `public_html` folder.
   > **Note:** Do not upload the `dist` folder itself, upload the **contents** of it so that `index.html` is directly inside `public_html`.

### ⚡ React Router (SPA) 404 Fix on Hostinger
If you refresh the page on routes like `/about` or `/shop` on Hostinger, you might get a **404 Not Found** error. This is because Hostinger uses an Apache server and doesn't know how to route SPA URLs to `index.html`.

To fix this, create a file named **`.htaccess`** in the `public_html` directory of your Hostinger server and paste this configuration:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

This tells Hostinger to forward all requests back to `index.html` so React Router can load the correct page!

---

### 🎉 Done!
Your site is now fully decoupled:
- Users will visit `https://your-domain.com` (served statically and super fast by Hostinger).
- When users register, login, or query products, the Hostinger frontend will make HTTP requests directly to `https://sp-builders-backend.vercel.app`.
