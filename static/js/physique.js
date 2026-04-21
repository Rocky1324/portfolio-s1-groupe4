document.addEventListener("DOMContentLoaded", () => {
    // --- AUDIO API (Sound Design) ---
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let motorOscillator = null;
    let motorGain = null;

    function startMotorSound() {
        if(audioCtx.state === 'suspended') audioCtx.resume();
        motorOscillator = audioCtx.createOscillator();
        motorGain = audioCtx.createGain();
        
        motorOscillator.type = 'sawtooth'; // Son mécanique industriel
        motorOscillator.frequency.setValueAtTime(50, audioCtx.currentTime); // Basse fréquence
        
        motorGain.gain.setValueAtTime(0, audioCtx.currentTime);
        motorGain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.5); // Fade in doux
        
        motorOscillator.connect(motorGain);
        motorGain.connect(audioCtx.destination);
        motorOscillator.start();
    }

    function stopMotorSound() {
        if(motorGain) {
            motorGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
            setTimeout(() => {
                if(motorOscillator) {
                    motorOscillator.stop();
                    motorOscillator.disconnect();
                    motorOscillator = null;
                }
            }, 500);
        }
    }

    function playSnapSound() {
        if(audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    }

    // --- CHART.JS ---
    const ctxChart = document.getElementById('mtuChart').getContext('2d');
    const mtuChart = new Chart(ctxChart, {
        type: 'line',
        data: {
            labels: [], // Déformation (X)
            datasets: [{
                label: 'Contrainte (Force)',
                data: [], // Force (Y)
                borderColor: '#00f0ff',
                backgroundColor: 'rgba(0, 240, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: { display: true, text: 'Déformation (mm)', color: '#a0a0b0' },
                    ticks: { color: '#a0a0b0' },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                y: {
                    title: { display: true, text: 'Force (N)', color: '#a0a0b0' },
                    ticks: { color: '#a0a0b0' },
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    min: 0,
                    max: 5500
                }
            },
            plugins: {
                legend: { labels: { color: '#ffffff' } }
            }
        }
    });

    // --- THREE.JS ---
    const container = document.getElementById('canvas-physique');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 10, 25);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    const materialDark = new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.7 });
    const materialSteel = new THREE.MeshStandardMaterial({ color: 0x95a5a6, metalness: 0.8, roughness: 0.2 });
    
    const base = new THREE.Mesh(new THREE.BoxGeometry(10, 1, 6), materialDark);
    base.position.y = -0.5;
    scene.add(base);

    const pillarGeo = new THREE.CylinderGeometry(0.5, 0.5, 15, 32);
    const pillar1 = new THREE.Mesh(pillarGeo, materialSteel);
    pillar1.position.set(-4, 7.5, 0);
    scene.add(pillar1);
    
    const pillar2 = new THREE.Mesh(pillarGeo, materialSteel);
    pillar2.position.set(4, 7.5, 0);
    scene.add(pillar2);

    const topBar = new THREE.Mesh(new THREE.BoxGeometry(10, 1, 2), materialDark);
    topBar.position.y = 15;
    scene.add(topBar);

    const movingBar = new THREE.Mesh(new THREE.BoxGeometry(9, 1, 2), new THREE.MeshStandardMaterial({ color: 0x34495e }));
    movingBar.position.y = 10;
    scene.add(movingBar);

    const sampleMat = new THREE.MeshStandardMaterial({ color: 0xe74c3c }); 
    const sample = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 4, 32), sampleMat);
    sample.position.y = 2.5; 
    
    const anchorBottom = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), materialDark);
    anchorBottom.position.y = 0.5;
    scene.add(anchorBottom);
    
    scene.add(sample);

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    // --- LOGIQUE DE SIMULATION ---
    const startBtn = document.getElementById('start-btn');
    const forceVal = document.getElementById('force-val');
    const defVal = document.getElementById('def-val');
    
    let isTesting = false;
    let progress = 0;
    const maxForce = 5000; 

    startBtn.addEventListener('click', () => {
        if(isTesting) return;
        isTesting = true;
        progress = 0;
        startBtn.disabled = true;
        startBtn.innerText = "Test en cours...";

        // Reset Chart
        mtuChart.data.labels = [];
        mtuChart.data.datasets[0].data = [];
        mtuChart.update();

        // Reset Audio
        startMotorSound();

        // Reset 3D
        movingBar.position.y = 10;
        sample.scale.y = 1;
        sample.scale.x = 1;
        sample.scale.z = 1;
        sample.position.y = 2.5;
        sampleMat.color.setHex(0xe74c3c); 
        
        document.getElementById('step1').style.opacity = '0.5';
        document.getElementById('step1').style.color = 'var(--text-secondary)';
        document.getElementById('step2').style.opacity = '1';
        document.getElementById('step2').style.color = 'var(--accent-blue)';
        
        let finalForce = 0;
        let finalDef = 0;

        const testInterval = setInterval(() => {
            progress += 0.01;
            
            movingBar.position.y = 5 + (progress * 5); 
            
            const newHeight = 4 + (progress * 4);
            sample.scale.y = newHeight / 4;
            sample.position.y = 0.5 + (newHeight / 2); 
            
            const thinness = 1 - (progress * 0.4);
            sample.scale.x = thinness;
            sample.scale.z = thinness;

            // Calcul des valeurs
            // Simulation d'une courbe élastique puis plastique
            let currentForce = 0;
            if(progress < 0.6) {
                // Zone élastique (linéaire)
                currentForce = (progress / 0.6) * maxForce;
            } else {
                // Zone plastique (arrondie)
                currentForce = maxForce - ((progress - 0.6) * 1000); 
            }
            
            // Ajouter un peu de bruit
            currentForce += (Math.random() * 50 - 25);
            
            const currentDef = progress * 15; 
            
            finalForce = Math.max(finalForce, currentForce);
            finalDef = currentDef;

            forceVal.innerText = currentForce.toFixed(1) + " N";
            defVal.innerText = currentDef.toFixed(2) + " mm";

            // Update Chart
            mtuChart.data.labels.push(currentDef.toFixed(1));
            mtuChart.data.datasets[0].data.push(currentForce);
            mtuChart.update();

            // Update Audio Pitch
            if(motorOscillator) {
                motorOscillator.frequency.setValueAtTime(50 + (progress * 50), audioCtx.currentTime);
            }

            if (progress > 0.5) {
                document.getElementById('step2').style.opacity = '0.5';
                document.getElementById('step2').style.color = 'var(--text-secondary)';
                document.getElementById('step3').style.opacity = '1';
                document.getElementById('step3').style.color = 'var(--accent-purple)';
            }

            // Rupture
            if (progress >= 1.0) {
                clearInterval(testInterval);
                isTesting = false;
                startBtn.disabled = false;
                startBtn.innerText = "Recommencer le test";
                
                // Rupture Audio & Visuelle
                stopMotorSound();
                playSnapSound();
                
                sample.scale.y = 0; 
                sampleMat.color.setHex(0x000000);
                
                forceVal.innerText = "0.0 N";
                
                // Drop chart to 0
                mtuChart.data.labels.push((currentDef + 0.1).toFixed(1));
                mtuChart.data.datasets[0].data.push(0);
                mtuChart.update();

                document.getElementById('step3').style.opacity = '0.5';
                document.getElementById('step3').style.color = 'var(--text-secondary)';
                document.getElementById('step4').style.opacity = '1';
                document.getElementById('step4').style.color = 'var(--accent-red)';
                
                // Sauvegarde via API
                fetch('/api/mtu', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        material_name: 'Échantillon Standard',
                        max_force: finalForce,
                        max_deformation: finalDef
                    })
                })
                .then(res => res.json())
                .then(data => {
                    console.log("Sauvegarde réussie :", data);
                })
                .catch(err => console.error("Erreur API :", err));
            }
        }, 50); 
    });
    
    movingBar.position.y = 5; 
});
