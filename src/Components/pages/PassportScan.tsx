
import React, { useRef, useState } from 'react';
import { createBlinkId } from '@microblink/blinkid';

const PassportScan: React.FC = () => {
  const videoRef = useRef<HTMLDivElement>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleScan = async () => {
    const lets =  process.env.REACT_APP_BLINKID_LICENSE;
    setLoading(true);
    try {
        const blinkId = await createBlinkId({
            licenseKey: process.env.REACT_APP_BLINKID_LICENSE!,
            resourcesLocation: window.location.origin +'/resources',
            targetNode: videoRef.current!,
            scanningSettings: {
              blurDetectionLevel: 'high',
              glareDetectionLevel: 'high',
              tiltDetectionLevel: 'mid',
              skipImagesWithBlur: true,
              skipImagesWithGlare: true,
              skipImagesWithInadequateLightingConditions: true,
              skipImagesOccludedByHand: true,
              combineResultsFromMultipleInputImages: true,
              enableBarcodeScanOnly: false,
              customDocumentRules: [],
              customDocumentAnonymizationSettings: [],
              returnInputImages: false,
              scanCroppedDocumentImage: false,
              enableCharacterValidation: true,
              inputImageMargin: 0.02,
              scanUnsupportedBack: false,
              allowUncertainFrontSideScan: false,
              maxAllowedMismatchesPerField: 0,
              scanPassportDataPageOnly: true,
              croppedImageSettings: {
                extensionFactor: 0.1,
                returnDocumentImage: true,
                returnFaceImage: false,
                returnSignatureImage: false,
                dotsPerInch: 300,
              },
              recognitionModeFilter: {
                enableMrzId: true,
  enableMrzVisa: true,
  enableMrzPassport: true,
  enableBarcodeId: true,
  enablePhotoId: false,
  enableFullDocumentRecognition: false,
              }
            }
          });
          await blinkId.cameraManager.startCameraStream();

          blinkId.addOnResultCallback((result) => {
            console.log("✅ Sonuç:", result);
          });
          
         
          blinkId.addOnErrorCallback((err) => {
            console.error("❌ Hata:", err);
          });

    } catch (err) {
      console.error('🚨 Tarama hatası:', err);
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="p-6 border border-[#E50914] rounded-lg shadow-md bg-white">
  <h2 className="block text-lg font-semibold text-gray-900 mb-5">
    Pasaport Tarama Alanı
  </h2>

  <div
    ref={videoRef}
    className="w-full h-[400px] bg-gray-100 rounded border border-gray-300 mb-4"
  />

  <button
    onClick={handleScan}
    disabled={loading}
    className="w-full py-2  bg-[#E50914] text-white font-semibold rounded hover:bg-blue-700 transition"
  >
    {loading ? 'Taranıyor...' : 'Taramayı Başlat'}
  </button>

  {result && (
    <div className="mt-6 bg-green-50 border border-green-300 p-4 rounded text-sm text-gray-800">
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  )}
</div>
  );
};

export default PassportScan;