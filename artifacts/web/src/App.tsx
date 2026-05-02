import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminKeyProvider } from "@/contexts/AdminKeyContext";
import { RoleProvider, useRole } from "@/contexts/RoleContext";
import { AuthProvider } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/layout";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Inventory from "@/pages/inventory";
import Orders from "@/pages/orders";
import PlaceOrder from "@/pages/place-order";
import SetupBusiness from "@/pages/setup-business";
import type { ComponentType } from "react";

const queryClient = new QueryClient();

function CustomerRoute({ component: Component }: { component: ComponentType }) {
  const { role } = useRole();
  if (!role) return <Redirect to="/" />;
  if (role === "business") return <Redirect to="/dashboard" />;
  return <Component />;
}

function BusinessRoute({ component: Component }: { component: ComponentType }) {
  const { role } = useRole();
  if (!role) return <Redirect to="/" />;
  if (role === "customer") return <Redirect to="/place-order" />;
  return <Component />;
}

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login/:role" component={Login} />
        <Route path="/place-order">
          <CustomerRoute component={PlaceOrder} />
        </Route>
        <Route path="/dashboard">
          <BusinessRoute component={Dashboard} />
        </Route>
        <Route path="/inventory">
          <BusinessRoute component={Inventory} />
        </Route>
        <Route path="/orders">
          <BusinessRoute component={Orders} />
        </Route>
        <Route path="/setup-business">
          <BusinessRoute component={SetupBusiness} />
        </Route>
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <RoleProvider>
            <AdminKeyProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
              <Toaster />
            </AdminKeyProvider>
          </RoleProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
