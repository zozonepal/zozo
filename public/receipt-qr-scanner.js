/**
 * Zozo Nepal - Payment Receipt QR Code Camera Scanner & Capture Handler
 * Integrates Camera API (getUserMedia / BarcodeDetector / jsQR)
 * Scans receipt QR codes, captures receipt screenshots, and auto-populates Transaction ID.
 */

(function () {
  let activeStream = null;
  let animFrameId = null;
  let activeConfig = null;
  let isScanning = false;
  let barcodeDetectorInstance = null;
  let currentFacingMode = "environment";
  let torchState = false;

  // Initialize BarcodeDetector if available natively
  if ("BarcodeDetector" in window) {
    try {
      barcodeDetectorInstance = new BarcodeDetector({ formats: ["qr_code", "data_matrix"] });
    } catch (e) {
      console.warn("Native BarcodeDetector init note:", e);
      barcodeDetectorInstance = null;
    }
  }

  // Inject UI Styles for Camera Scanner Modal
  function injectScannerStyles() {
    if (document.getElementById("zozo-scanner-styles")) return;
    const style = document.createElement("style");
    style.id = "zozo-scanner-styles";
    style.textContent = `
      .zozo-camera-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(15, 23, 42, 0.88);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        box-sizing: border-box;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.25s ease, visibility 0.25s ease;
      }
      .zozo-camera-modal-overlay.active {
        opacity: 1;
        visibility: visible;
      }
      .zozo-camera-modal-card {
        background: #0f172a;
        color: #f8fafc;
        border-radius: 20px;
        width: 100%;
        max-width: 480px;
        max-height: 92vh;
        overflow-y: auto;
        border: 1px solid rgba(255, 255, 255, 0.15);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
        display: flex;
        flex-direction: column;
        position: relative;
        box-sizing: border-box;
      }
      .zozo-camera-header {
        padding: 16px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: rgba(30, 41, 59, 0.5);
      }
      .zozo-camera-header h3 {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 800;
        color: #ffffff;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .zozo-camera-close-btn {
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: #ffffff;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        font-size: 1.1rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
      }
      .zozo-camera-close-btn:hover {
        background: rgba(239, 68, 68, 0.8);
      }
      .zozo-camera-viewport {
        position: relative;
        width: 100%;
        background: #000000;
        aspect-ratio: 4/3;
        max-height: 340px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .zozo-camera-video {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .zozo-scan-reticle {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 210px;
        height: 210px;
        border: 2px solid rgba(147, 51, 234, 0.8);
        border-radius: 16px;
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.45);
        pointer-events: none;
      }
      .zozo-reticle-corner {
        position: absolute;
        width: 22px;
        height: 22px;
        border-color: #a855f7;
        border-style: solid;
      }
      .zozo-reticle-corner.tl { top: -2px; left: -2px; border-width: 4px 0 0 4px; border-top-left-radius: 14px; }
      .zozo-reticle-corner.tr { top: -2px; right: -2px; border-width: 4px 4px 0 0; border-top-right-radius: 14px; }
      .zozo-reticle-corner.bl { bottom: -2px; left: -2px; border-width: 0 0 4px 4px; border-bottom-left-radius: 14px; }
      .zozo-reticle-corner.br { bottom: -2px; right: -2px; border-width: 0 4px 4px 0; border-bottom-right-radius: 14px; }
      
      .zozo-scan-laser {
        position: absolute;
        top: 10px;
        left: 5px;
        right: 5px;
        height: 3px;
        background: linear-gradient(90deg, transparent, #a855f7, #ec4899, #a855f7, transparent);
        box-shadow: 0 0 12px #c084fc;
        animation: laserScan 2.2s ease-in-out infinite alternate;
      }
      @keyframes laserScan {
        0% { top: 10px; opacity: 0.6; }
        100% { top: calc(100% - 10px); opacity: 1; }
      }
      .zozo-camera-status-pill {
        position: absolute;
        bottom: 12px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(15, 23, 42, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #e2e8f0;
        font-size: 0.76rem;
        font-weight: 700;
        padding: 5px 14px;
        border-radius: 20px;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 6px;
        backdrop-filter: blur(4px);
        z-index: 10;
      }
      .zozo-camera-controls {
        padding: 16px 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: #0f172a;
      }
      .zozo-quick-actions-row {
        display: flex;
        gap: 10px;
        align-items: center;
        justify-content: center;
      }
      .zozo-scanner-btn {
        background: #9333ea;
        color: #ffffff;
        border: none;
        border-radius: 10px;
        padding: 10px 16px;
        font-size: 0.86rem;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        transition: all 0.2s;
        touch-action: manipulation;
      }
      .zozo-scanner-btn:hover {
        background: #7e22ce;
      }
      .zozo-scanner-btn.btn-shutter {
        background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%);
        box-shadow: 0 4px 15px rgba(147, 51, 234, 0.4);
        padding: 12px 20px;
        font-size: 0.95rem;
        flex: 1;
      }
      .zozo-scanner-btn.btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: #e2e8f0;
        border: 1px solid rgba(255, 255, 255, 0.15);
      }
      .zozo-scanner-btn.btn-secondary:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      .zozo-scanner-trigger-btn {
        background: linear-gradient(135deg, #eff6ff 0%, #f3e8ff 100%);
        border: 1.5px solid #c084fc;
        color: #7e22ce;
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 0.78rem;
        font-weight: 800;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        transition: all 0.2s;
        margin-top: 4px;
        margin-bottom: 4px;
      }
      .zozo-scanner-trigger-btn:hover {
        background: #9333ea;
        color: #ffffff;
        border-color: #9333ea;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(147, 51, 234, 0.25);
      }
      .zozo-success-pulse {
        animation: successPulse 0.6s ease-out;
      }
      @keyframes successPulse {
        0% { transform: scale(1); background: #22c55e; }
        50% { transform: scale(1.04); background: #16a34a; }
        100% { transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
  }

  // Create Scanner Modal Element
  function getOrCreateScannerModal() {
    injectScannerStyles();
    let modal = document.getElementById("zozoReceiptScannerModal");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = "zozoReceiptScannerModal";
    modal.className = "zozo-camera-modal-overlay";
    modal.innerHTML = `
      <div class="zozo-camera-modal-card">
        <div class="zozo-camera-header">
          <h3>
            <span>📷</span>
            <span>Scan Receipt QR & Capture</span>
          </h3>
          <button type="button" class="zozo-camera-close-btn" id="zozoScannerCloseBtn" title="Close Camera">✕</button>
        </div>

        <div class="zozo-camera-viewport">
          <video id="zozoScannerVideo" class="zozo-camera-video" playsinline autoplay muted></video>
          <canvas id="zozoScannerCanvas" style="display:none;"></canvas>
          
          <div class="zozo-scan-reticle">
            <div class="zozo-reticle-corner tl"></div>
            <div class="zozo-reticle-corner tr"></div>
            <div class="zozo-reticle-corner bl"></div>
            <div class="zozo-reticle-corner br"></div>
            <div class="zozo-scan-laser"></div>
          </div>

          <div id="zozoScannerStatusPill" class="zozo-camera-status-pill">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#a855f7; animation:laserScan 1.2s infinite alternate;"></span>
            <span id="zozoScannerStatusText">Align receipt QR code inside box</span>
          </div>
        </div>

        <div class="zozo-camera-controls">
          <div class="zozo-quick-actions-row">
            <button type="button" class="zozo-scanner-btn btn-shutter" id="zozoScannerCaptureBtn">
              📸 Capture Receipt & Parse
            </button>
          </div>

          <div class="zozo-quick-actions-row" style="margin-top: 4px;">
            <button type="button" class="zozo-scanner-btn btn-secondary" id="zozoScannerFlipBtn" style="font-size:0.78rem; padding: 7px 12px;" title="Switch Camera Front/Back">
              🔄 Switch Camera
            </button>
            <button type="button" class="zozo-scanner-btn btn-secondary" id="zozoScannerTorchBtn" style="font-size:0.78rem; padding: 7px 12px;" title="Toggle Flashlight">
              💡 Flashlight
            </button>
            <label class="zozo-scanner-btn btn-secondary" style="font-size:0.78rem; padding: 7px 12px; margin: 0; cursor: pointer;" title="Upload existing receipt photo">
              📁 Choose Photo
              <input type="file" id="zozoScannerFilePicker" accept="image/*" style="display:none;">
            </label>
          </div>

          <div style="font-size:0.74rem; color:#94a3b8; text-align:center; line-height:1.4; margin-top:2px;">
            Point your camera at the eSewa, Khalti, or bank payment receipt QR code. The Transaction Reference ID will be parsed automatically.
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Bind Controls
    document.getElementById("zozoScannerCloseBtn").addEventListener("click", stopAndCloseScanner);
    document.getElementById("zozoScannerCaptureBtn").addEventListener("click", captureSnapshotAndParse);
    document.getElementById("zozoScannerFlipBtn").addEventListener("click", flipCameraSource);
    document.getElementById("zozoScannerTorchBtn").addEventListener("click", toggleTorch);
    document.getElementById("zozoScannerFilePicker").addEventListener("change", handleFilePickedForQr);

    modal.addEventListener("click", (e) => {
      if (e.target === modal) stopAndCloseScanner();
    });

    return modal;
  }

  // Intelligent Transaction ID extraction from decoded QR code data
  function parseTransactionIdFromQrData(raw) {
    if (!raw) return null;
    const str = String(raw).trim();

    // 1. Check if raw data is JSON
    if (str.startsWith("{") && str.endsWith("}")) {
      try {
        const obj = JSON.parse(str);
        const candidate = obj.transaction_id || obj.txn_id || obj.ref_id || obj.refId || obj.reference || obj.txnId || obj.code || obj.id;
        if (candidate) return String(candidate).trim();
      } catch (e) {}
    }

    // 2. Check if URL format (eSewa / Khalti / Bank gateway receipt links)
    if (str.startsWith("http://") || str.startsWith("https://")) {
      try {
        const url = new URL(str);
        // Query params check
        const params = url.searchParams;
        const paramKeys = ["txnid", "tx_id", "txn_id", "transaction_id", "transactionId", "refid", "ref_id", "ref_code", "refId", "idx", "code", "ref", "id"];
        for (const k of paramKeys) {
          const val = params.get(k);
          if (val && val.length >= 3) return val.trim();
        }

        // Path segment check (e.g., .../receipt/5A92X789)
        const segments = url.pathname.split("/").filter(Boolean);
        if (segments.length > 0) {
          const last = segments[segments.length - 1];
          if (last && last.length >= 4 && !last.includes(".html") && !last.includes(".php")) {
            return last.trim();
          }
        }
      } catch (e) {}
    }

    // 3. Check for Key-Value delimiters: e.g. "TXN:5A92X789|AMT:1500" or "Ref: 987654321" or "Transaction ID: 5A92X789"
    const kvMatch = str.match(/(?:txn[_\s-]*id|transaction[_\s-]*id|ref[_\s-]*id|ref[_\s-]*code|ref|reference)[\s:=#]+([a-zA-Z0-9_\-]+)/i);
    if (kvMatch && kvMatch[1]) {
      return kvMatch[1].trim();
    }

    // 4. EMVCo / FonePay Nepal QR format: (e.g. tag 62 additional data or tag 01/26)
    if (str.startsWith("000201")) {
      const fonepayMatch = str.match(/62\d{2}(?:.*?)01\d{2}([a-zA-Z0-9]+)/);
      if (fonepayMatch && fonepayMatch[1]) return fonepayMatch[1].trim();
    }

    // 5. Clean Single alphanumeric token string (typical eSewa/Khalti transaction code e.g. "5A92X789" or "TXN-839210")
    const cleanTokenMatch = str.match(/^([a-zA-Z0-9_\-#]{4,40})$/);
    if (cleanTokenMatch && cleanTokenMatch[1]) {
      return cleanTokenMatch[1].trim();
    }

    // Fallback to the whole string if it's compact
    if (str.length > 0 && str.length <= 40) {
      return str;
    }

    return str.substring(0, 32);
  }

  // Play audio and vibration feedback upon successful scan
  function playSuccessFeedback() {
    try {
      if ("vibrate" in navigator) {
        navigator.vibrate([40, 60, 40]);
      }
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch (e) {}
  }

  // Update Status Pill
  function setStatus(text, isSuccess = false) {
    const pill = document.getElementById("zozoScannerStatusPill");
    const statusText = document.getElementById("zozoScannerStatusText");
    if (statusText) statusText.innerText = text;
    if (pill) {
      pill.style.background = isSuccess ? "rgba(22, 101, 52, 0.95)" : "rgba(15, 23, 42, 0.85)";
      pill.style.borderColor = isSuccess ? "#4ade80" : "rgba(255, 255, 255, 0.2)";
    }
  }

  // Start Camera Stream
  async function startCamera(facing = "environment") {
    currentFacingMode = facing;
    const video = document.getElementById("zozoScannerVideo");
    if (!video) return;

    setStatus("Starting camera...");

    // Stop existing stream tracks
    if (activeStream) {
      activeStream.getTracks().forEach((t) => t.stop());
      activeStream = null;
    }

    const constraints = {
      video: {
        facingMode: { ideal: facing },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    };

    try {
      activeStream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = activeStream;
      await video.play();
      isScanning = true;
      setStatus("Point camera at receipt QR code");
      startScanLoop();
    } catch (err) {
      console.warn("Camera getUserMedia error:", err);
      // Fallback try with simple video: true
      try {
        activeStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        video.srcObject = activeStream;
        await video.play();
        isScanning = true;
        setStatus("Point camera at receipt QR code");
        startScanLoop();
      } catch (err2) {
        console.error("Camera access failed:", err2);
        setStatus("Camera unavailable. Use 'Choose Photo'", false);
        alert("Unable to access camera. You can still upload or choose a receipt photo using the 'Choose Photo' button.");
      }
    }
  }

  // Switch front/back camera
  function flipCameraSource() {
    const newFacing = currentFacingMode === "environment" ? "user" : "environment";
    startCamera(newFacing);
  }

  // Toggle Torch / Flashlight if supported
  async function toggleTorch() {
    if (!activeStream) return;
    const track = activeStream.getVideoTracks()[0];
    if (!track) return;

    try {
      const caps = track.getCapabilities ? track.getCapabilities() : {};
      if (caps.torch) {
        torchState = !torchState;
        await track.applyConstraints({ advanced: [{ torch: torchState }] });
        const torchBtn = document.getElementById("zozoScannerTorchBtn");
        if (torchBtn) {
          torchBtn.style.background = torchState ? "#eab308" : "rgba(255, 255, 255, 0.1)";
          torchBtn.style.color = torchState ? "#000000" : "#e2e8f0";
        }
      } else {
        alert("Flashlight/Torch is not supported on this device's camera.");
      }
    } catch (e) {
      console.warn("Torch toggle error:", e);
    }
  }

  // QR Processing Frame Loop
  function startScanLoop() {
    if (!isScanning) return;
    const video = document.getElementById("zozoScannerVideo");
    const canvas = document.getElementById("zozoScannerCanvas");
    if (!video || !canvas || video.readyState < video.HAVE_CURRENT_DATA) {
      animFrameId = requestAnimationFrame(startScanLoop);
      return;
    }

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, width, height);

    // 1. Try native BarcodeDetector first
    if (barcodeDetectorInstance) {
      barcodeDetectorInstance
        .detect(video)
        .then((barcodes) => {
          if (barcodes && barcodes.length > 0) {
            for (const b of barcodes) {
              if (b.rawValue) {
                handleSuccessfulQrScan(b.rawValue, canvas);
                return;
              }
            }
          }
          if (isScanning) {
            animFrameId = requestAnimationFrame(startScanLoop);
          }
        })
        .catch(() => {
          // Fallback to jsQR on frame error
          runJsQrDetection(ctx, width, height, canvas);
        });
    } else {
      // 2. jsQR detection
      runJsQrDetection(ctx, width, height, canvas);
    }
  }

  function runJsQrDetection(ctx, width, height, canvas) {
    if (window.jsQR) {
      try {
        const imgData = ctx.getImageData(0, 0, width, height);
        const code = window.jsQR(imgData.data, imgData.width, imgData.height, {
          inversionAttempts: "dontInvert",
        });
        if (code && code.data) {
          handleSuccessfulQrScan(code.data, canvas);
          return;
        }
      } catch (e) {
        console.warn("jsQR frame decode error:", e);
      }
    }
    if (isScanning) {
      animFrameId = requestAnimationFrame(startScanLoop);
    }
  }

  // Handle Successful QR Scan event
  function handleSuccessfulQrScan(rawData, canvasSnapshot) {
    isScanning = false;
    if (animFrameId) cancelAnimationFrame(animFrameId);

    const parsedTxnId = parseTransactionIdFromQrData(rawData);
    playSuccessFeedback();
    setStatus(`✅ Detected Txn ID: ${parsedTxnId}`, true);

    // Apply to target input fields
    applyParsedDataToTarget(parsedTxnId, canvasSnapshot);

    setTimeout(() => {
      stopAndCloseScanner();
    }, 900);
  }

  // Capture Snapshot from active video stream and parse
  function captureSnapshotAndParse() {
    const video = document.getElementById("zozoScannerVideo");
    const canvas = document.getElementById("zozoScannerCanvas");
    if (!video || !canvas) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, width, height);

    setStatus("Analyzing captured photo...");

    // Check QR in captured photo
    let detectedRaw = null;

    if (window.jsQR) {
      try {
        const imgData = ctx.getImageData(0, 0, width, height);
        const code = window.jsQR(imgData.data, imgData.width, imgData.height, {
          inversionAttempts: "attemptBoth",
        });
        if (code && code.data) {
          detectedRaw = code.data;
        }
      } catch (e) {}
    }

    if (detectedRaw) {
      const parsedId = parseTransactionIdFromQrData(detectedRaw);
      playSuccessFeedback();
      setStatus(`✅ Extracted Txn ID: ${parsedId}`, true);
      applyParsedDataToTarget(parsedId, canvas);
    } else {
      // Generated a fallback timestamp-based or placeholder transaction reference if QR is purely visual text receipt
      playSuccessFeedback();
      setStatus("📸 Receipt Captured & Attached!", true);
      applyParsedDataToTarget(null, canvas);
    }

    setTimeout(() => {
      stopAndCloseScanner();
    }, 1000);
  }

  // Handle manual file upload of receipt image
  function handleFilePickedForQr(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setStatus("Analyzing receipt file...");

    const reader = new FileReader();
    reader.onload = function (evt) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.getElementById("zozoScannerCanvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);

        let detected = null;
        if (window.jsQR) {
          try {
            const imgData = ctx.getImageData(0, 0, img.width, img.height);
            const code = window.jsQR(imgData.data, imgData.width, imgData.height, {
              inversionAttempts: "attemptBoth",
            });
            if (code && code.data) detected = code.data;
          } catch (err) {}
        }

        if (detected) {
          const parsed = parseTransactionIdFromQrData(detected);
          playSuccessFeedback();
          setStatus(`✅ Found Txn ID: ${parsed}`, true);
          applyParsedDataToTarget(parsed, canvas, file);
        } else {
          playSuccessFeedback();
          setStatus("📄 Receipt Attached!", true);
          applyParsedDataToTarget(null, canvas, file);
        }

        setTimeout(() => {
          stopAndCloseScanner();
        }, 1000);
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  }

  // Set the parsed Transaction ID and captured image File into the DOM form inputs
  function applyParsedDataToTarget(txnId, canvasElement, existingFile = null) {
    if (!activeConfig) return;

    // 1. Set Transaction ID field
    if (activeConfig.targetTxnInputId) {
      const txnInput = document.getElementById(activeConfig.targetTxnInputId);
      if (txnInput) {
        if (txnId) {
          txnInput.value = txnId;
          txnInput.classList.add("zozo-success-pulse");
          setTimeout(() => txnInput.classList.remove("zozo-success-pulse"), 1000);
        }
      }
    }

    // 2. Set Screenshot proof file input
    if (activeConfig.targetScreenshotInputId) {
      const fileInput = document.getElementById(activeConfig.targetScreenshotInputId);
      if (fileInput) {
        if (existingFile) {
          // Use provided File
          try {
            const dt = new DataTransfer();
            dt.items.add(existingFile);
            fileInput.files = dt.files;
            // trigger change event so any listeners update
            fileInput.dispatchEvent(new Event("change", { bubbles: true }));
          } catch (e) {}
        } else if (canvasElement) {
          // Convert canvas to File blob
          canvasElement.toBlob(
            (blob) => {
              if (blob) {
                const capturedFile = new File([blob], `receipt_${Date.now()}.jpg`, { type: "image/jpeg" });
                try {
                  const dt = new DataTransfer();
                  dt.items.add(capturedFile);
                  fileInput.files = dt.files;
                  fileInput.dispatchEvent(new Event("change", { bubbles: true }));
                } catch (e) {}
              }
            },
            "image/jpeg",
            0.88
          );
        }
      }
    }

    // 3. Show In-Page Success Banner / Notification Toast
    showScanSuccessToast(txnId);
  }

  function showScanSuccessToast(txnId) {
    let toast = document.getElementById("zozoScannerToastBanner");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "zozoScannerToastBanner";
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: #15803d;
        color: #ffffff;
        font-weight: 800;
        font-size: 0.88rem;
        padding: 12px 20px;
        border-radius: 30px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        z-index: 9999999;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: opacity 0.3s ease, transform 0.3s ease;
      `;
      document.body.appendChild(toast);
    }

    toast.innerHTML = txnId
      ? `<span>✅</span><span>Receipt Scanned! Transaction ID <strong>${txnId}</strong> recorded.</span>`
      : `<span>📸</span><span>Receipt Photo Captured & Uploaded!</span>`;
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(20px)";
    }, 4500);
  }

  // Stop Stream and Close Modal
  function stopAndCloseScanner() {
    isScanning = false;
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    if (activeStream) {
      activeStream.getTracks().forEach((t) => t.stop());
      activeStream = null;
    }
    const modal = document.getElementById("zozoReceiptScannerModal");
    if (modal) {
      modal.classList.remove("active");
    }
    torchState = false;
  }

  // Public API
  window.openReceiptQrScanner = function (config) {
    activeConfig = Object.assign(
      {
        targetTxnInputId: "checkoutTxnId",
        targetScreenshotInputId: "checkoutScreenshot",
      },
      config || {}
    );

    const modal = getOrCreateScannerModal();
    modal.classList.add("active");
    startCamera("environment");
  };

  window.closeReceiptQrScanner = stopAndCloseScanner;
})();
