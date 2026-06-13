import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import NewTrade from "./pages/NewTrade";
import Statistics from "./pages/Statistics";
import History from "./pages/History";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/new-trade" element={<NewTrade />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;