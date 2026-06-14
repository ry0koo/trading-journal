import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import NewTrade from "./pages/NewTrade";
import Statistics from "./pages/Statistics";
import History from "./pages/History";
import { TransitionGroup, CSSTransition } from "react-transition-group";

function App() {
  function AnimatedRoutes() {
  const location = useLocation();

  return (
    <TransitionGroup>
      <CSSTransition
        key={location.pathname}
        classNames="page"
        timeout={250}
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/new-trade" element={<NewTrade />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </CSSTransition>
    </TransitionGroup>
  );
}
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;