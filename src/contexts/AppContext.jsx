
import React, { createContext, useState } from 'react';

// Tạo context
export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Đăng nhập chưa?
  const [isGameStarted, setIsGameStarted] = useState(false); // Game bắt đầu chưa?
  const [isGameEnded, setIsGameEnded] = useState(false); // Game kết thúc chưa?

  return (
    <AppContext.Provider value={{ isAuthenticated, setIsAuthenticated, 
                                  isGameStarted, setIsGameStarted,
                                  isGameEnded, setIsGameEnded,
                                }}
    >
      {children}
    </AppContext.Provider>
  );
};
