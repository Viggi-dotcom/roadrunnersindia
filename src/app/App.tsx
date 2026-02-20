import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { router } from "./routes";

export default function App() {
  return (
    <div className="size-full">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#242424",
            border: "2px solid #333",
            color: "#F4F4F5",
            borderRadius: "0px",
            fontFamily: "Oswald, sans-serif",
            letterSpacing: "0.05em",
          },
        }}
      />
      <RouterProvider router={router} />
    </div>
  );
}
