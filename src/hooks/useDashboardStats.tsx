import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  documentsCount: number;
  tasksInProgress: number;
  overdueTasksCount: number;
  inventoryInStock: number;
  inventoryDeployedThisWeek: number;
  productsCount: number;
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      // Fetch documents count
      const { count: documentsCount } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true });

      // Fetch tasks in progress
      const { count: tasksInProgress } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("status", "in_progress");

      // Fetch overdue tasks (deadline < today and not done)
      const today = new Date().toISOString().split("T")[0];
      const { count: overdueTasksCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .lt("deadline", today)
        .neq("status", "done");

      // Fetch inventory in stock
      const { count: inventoryInStock } = await supabase
        .from("inventory_items")
        .select("*", { count: "exact", head: true })
        .eq("status", "in_stock");

      // Fetch inventory deployed this week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { count: inventoryDeployedThisWeek } = await supabase
        .from("inventory_items")
        .select("*", { count: "exact", head: true })
        .eq("status", "deployed")
        .gte("updated_at", weekAgo.toISOString());

      // Fetch products count
      const { count: productsCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      return {
        documentsCount: documentsCount ?? 0,
        tasksInProgress: tasksInProgress ?? 0,
        overdueTasksCount: overdueTasksCount ?? 0,
        inventoryInStock: inventoryInStock ?? 0,
        inventoryDeployedThisWeek: inventoryDeployedThisWeek ?? 0,
        productsCount: productsCount ?? 0,
      };
    },
  });
};
