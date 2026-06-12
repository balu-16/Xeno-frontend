import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

let clientQueryClient: QueryClient | undefined;

export const getRouter = () => {
  const isServer = typeof window === "undefined";
  const queryClient = isServer
    ? new QueryClient()
    : (clientQueryClient ??= new QueryClient());

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 30_000, // 30s instead of 0 to reuse preloaded data
  });

  return router;
};
