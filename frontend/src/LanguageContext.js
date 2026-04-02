// frontend/LanguageContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations } from './translations';

// Создаем контекст
export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  // Проверяем, есть ли сохраненный язык в памяти браузера, иначе ставим английский
  const [language, setLanguage] = useState(localStorage.getItem('lang') || 'en');

  // Функция для смены языка
  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('lang', lang);
  };

  // Главная функция перевода (t - сокращение от translate)
  const t = (key) => {
    return translations[language][key] || key; // Если перевода нет, вернет сам ключ
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Хук, чтобы легко использовать переводчик в любом файле
export const useLanguage = () => useContext(LanguageContext);