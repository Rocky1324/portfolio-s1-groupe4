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
            datasets: [
                {
                    label: 'Force Matériau A (Cyan)',
                    data: [], // Force A (Y)
                    borderColor: '#00f0ff',
                    backgroundColor: 'rgba(0, 240, 255, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0
                },
                {
                    label: 'Force Matériau B (Violet)',
                    data: [], // Force B (Y)
                    borderColor: '#9b59b6',
                    backgroundColor: 'rgba(155, 89, 182, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0
                }
            ]
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

    const sampleMatA = new THREE.MeshStandardMaterial({ color: 0x00f0ff }); 
    const sampleA = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 4, 32), sampleMatA);
    sampleA.position.set(-2, 2.5, 0); 

    const sampleMatB = new THREE.MeshStandardMaterial({ color: 0x9b59b6 }); 
    const sampleB = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 4, 32), sampleMatB);
    sampleB.position.set(2, 2.5, 0); 
    
    const anchorBottomA = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1, 1.5), materialDark);
    anchorBottomA.position.set(-2, 0.5, 0);
    scene.add(anchorBottomA);

    const anchorBottomB = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1, 1.5), materialDark);
    anchorBottomB.position.set(2, 0.5, 0);
    scene.add(anchorBottomB);
    
    scene.add(sampleA);
    scene.add(sampleB);

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
    const forceValA = document.getElementById('force-val-a');
    const defValA = document.getElementById('def-val-a');
    const forceValB = document.getElementById('force-val-b');
    const defValB = document.getElementById('def-val-b');
    const matASelect = document.getElementById('mat-a');
    const matBSelect = document.getElementById('mat-b');

    const materialsDb = {
        'acier': { maxForce: 5000, plasticity: 0.6, rupture: 1.0 },
        'aluminium': { maxForce: 2500, plasticity: 0.5, rupture: 0.8 },
        'cuivre': { maxForce: 3000, plasticity: 0.7, rupture: 1.1 },
        'bois': { maxForce: 1500, plasticity: 0.9, rupture: 0.95 }
    };
    
    let isTesting = false;
    let progress = 0;

    startBtn.addEventListener('click', () => {
        if(isTesting) return;
        isTesting = true;
        progress = 0;
        startBtn.disabled = true;
        startBtn.innerText = "Test en cours...";

        // Récupération des propriétés des matériaux
        const matA = materialsDb[matASelect.value];
        const matB = materialsDb[matBSelect.value];
        let brokenA = false;
        let brokenB = false;

        let finalForceA = 0, finalDefA = 0;
        let finalForceB = 0, finalDefB = 0;

        // Reset Chart
        mtuChart.data.labels = [];
        mtuChart.data.datasets[0].data = [];
        mtuChart.data.datasets[1].data = [];
        mtuChart.update();

        // Reset Audio
        startMotorSound();

        // Reset 3D
        movingBar.position.y = 10;
        sampleA.scale.set(1, 1, 1);
        sampleA.position.set(-2, 2.5, 0);
        sampleA.visible = true;

        sampleB.scale.set(1, 1, 1);
        sampleB.position.set(2, 2.5, 0);
        sampleB.visible = true;
        
        document.getElementById('step1').style.opacity = '0.5';
        document.getElementById('step1').style.color = 'var(--text-secondary)';
        document.getElementById('step2').style.opacity = '1';
        document.getElementById('step2').style.color = 'var(--accent-blue)';

        const testInterval = setInterval(() => {
            progress += 0.01;
            
            movingBar.position.y = 5 + (progress * 5); 
            
            if(!brokenA) {
                const newHeightA = 4 + (progress * 4);
                sampleA.scale.y = newHeightA / 4;
                sampleA.position.y = 0.5 + (newHeightA / 2); 
                const thinnessA = 1 - (progress * 0.4);
                sampleA.scale.x = thinnessA;
                sampleA.scale.z = thinnessA;
            }

            if(!brokenB) {
                const newHeightB = 4 + (progress * 4);
                sampleB.scale.y = newHeightB / 4;
                sampleB.position.y = 0.5 + (newHeightB / 2); 
                const thinnessB = 1 - (progress * 0.4);
                sampleB.scale.x = thinnessB;
                sampleB.scale.z = thinnessB;
            }

            const currentDef = progress * 15; 
            mtuChart.data.labels.push(currentDef.toFixed(1));

            // Calcul Matériau A
            let currentForceA = 0;
            if(!brokenA) {
                if(progress > matA.rupture) {
                    brokenA = true;
                    sampleA.visible = false; // Rupture visuelle
                    playSnapSound();
                } else {
                    if(progress < matA.plasticity) {
                        currentForceA = (progress / matA.plasticity) * matA.maxForce;
                    } else {
                        currentForceA = matA.maxForce - ((progress - matA.plasticity) * 2000); 
                    }
                    currentForceA += (Math.random() * 50 - 25);
                    finalForceA = Math.max(finalForceA, currentForceA);
                    finalDefA = currentDef;
                }
            }
            
            // Calcul Matériau B
            let currentForceB = 0;
            if(!brokenB) {
                if(progress > matB.rupture) {
                    brokenB = true;
                    sampleB.visible = false; // Rupture visuelle
                    if(!brokenA || (brokenA && brokenB)) playSnapSound(); // Eviter spam sonore
                } else {
                    if(progress < matB.plasticity) {
                        currentForceB = (progress / matB.plasticity) * matB.maxForce;
                    } else {
                        currentForceB = matB.maxForce - ((progress - matB.plasticity) * 2000); 
                    }
                    currentForceB += (Math.random() * 50 - 25);
                    finalForceB = Math.max(finalForceB, currentForceB);
                    finalDefB = currentDef;
                }
            }

            forceValA.innerText = currentForceA > 0 ? currentForceA.toFixed(1) + " N" : "0.0 N";
            defValA.innerText = brokenA ? finalDefA.toFixed(2) + " mm (Rupture)" : currentDef.toFixed(2) + " mm";
            
            forceValB.innerText = currentForceB > 0 ? currentForceB.toFixed(1) + " N" : "0.0 N";
            defValB.innerText = brokenB ? finalDefB.toFixed(2) + " mm (Rupture)" : currentDef.toFixed(2) + " mm";

            // Update Chart
            mtuChart.data.datasets[0].data.push(currentForceA > 0 ? currentForceA : null);
            mtuChart.data.datasets[1].data.push(currentForceB > 0 ? currentForceB : null);
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

            // Rupture globale (fin du test)
            if (progress >= 1.2 || (brokenA && brokenB)) {
                clearInterval(testInterval);
                isTesting = false;
                startBtn.disabled = false;
                startBtn.innerText = "Recommencer le test comparatif";
                
                stopMotorSound();
                
                if (brokenA) sampleA.visible = false;
                if (brokenB) sampleB.visible = false;
                
                document.getElementById('step3').style.opacity = '0.5';
                document.getElementById('step3').style.color = 'var(--text-secondary)';
                document.getElementById('step4').style.opacity = '1';
                document.getElementById('step4').style.color = 'var(--accent-red)';
                
                // Sauvegarde via API pour A
                fetch('/api/mtu', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        material_name: matASelect.options[matASelect.selectedIndex].text,
                        max_force: finalForceA,
                        max_deformation: finalDefA
                    })
                });
                
                // Sauvegarde via API pour B
                setTimeout(() => {
                    fetch('/api/mtu', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            material_name: matBSelect.options[matBSelect.selectedIndex].text,
                            max_force: finalForceB,
                            max_deformation: finalDefB
                        })
                    });
                }, 500);
            }
        }, 50); 
    });
    
    movingBar.position.y = 5; 
});
