import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { pushRoute } from "./navigationMemory";
import Home from "./pages/Home";
import NewTrade from "./pages/NewTrade";
import Statistics from "./pages/Statistics";
import History from "./pages/History";

function RouteTracker({ children }: { children: ReactNode }) {
  const location = useLocation();

  useEffect(() => {
    pushRoute(location.pathname);
  }, [location.pathname]);

  return children;
}

function App() {

  return (
    <BrowserRouter>
  <RouteTracker>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/new-trade" element={<NewTrade />} />
      <Route path="/statistics" element={<Statistics />} />
      <Route path="/history" element={<History />} />
    </Routes>
  </RouteTracker>
</BrowserRouter>
  );
}

export default App;