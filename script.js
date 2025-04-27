document.getElementById("scanBtn").addEventListener("click", async () => {
    try {
        // 1. IP-Infos (IPv4, IPv6, Local IP via WebRTC)
        const ipv4Response = await fetch("https://api.ipify.org?format=json");
        const ipv4Data = await ipv4Response.json();
        const ipv4 = ipv4Data.ip;

        let ipv6 = "Nicht verfügbar";
        try {
            const ipv6Response = await fetch("https://api64.ipify.org?format=json");
            const ipv6Data = await ipv6Response.json();
            if (ipv6Data.ip !== ipv4) ipv6 = ipv6Data.ip;
        } catch (e) {}

        // WebRTC Local IP (funktioniert nur in Chrome/Firefox)
        let localIp = "Nicht verfügbar";
        try {
            const rtc = new RTCPeerConnection({ iceServers: [] });
            rtc.createDataChannel("");
            rtc.createOffer()
                .then(offer => rtc.setLocalDescription(offer))
                .catch(e => {});
            rtc.onicecandidate = e => {
                if (e.candidate) {
                    const ip = e.candidate.candidate.split(" ")[4];
                    if (ip.match(/\d+\.\d+\.\d+\.\d+/)) localIp = ip;
                }
            };
        } catch (e) {}

        // 2. Geolocation (präzise Koordinaten)
        let coordinates = "Zugriff verweigert";
        if ("geolocation" in navigator) {
            coordinates = await new Promise(resolve => {
                navigator.geolocation.getCurrentPosition(
                    pos => resolve(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`),
                    () => resolve("Zugriff verweigert")
                );
            });
        }

        // 3. Hardware-Infos
        const cpuCores = navigator.hardwareConcurrency || "Unbekannt";
        const ram = navigator.deviceMemory ? `${navigator.deviceMemory} GB` : "Unbekannt";

        // GPU-Info via WebGL
        let gpu = "Unbekannt";
        try {
            const canvas = document.createElement("canvas");
            const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
            if (gl) {
                const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
                gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            }
        } catch (e) {}

        // 4. Erweiterte Erkennung
        const webglFingerprint = getWebGLFingerprint();
        const audioCodecs = getAudioCodecs();
        const videoCodecs = getVideoCodecs();
        const socialMedia = checkSocialMedia();

        // 5. Tor/VPN-Check (vereinfacht)
        let privacyStatus = "Keine Anomalien";
        if (ipv4.startsWith("185.") || ipv6.startsWith("2a0")) privacyStatus = "⚠️ Möglicher VPN/Tor";

        // Ergebnisse anzeigen
        document.getElementById("ipv4").textContent = ipv4;
        document.getElementById("ipv6").textContent = ipv6;
        document.getElementById("localIp").textContent = `Lokal: ${localIp}`;
        document.getElementById("isp").textContent = await getISP(ipv4);
        document.getElementById("location").textContent = await getLocation(ipv4);
        document.getElementById("coordinates").textContent = coordinates;
        document.getElementById("connection").textContent = getConnectionType();
        document.getElementById("privacyStatus").textContent = privacyStatus;
        document.getElementById("cpu").textContent = cpuCores;
        document.getElementById("ram").textContent = ram;
        document.getElementById("gpu").textContent = gpu;
        document.getElementById("battery").textContent = await getBatteryStatus();
        document.getElementById("deviceModel").textContent = getDeviceModel();
        document.getElementById("os").textContent = getOS();
        document.getElementById("browser").textContent = getBrowser();
        document.getElementById("screen").textContent = `${window.screen.width}×${window.screen.height}`;
        document.getElementById("colorDepth").textContent = `${window.screen.colorDepth} Bit`;
        document.getElementById("timezone").textContent = Intl.DateTimeFormat().resolvedOptions().timeZone;
        document.getElementById("language").textContent = navigator.language;
        document.getElementById("webgl").textContent = webglFingerprint;
        document.getElementById("audioCodecs").textContent = audioCodecs;
        document.getElementById("videoCodecs").textContent = videoCodecs;
        document.getElementById("plugins").textContent = getPlugins();
        document.getElementById("socialMedia").textContent = socialMedia;

    } catch (error) {
        alert("Fehler beim Scannen!");
        console.error(error);
    }
});

// --- Hilfsfunktionen ---
async function getISP(ip) {
    try {
        const response = await fetch(`https://ipapi.co/${ip}/org/`);
        return response.ok ? await response.text() : "Unbekannt";
    } catch {
        return "Unbekannt";
    }
}

async function getLocation(ip) {
    try {
        const response = await fetch(`https://ipapi.co/${ip}/json/`);
        const data = await response.json();
        return data.city ? `${data.city}, ${data.country_name}` : "Unbekannt";
    } catch {
        return "Unbekannt";
    }
}

function getConnectionType() {
    return navigator.connection?.effectiveType || "Unbekannt";
}

async function getBatteryStatus() {
    if ("getBattery" in navigator) {
        const battery = await navigator.getBattery();
        return `${Math.floor(battery.level * 100)}% ${battery.charging ? "(Lädt)" : ""}`;
    }
    return "Nicht verfügbar";
}

function getDeviceModel() {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/i.test(ua)) return "Apple Gerät";
    if (/Samsung/i.test(ua)) return "Samsung Gerät";
    if (/Pixel/i.test(ua)) return "Google Pixel";
    return /Mobi|Android/i.test(ua) ? "Unbekanntes Mobilgerät" : "Desktop";
}

function getWebGLFingerprint() {
    try {
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        if (!gl) return "WebGL nicht unterstützt";
        return gl.getParameter(gl.VENDOR) + " | " + gl.getParameter(gl.RENDERER);
    } catch {
        return "Fehler";
    }
}

function checkSocialMedia() {
    const platforms = [];
    try {
        if (document.createElement("canvas").toDataURL("image/webp").indexOf("data:image/webp") === 0) {
            // Facebook Login Check (vereinfacht)
            if (window.FB) platforms.push("Facebook");
            // Twitter Check
            if (window.twttr) platforms.push("Twitter");
        }
    } catch {}
    return platforms.length ? platforms.join(", ") : "Keine erkannt";
}