import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Catalog from "./pages/Catalog";
import Compare from "./pages/Compare";
import Estimate from "./pages/Estimate";
import Run from "./pages/Run";
import ResultDetail from "./pages/ResultDetail";
import SuiteResults from "./pages/SuiteResults";
import Jobs from "./pages/Jobs";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Catalog />} />
          <Route path="/estimate" element={<Estimate />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/run" element={<Run />} />
          <Route path="/results/:id" element={<ResultDetail />} />
          <Route path="/suite-runs/:id" element={<SuiteResults />} />
          <Route path="/jobs" element={<Jobs />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
