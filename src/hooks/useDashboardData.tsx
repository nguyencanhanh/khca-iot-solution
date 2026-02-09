import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;
type InventoryItem = Tables<"inventory_items">;

interface TaskWithAssignee extends Task {
  assignee?: {
    full_name: string;
  } | null;
}

export const useRecentTasks = () => {
  return useQuery({
    queryKey: ["recent-tasks"],
    queryFn: async (): Promise<TaskWithAssignee[]> => {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          assignee:profiles!tasks_assignee_id_fkey(full_name)
        `)
        .order("updated_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
  });
};

export const useRecentInventory = () => {
  return useQuery({
    queryKey: ["recent-inventory"],
    queryFn: async (): Promise<InventoryItem[]> => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(4);

      if (error) throw error;
      return data || [];
    },
  });
};
