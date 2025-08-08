import React, { useRef, useState } from "react";
import * as BlinkIDImageCaptureSDK from "@microblink/blinkid-imagecapture-in-browser-sdk";

const PassportImageUpload = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
console.log('ua up artı ' +process.env.REACT_APP_BLINKID_LICENSE)
    setLoading(true);
    try {
      const loadSettings = new BlinkIDImageCaptureSDK.WasmSDKLoadSettings(process.env.REACT_APP_BLINKID_LICENSE!);
      loadSettings.engineLocation =  window.location.origin +"/resources"; 
      const wasmSDK = await BlinkIDImageCaptureSDK.loadWasmModule(loadSettings);

      const recognizer = await BlinkIDImageCaptureSDK.createBlinkIdImageCaptureRecognizer(wasmSDK);
      const recognizerRunner = await BlinkIDImageCaptureSDK.createRecognizerRunner(wasmSDK, [recognizer], false);

      const imageElement = new Image();
      imageElement.src = URL.createObjectURL(file);
      await imageElement.decode();

      const imageFrame = BlinkIDImageCaptureSDK.captureFrame(imageElement);
      const resultState = await recognizerRunner.processImage(imageFrame);

      if (resultState !== BlinkIDImageCaptureSDK.RecognizerResultState.Empty) {
        const recognitionResult = await recognizer.getResult();
        setResult(recognitionResult);
        console.log("✅ Tarama sonucu:", recognitionResult);
      } else {
        console.warn("❌ Tanıma başarısız.");
      }

      recognizerRunner.delete();
      recognizer.delete();
    } catch (err) {
      console.error("🚨 Hata:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Pasaport Yükle</h2>

      <label
        htmlFor="passportUpload"
        className="border-2 border-dashed border-blue-400 rounded-lg p-6 text-center cursor-pointer hover:bg-blue-50 transition block"
      >
        <svg className="mx-auto mb-2 h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12v9m0 0l-3-3m3 3l3-3M12 3v9" />
        </svg>
        <p className="text-sm text-gray-600">{loading ? "Taranıyor..." : "Dosya seçmek için tıklayın"}</p>
        <p className="text-xs text-gray-400 mt-1">JPG, PNG veya PDF</p>
        <input
          ref={inputRef}
          type="file"
          id="passportUpload"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </label>

      {result && (
        <div className="mt-6 bg-green-100 p-4 rounded text-sm text-gray-900">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default PassportImageUpload;