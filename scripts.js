import { $ } from "./dom.js";

class GoogleTranslator {
  static SUPPORTED_LANGUAGES = [
    "en",
    "es",
    "fr",
    "de",
    "it",
    "pt",
    "ru",
    "ja",
    "zh",
  ];
  static FULL_LANGUAGE_CODES = {
    en: "en-US",
    es: "es-ES",
    fr: "fr-FR",
    de: "de-DE",
    it: "it-IT",
    pt: "pt-PT",
    ru: "ru-RU",
    ja: "ja-JP",
    zh: "zh-CN",
  };
  static DEFAULT_SOURCE_LANGUAGE = "es";
  static DEFAULT_TARGET_LANGUAGE = "en";
  constructor() {
    this.init();
    this.setupEventListeners();

    this.currentTranslatorKey = null;
    this.translateTimeout = null;
    this.currentTranslator = null;
    this.currentDetector = null;
  }
  init() {
    this.inputText = $("#inputText");
    this.outputText = $("#outputText");

    this.sourceLanguage = $("#sourceLanguage");
    this.targetLanguage = $("#targetLanguage");
    this.swapLanguage = $("#swapLanguages");

    this.micButton = $("#micButton");
    this.copyButton = $("#copyButton");
    this.speakerButton = $("#speakerButton");
    //Configuración Inicial
    this.targetLanguage.value = GoogleTranslator.DEFAULT_TARGET_LANGUAGE;

    //Chequear API Translate
    this.checkAPISupport();
  }

  checkAPISupport() {
    this.hasNativeTranslate = "Translator" in window;
    this.hasLanguageDetector = "LanguageDetector" in window;

    if (!this.hasNativeTranslate || !this.hasLanguageDetector) {
      console.warn("APIS no soportadas en este navegador");
    } else {
      console.log("APIS nativas de IA disponibles");
    }
  }
  setupEventListeners() {
    this.inputText.addEventListener("input", () => {
      // Debounce
      clearTimeout(this.translateTimeout);
      this.translateTimeout = setTimeout(() => {
        if (this.sourceLanguage.value === "auto") {
          this.detectLanguage(this.inputText.value);
        } else {
          this.translate();
        }
      }, 500);
    });

    this.sourceLanguage.addEventListener("change", () => {
      if (this.sourceLanguage.value !== "auto") {
        this.translate();
      }
    });
    this.targetLanguage.addEventListener("change", () => this.translate());
    this.swapLanguage.addEventListener("click", () => this.swapLanguages());
  }

  async detectLanguage(text) {
    try {
      const status = await window.LanguageDetector.availability();
      if (status === "unavailable") {
        throw new Error("Detección de idioma no disponible");
      }
    } catch (error) {
      console.log(error);
      throw new Error("Detección de idioma no disponible");
    }
    try {
      if (!this.currentDetector) {
        this.currentDetector = await window.LanguageDetector.create();
      }
    } catch (error) {
      console.log(error);
      throw new Error("Error al inicializar el detector de idioma");
    }

    const detectLanguage = await this.currentDetector.detect(text);

    this.sourceLanguage.value = detectLanguage[0].detectedLanguage;
    console.log("Idioma fuente establecido en:", this.sourceLanguage.value);
    this.translate();
  }
  // Revisar disponibilidad de traducción
  async getTranslation(text) {
    const sourceLanguage = this.sourceLanguage.value;
    const targetLanguage = this.targetLanguage.value;

    if (sourceLanguage === targetLanguage) {
      return text;
    } else if (sourceLanguage === "auto") {
      throw new Error(
        'Debes detectar el idioma fuente antes de traducir (no se permite "auto" aquí)'
      );
    }

    try {
      const status = await window.Translator.availability({
        sourceLanguage,
        targetLanguage,
      });
      if (status === "unavailable") {
        throw new Error(
          "Traducción no disponible para los idiomas seleccionados"
        );
      }
    } catch (error) {
      console.log(error);
      throw new Error(
        "Traducción no disponible para los idiomas seleccionados"
      );
    }

    // Realizar traducción
    const translatorKey = `${sourceLanguage}-${targetLanguage}`;

    try {
      if (
        !this.currentTranslator ||
        this.currentTranslatorKey !== translatorKey
      ) {
        this.currentTranslator = await window.Translator.create({
          sourceLanguage,
          targetLanguage,
        });
      }
      this.currentTranslatorKey = translatorKey;

      const translation = await this.currentTranslator.translate(text);

      return translation;
    } catch (error) {
      console.log(error);
      throw new Error("Error al traducir el texto");
    }
  }

  async translate() {
    const text = this.inputText.value;
    if (!text) {
      this.outputText.textContent = " ";
      return;
    }
    this.outputText.textContent = "Traduciendo...";

    try {
      const translation = await this.getTranslation(text);
      this.outputText.textContent = translation;
    } catch (error) {
      this.outputText.textContent = error.message;
    }
  }
  swapLanguages() {
    const sourceLang = this.sourceLanguage.value;
    const targetLang = this.targetLanguage.value;
    if (sourceLang === "auto") {
      return;
    } else {
      this.targetLanguage.value = sourceLang;
      this.sourceLanguage.value = targetLang;
    }
    this.inputText.value = this.outputText.textContent;
    this.outputText.textContent = this.inputText.value ? "Traduciendo..." : " ";
    this.translate();
  }

  //   window.addEventListener("DOMContentLoaded", () => {
  //   new GoogleTranslator();
  // });
}
const translatorApp = new GoogleTranslator();
