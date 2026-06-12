import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/verify-email")({
  component: () => <Navigate to="/dashboard" replace />,
});
