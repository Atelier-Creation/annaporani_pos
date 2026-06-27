# My App – React + Vite + Tailwind + AuthContext

This project is a modern web application built using **React**, **Vite**, **Tailwind CSS**, and **Context API** for authentication. The folder structure is clean and scalable, making it ideal for small to medium-sized applications.

---

## 📁 Project Structure

```
my-app/  # replace with the project directory name 
├── public/                  # Static files
│   └── favicon.svg
├── src/
│   ├── assets/              # Images, icons, and logo files
│   │   └── images/, icons/, logos/...
│   ├── components/
│   │   ├── common/          # Shared UI components (Button, Modal, etc.)
│   │   └── layout/          # Layout components (Navbar, Sidebar, etc.)
│   ├── context/
│   │   └── AuthContext.jsx  # Authentication context and provider
│   ├── hooks/
│   │   └── useAuth.js       # Custom hook to access auth context
│   ├── pages/               # Application pages
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   └── NotFound.jsx
│   ├── routes/
│   │   └── AppRoutes.jsx    # All route definitions, protected routes
│   ├── services/
│   │   └── api.js           # Axios instance or API service wrappers
│   ├── styles/
│   │   └── index.css        # Tailwind base styles (imported here)
│   ├── utils/
│   │   └── helpers.js       # Utility/helper functions
│   ├── App.jsx              # Main app component with layout wrappers
│   └── main.jsx             # Vite entry point
├── tailwind.config.js       # Tailwind configuration
├── postcss.config.js        # PostCSS config for Tailwind
├── index.html               # Main HTML template
├── package.json             # Project metadata and scripts
└── vite.config.js           # Vite configuration
```

---

## 🚀 Getting Started

### 1. **Clone the repository**

```bash
git clone https://github.com/your-username/your-repo-name.git
cd ssms  ** / replace with the project directory name **
```

### 2. **Install dependencies**

```bash
npm install
```

### 3. **Run the app in development mode**

```bash
npm run dev
```

The app will be available at: `http://localhost:5173`

---

## 🔧 Scripts

| Command           | Description                      |
| ----------------- | -------------------------------- |
| `npm run dev`     | Start development server (Vite)  |
| `npm run build`   | Build the app for production     |
| `npm run preview` | Preview production build locally |
| `npm run lint`    | Lint your code (if configured)   |

---

## 🧠 Features

* ⚛️ React with functional components and hooks
* ⚡ Vite for fast builds and hot module replacement
* 🎨 Tailwind CSS for utility-first styling
* 🔐 Context API for Authentication management
* 📦 Modular folder structure for scalability
* 🌐 Axios setup for API integration

---

## 📁 Folder Details

| Folder        | Purpose                                              |
| ------------- | ---------------------------------------------------- |
| `assets/`     | Static images, icons, logos                          |
| `components/` | Reusable and layout components                       |
| `context/`    | Global state management using Context API            |
| `hooks/`      | Custom React hooks                                   |
| `pages/`      | Different page components of the app                 |
| `routes/`     | Route configuration and protection (e.g. auth guard) |
| `services/`   | API call utilities (like Axios instances)            |
| `styles/`     | Tailwind and other global styles                     |
| `utils/`      | Utility/helper functions                             |

---

## 🛡️ Authentication

Authentication is handled using React Context. The `AuthContext.jsx` manages user login state and provides access to auth methods through the `useAuth()` hook.

---




src/
│
├───app/                            # App initialization & root setup
│   │   App.jsx
│   │   main.jsx
│   └───routes/
│           RootRoutes.jsx
│
├───shared/                         # Shared components, layout, assets, hooks
│   ├───components/
│   │       Loading.jsx
│   │       NotFound.jsx
│   │
│   ├───layout/
│   │       Header.jsx
│   │       Footer.jsx
│   │       Sidebar.jsx
│   │       MainLayout.jsx
│   │
│   ├───hooks/
│   │       useAuth.js
│   │
│   ├───assets/
│   │       [your images...]
│   │
│   └───context/
│           AuthContext.jsx
│           ProtectedRoute.jsx
│           ThemeContext.jsx
│
├───modules/                        # MVVC modules (company, hrms, etc.)
│
│   ├───company/
│   │   ├───model/                 # API services, DTOs
│   │   │       companyService.js
│   │   │       divisionService.js
│   │   │       departmentService.js
│   │   │       branchService.js
│   │   │       addressService.js
│   │   │       api.js
│   │   │
│   │   ├───view/                  # Pages and Components
│   │   │   ├───components/
│   │   │   │       CompanyForm.jsx
│   │   │   └───pages/
│   │   │           Company.jsx
│   │   │           Branch.jsx
│   │   │           Department.jsx
│   │   │           DivisionMaster.jsx
│   │   │
│   │   └───controller/           # ViewControllers for business logic
│   │           useCompanyController.js
│   │           useBranchController.js
│   │           useDivisionController.js
│   │
│   ├───hrms/
│   │   ├───model/
│   │   │       employeeService.js
│   │   │       roleService.js
│   │   │       shiftService.js
│   │   │       api.js
│   │   │
│   │   ├───view/
│   │   │   ├───components/
│   │   │   │       EmployeeForm.jsx
│   │   │   │       ShiftForm.jsx
│   │   │   └───pages/
│   │   │           Dashboard.jsx
│   │   │           EmployeeList.jsx
│   │   │           ShiftConfig.jsx
│   │   │           RoleMasters.jsx
│   │   │
│   │   └───controller/
│   │           useEmployeeController.js
│   │           useShiftController.js
│   │           useRoleController.js
│
│   └───login/
│       ├───view/
│       │       Login.jsx
│       │       Login.css
│       └───controller/
│               useLoginController.js
│
├───utils/
│       errorHandler.js
│       helpers.js
│
└───config/
        env.js                     # Environment-specific config
        axios.js                   # Axios global config (optional)


