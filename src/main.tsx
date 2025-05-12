import {
  createHashRouter,
  RouterProvider,
} from "react-router";
import React from "react";
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

const router = createHashRouter([
  { path: "/", Component: App },
]);

const rootElement = document.getElementById('root')
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
} else {
  throw new Error("Root element not found");
}
