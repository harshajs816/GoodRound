import { useQuery } from "@tanstack/react-query";
import api from "./api";

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const response = await api.get("/subscriptions/plans");
      return response.data.plans ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}