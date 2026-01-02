import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { createTheme, MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
const queryClient = new QueryClient();
const theme = createTheme({
    primaryColor: 'red',
    fontFamily: 'Inter, sans-serif',
    colors: {
      red: ['#fff1f1', '#ffe0e0', '#fabbbb', '#ff8a8a', '#ff5c5c', '#ff2d2d', '#ff0000', '#e60000', '#cc0000', '#b30000'],
    },
  });
root.render(
  // <React.StrictMode>
  <QueryClientProvider client={queryClient}>
    <MantineProvider theme={theme}>
      <ModalsProvider>
        <Notifications position="bottom-left" />
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ModalsProvider>
    </MantineProvider>
  </QueryClientProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
