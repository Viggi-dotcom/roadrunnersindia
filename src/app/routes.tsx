import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { ExpeditionsPage } from "./pages/ExpeditionsPage";
import { TourDetailPage } from "./pages/TourDetailPage";
import { FleetPage } from "./pages/FleetPage";
import { MapPage } from "./pages/MapPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AdminPage } from "./pages/AdminPage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: HomePage },
      { path: "expeditions", Component: ExpeditionsPage },
      { path: "expeditions/:slug", Component: TourDetailPage },
      { path: "fleet", Component: FleetPage },
      { path: "map", Component: MapPage },
      { path: "dashboard", Component: DashboardPage },
      { path: "admin", Component: AdminPage },
      { path: "admin/login", Component: AdminLoginPage },
      { path: "*", Component: NotFoundPage },
    ],
  },
]);
