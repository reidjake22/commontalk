import { Link, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import {Header} from "./components/Header";
import {Footer} from "./components/Footer";
import "./App.css"; // Assuming you have some global styles
import TopicPage from "./pages/TopicPage";
import SearchPage from "./pages/SearchPage";
export default function App() {
  return (
    <div className="min-h-dvh w-full flex flex-col">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/topics/:topicId" element={<TopicPage />} />
        <Route path="/people/:id" element={<div>Person Page</div>} />
        <Route path="/debates/:id" element={<div>Debate Page</div>} />
        <Route path="/search/:topicId" element={<SearchPage />} />
      </Routes>
      <Footer />
    </div>
  );
}

