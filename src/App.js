import logo from './logo.svg';
import './App.css';
import React from "react";
import WeatherNow from "./components/WeatherNow";

function App() {
  return (
    <div className="w-full min-h-screen">
      <WeatherNow />
    </div>
  );
}
export default App;
