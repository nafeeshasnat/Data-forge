
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from '@/components/ui/toaster';
import Home from '@/app/page';
import MergePage from '@/app/merge/page';
import TrimPage from '@/app/trim/page'; // Import the new Trim page
import SingleStudentPage from '@/app/single/page';
import AnalysisPage from '@/app/analysis/page';
import './index.css';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/merge",
    element: <MergePage />,
  },
  {
    path: "/trim",
    element: <TrimPage />,
  },
  {
    path: "/single",
    element: <SingleStudentPage />,
  },
  {
    path: "/analysis",
    element: <AnalysisPage />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
    <Toaster />
  </React.StrictMode>
);
