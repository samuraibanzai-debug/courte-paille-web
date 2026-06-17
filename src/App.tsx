import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useNetworkStatus } from "./hooks/useSession";
import { OfflineBanner } from "./components/UI";
import {
  HomePage, CreatePage, JoinPage,
  LobbyPage, DrawPage, ResultPage,
} from "./pages/Pages";
import "./index.css";

export default function App() {
  const { isOnline } = useNetworkStatus();
  return (
    <BrowserRouter>
      <OfflineBanner isOnline={isOnline} />
      <Routes>
        <Route path="/"              element={<HomePage />} />
        <Route path="/create"        element={<CreatePage />} />
        <Route path="/join"          element={<JoinPage />} />
        <Route path="/lobby/:code"   element={<LobbyPage />} />
        <Route path="/draw/:code"    element={<DrawPage />} />
        <Route path="/result/:code"  element={<ResultPage />} />
        <Route path="*"              element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
