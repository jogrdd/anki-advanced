import {
  createHashRouter,
  RouterProvider,
} from "react-router";
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import AppLegacy from "./AppLegacy.tsx";

const router = createHashRouter([
  { path: "/", Component: App },
  { path: "/editor-poc", Component: AppLegacy },
]);

const rootElement = document.getElementById('root')
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  );
} else {
  throw new Error("Root element not found");
}
