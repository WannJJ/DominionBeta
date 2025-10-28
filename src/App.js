import React, { useState, useEffect, useContext } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import { AppContext } from "./contexts/AppContext.jsx";

import SigninPage from "./features/SigninPage/SigninPage.jsx";
import LobbyPage from "./features/LobbyPage/LobbyPage.jsx";
import ProtectedRoute from "./features/routes/ProtectedRoute.jsx";
import Result from "./features/AfterGame/Result.jsx";
import MainPage from "./features/MainPage/MainPage.jsx";
import { GameEngine, MULTIPLAYER_MODE } from "./main.js";

import { CheckAuthHook } from "./api/signin.js";

const App = () => {
  const { isAuthenticated, isGameStarted, isGameEnded } =
    useContext(AppContext);
  const { check_auth } = CheckAuthHook();

  useEffect(() => {
    if (MULTIPLAYER_MODE) check_auth();
  }, []); // // Dependency array trống, chỉ chạy một lần khi component mount

  return (
    <BrowserRouter>
      <Routes>
        {/* Route SigninPage */}
        <Route
          path="/signin"
          element={
            <ProtectedRoute
              condition={!isAuthenticated && MULTIPLAYER_MODE}
              redirectTo="/lobby"
            >
              <SigninPage />
            </ProtectedRoute>
          }
        />

        {/* Route LobbyPage */}
        <Route
          path="/lobby"
          element={
            <ProtectedRoute
              condition={MULTIPLAYER_MODE && isAuthenticated && !isGameStarted}
              redirectTo="/"
            >
              <LobbyPage />
            </ProtectedRoute>
          }
        />

        {/* Route MainPage */}
        <Route
          path="/"
          element={
            <ProtectedRoute
              condition={
                !MULTIPLAYER_MODE || (isAuthenticated && isGameStarted)
              }
              redirectTo="/result"
            >
              <MainPage />
            </ProtectedRoute>
          }
        />

        {/* Route Result */}
        <Route
          path="/result"
          element={
            <ProtectedRoute condition={isGameEnded} redirectTo="/signin">
              <Result />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
