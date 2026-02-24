# Social Sign-In Setup (Google & GitHub)

Google and GitHub sign-in are implemented using Firebase Authentication. Follow these steps to enable them:

## 1. Enable Google Provider in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **coltek-academy**
3. In the left sidebar, click **Build** → **Authentication**
4. Go to the **Sign-in method** tab
5. Click **Google** in the list of providers
6. Toggle **Enable** to ON
7. Set a **Project support email** (required)
8. Optionally customize the **Project public-facing name**
9. Click **Save**

## 2. Enable GitHub Provider in Firebase Console

1. In **Authentication** → **Sign-in method**, click **GitHub**
2. Toggle **Enable** to ON
3. You need a GitHub OAuth App. Create one at [GitHub Developer Settings](https://github.com/settings/developers):
   - Click **New OAuth App**
   - **Application name**: Coltek Academy
   - **Homepage URL**: `https://your-domain.com` (or `http://localhost:3000` for dev)
   - **Authorization callback URL**: Copy from Firebase (e.g. `https://coltek-academy.firebaseapp.com/__/auth/handler`)
4. Copy the **Client ID** and **Client Secret** from your GitHub OAuth App
5. Paste them into the Firebase GitHub provider configuration
6. Click **Save**

## 3. Configure Authorized Domains

Firebase automatically allows `localhost` for development. For production:

1. In **Authentication** → **Settings** → **Authorized domains**
2. Add your production domain (e.g., `coltekacademy.coltektechnologies.io`)

## 4. Testing

- **Login page** (`/login`): Click "Continue with Google" or "Continue with GitHub"
- **Signup page** (`/signup`): Same options to create an account

Both flows create or update the user document in Firestore under `users/{uid}` with `role: 'student'`.
