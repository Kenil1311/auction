import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Auction from "./pages/Auction";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auction" element={<Auction />} />
      </Routes>
    </Router>
  );
}

export default App;
