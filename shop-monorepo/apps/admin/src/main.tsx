import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "@/shared/lib/queryClient"
import { ThemeProvider } from "@/shared/theme/ThemeProvider"
import { AuthProvider } from "@/features/auth/AuthProvider"
import App from "./App"
import "./index.css"
import { NotificationDock } from "./shared/components/feedback/NotificationDock"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <App />
          <NotificationDock />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
)