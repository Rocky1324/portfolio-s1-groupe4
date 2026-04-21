document.addEventListener("DOMContentLoaded", () => {
    // --- AUDIO API (Sound Design) ---
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    let fanOsc = null, fanGain = null;
    let rainOsc = null, rainGain = null;

    function createWhiteNoise() {
        const bufferSize = audioCtx.sampleRate * 2; // 2 seconds
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;
        return noise;
    }

    function toggleFanSound(active) {
        if(audioCtx.state === 'suspended') audioCtx.resume();
        if(active && !fanOsc) {
            fanOsc = createWhiteNoise();
            fanGain = audioCtx.createGain();
            
            // Filtre passe-bas pour simuler le vent
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 400;

            fanGain.gain.setValueAtTime(0, audioCtx.currentTime);
            fanGain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 1);

            fanOsc.connect(filter);
            filter.connect(fanGain);
            fanGain.connect(audioCtx.destination);
            fanOsc.start();
        } else if(!active && fanGain) {
            fanGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
            setTimeout(() => { if(fanOsc) { fanOsc.stop(); fanOsc.disconnect(); fanOsc = null; } }, 500);
        }
    }

    function toggleRainSound(active) {
        if(audioCtx.state === 'suspended') audioCtx.resume();
        if(active && !rainOsc) {
            rainOsc = createWhiteNoise();
            rainGain = audioCtx.createGain();
            
            // Filtre passe-haut pour simuler la pluie
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 1000;

            rainGain.gain.setValueAtTime(0, audioCtx.currentTime);
            rainGain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 1);

            rainOsc.connect(filter);
            filter.connect(rainGain);
            rainGain.connect(audioCtx.destination);
            rainOsc.start();
        } else if(!active && rainGain) {
            rainGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
            setTimeout(() => { if(rainOsc) { rainOsc.stop(); rainOsc.disconnect(); rainOsc = null; } }, 500);
        }
    }

    const container = document.getElementById('canvas-svt');
    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(15, 10, 20);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    // --- CRÉATION DE LA SERRE ---
    
    // Sol
    const groundGeo = new THREE.PlaneGeometry(20, 20);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x27ae60 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Structure Serre (Murs transparents)
    const glassMat = new THREE.MeshPhysicalMaterial({ 
        color: 0xffffff, 
        transmission: 0.9, 
        opacity: 0.3, 
        transparent: true,
        roughness: 0.1,
        ior: 1.5 
    });

    const houseGroup = new THREE.Group();

    const bodyGeo = new THREE.BoxGeometry(10, 6, 14);
    const body = new THREE.Mesh(bodyGeo, glassMat);
    body.position.y = 3;
    houseGroup.add(body);

    const roofGeo = new THREE.ConeGeometry(8, 4, 4);
    const roof = new THREE.Mesh(roofGeo, glassMat);
    roof.position.y = 8;
    roof.rotation.y = Math.PI / 4;
    houseGroup.add(roof);
    
    // Cadre (Armature)
    const frameGeo = new THREE.EdgesGeometry(bodyGeo);
    const frameMat = new THREE.LineBasicMaterial({ color: 0xbdc3c7, linewidth: 2 });
    const frame = new THREE.LineSegments(frameGeo, frameMat);
    frame.position.y = 3;
    houseGroup.add(frame);

    scene.add(houseGroup);

    // Plantes (Sphères vertes à l'intérieur)
    for(let i=0; i<8; i++){
        const plantGeo = new THREE.SphereGeometry(Math.random()*0.5 + 0.5, 16, 16);
        const plantMat = new THREE.MeshStandardMaterial({ color: 0x2ecc71 });
        const plant = new THREE.Mesh(plantGeo, plantMat);
        plant.position.set((Math.random() - 0.5) * 8, 0.5, (Math.random() - 0.5) * 12);
        houseGroup.add(plant);
    }

    // Ventilateur
    const fanGroup = new THREE.Group();
    const fanBoxGeo = new THREE.BoxGeometry(2, 2, 0.5);
    const fanBox = new THREE.Mesh(fanBoxGeo, new THREE.MeshStandardMaterial({color: 0x34495e}));
    fanGroup.add(fanBox);
    
    const bladeGeo = new THREE.BoxGeometry(1.8, 0.2, 0.1);
    const blade1 = new THREE.Mesh(bladeGeo, new THREE.MeshStandardMaterial({color: 0xecf0f1}));
    const blade2 = new THREE.Mesh(bladeGeo, new THREE.MeshStandardMaterial({color: 0xecf0f1}));
    blade2.rotation.z = Math.PI / 2;
    fanGroup.add(blade1);
    fanGroup.add(blade2);
    
    fanGroup.position.set(0, 4, 7); // Sur un mur
    houseGroup.add(fanGroup);

    // Système de pluie (Particules)
    const rainCount = 500;
    const rainGeo = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 3);
    for(let i=0; i<rainCount; i++){
        rainPositions[i*3] = (Math.random() - 0.5) * 9; // x
        rainPositions[i*3+1] = Math.random() * 5 + 1; // y
        rainPositions[i*3+2] = (Math.random() - 0.5) * 13; // z
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({ color: 0x3498db, size: 0.1, transparent: true, opacity: 0.6 });
    const rainSystem = new THREE.Points(rainGeo, rainMat);
    rainSystem.visible = false; // Caché par défaut
    houseGroup.add(rainSystem);

    // Variables d'état
    let isVentilating = false;
    let isRaining = false;
    let autoMode = false;
    
    let temp = 35.0;
    let hum = 30.0;

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();

        // Animation ventilateur
        if(isVentilating) {
            blade1.rotation.z += 0.2;
            blade2.rotation.z += 0.2;
        }

        // Animation pluie
        if(isRaining) {
            const positions = rainSystem.geometry.attributes.position.array;
            for(let i=0; i<rainCount; i++){
                positions[i*3+1] -= 0.1; // Tombe
                if(positions[i*3+1] < 0) {
                    positions[i*3+1] = 6; // Remonte au plafond
                }
            }
            rainSystem.geometry.attributes.position.needsUpdate = true;
        }

        renderer.render(scene, camera);
    }
    animate();

    // Redimensionnement
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    // --- LOGIQUE UI ---
    const ventBtn = document.getElementById('vent-btn');
    const rainBtn = document.getElementById('rain-btn');
    const autoBtn = document.getElementById('auto-btn');
    const tempVal = document.getElementById('temp-val');
    const tempStatus = document.getElementById('temp-status');
    const humVal = document.getElementById('hum-val');
    const humStatus = document.getElementById('hum-status');

    function updateUI() {
        tempVal.innerText = temp.toFixed(1) + "°C";
        humVal.innerText = hum.toFixed(1) + "%";

        if(temp > 28) { tempVal.style.color = '#ff9f43'; tempStatus.innerText = "Trop chaud!"; tempStatus.style.color = "var(--accent-red)"; }
        else { tempVal.style.color = '#2ecc71'; tempStatus.innerText = "Optimal"; tempStatus.style.color = "var(--accent-green)"; }

        if(hum < 50) { humVal.style.color = '#00d2ff'; humStatus.innerText = "Trop sec!"; humStatus.style.color = "var(--accent-red)"; }
        else { humVal.style.color = '#2ecc71'; humStatus.innerText = "Optimal"; humStatus.style.color = "var(--accent-green)"; }
    }

    ventBtn.addEventListener('click', () => {
        isVentilating = !isVentilating;
        ventBtn.innerText = isVentilating ? "Arrêter Ventilation" : "Activer Ventilation";
        toggleFanSound(isVentilating);
    });

    rainBtn.addEventListener('click', () => {
        isRaining = !isRaining;
        rainSystem.visible = isRaining;
        rainBtn.innerText = isRaining ? "Arrêter Pluie" : "Activer Pluie";
        toggleRainSound(isRaining);
    });

    autoBtn.addEventListener('click', () => {
        autoMode = !autoMode;
        autoBtn.innerText = autoMode ? "Désactiver Auto" : "Mode 100% Automatique";
        if(autoMode) autoBtn.style.background = "linear-gradient(90deg, #ff3366, #ff6b6b)";
        else autoBtn.style.background = "linear-gradient(90deg, var(--accent-green), #20bf55)";
    });

    // Boucle de simulation des capteurs
    setInterval(() => {
        if(autoMode) {
            // Logique auto
            if(temp > 25) { 
                if(!isVentilating) { isVentilating = true; toggleFanSound(true); }
            } else { 
                if(isVentilating) { isVentilating = false; toggleFanSound(false); }
            }

            if(hum < 60) {
                if(!isRaining) { isRaining = true; toggleRainSound(true); rainSystem.visible = true; }
            } else {
                if(isRaining) { isRaining = false; toggleRainSound(false); rainSystem.visible = false; }
            }
            
            // Sync boutons UI
            ventBtn.innerText = isVentilating ? "Arrêter Ventilation" : "Activer Ventilation";
            rainBtn.innerText = isRaining ? "Arrêter Pluie" : "Activer Pluie";
        }

        // Physique simple
        if(isVentilating) temp -= 0.5;
        else temp += 0.2; // Chauffe naturelle

        if(isRaining) hum += 1.0;
        else hum -= 0.3; // Sèche naturellement

        // Limites
        if(temp < 20) temp = 20;
        if(temp > 45) temp = 45;
        if(hum < 10) hum = 10;
        if(hum > 90) hum = 90;

        updateUI();
    }, 1000);

    // Logger dans la base de données toutes les 10 secondes
    setInterval(() => {
        fetch('/api/svt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ temperature: temp, humidity: hum })
        }).catch(err => console.error("Erreur API :", err));
    }, 10000);
});
