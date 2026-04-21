document.addEventListener("DOMContentLoaded", () => {
    // --- AUDIO API (Sound Design) ---
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    function playCrackSound() {
        if(audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    }

    const container = document.getElementById('canvas-chimie');
    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 5, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // --- CRÉATION DU BÉTON ---
    // Texture de béton basique
    const canvasTexture = document.createElement('canvas');
    canvasTexture.width = 256;
    canvasTexture.height = 256;
    const ctx = canvasTexture.getContext('2d');
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(0,0,256,256);
    for(let i=0; i<1000; i++){
        ctx.fillStyle = Math.random() > 0.5 ? '#bdc3c7' : '#34495e';
        ctx.fillRect(Math.random()*256, Math.random()*256, 2, 2);
    }
    const tex = new THREE.CanvasTexture(canvasTexture);

    const matConcrete = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
    
    // On va faire un bloc en deux parties pour simuler la fissure
    const block1Geo = new THREE.BoxGeometry(4, 4, 4);
    const block1 = new THREE.Mesh(block1Geo, matConcrete);
    block1.position.set(-2, 0, 0);
    scene.add(block1);

    const block2Geo = new THREE.BoxGeometry(4, 4, 4);
    const block2 = new THREE.Mesh(block2Geo, matConcrete);
    block2.position.set(2, 0, 0);
    scene.add(block2);

    // Fissure (un plan au milieu)
    const crackGeo = new THREE.PlaneGeometry(0.5, 4);
    const crackMat = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });
    const crack = new THREE.Mesh(crackGeo, crackMat);
    crack.position.set(0, 0, 2.01);
    crack.visible = false;
    scene.add(crack);

    // Matériau cicatrisant (bactéries/calcaire)
    const healGeo = new THREE.PlaneGeometry(0.5, 4);
    const healMat = new THREE.MeshBasicMaterial({ color: 0xecf0f1, side: THREE.DoubleSide, transparent: true, opacity: 0 });
    const heal = new THREE.Mesh(healGeo, healMat);
    heal.position.set(0, 0, 2.02);
    scene.add(heal);

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // Redimensionnement
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    // --- LOGIQUE ---
    const crackBtn = document.getElementById('crack-btn');
    const healBtn = document.getElementById('heal-btn');
    
    crackBtn.addEventListener('click', () => {
        playCrackSound();
        // Simuler fissure
        block1.position.x = -2.1;
        block2.position.x = 2.1;
        crack.visible = true;
        healMat.opacity = 0;
        
        document.getElementById('step1').style.opacity = '0.5';
        document.getElementById('step1').style.color = 'var(--text-secondary)';
        document.getElementById('step2').style.opacity = '1';
        document.getElementById('step2').style.color = 'var(--accent-purple)';
        
        crackBtn.style.display = 'none';
        healBtn.style.display = 'block';
    });

    healBtn.addEventListener('click', () => {
        healBtn.disabled = true;
        healBtn.innerText = "Cicatrisation en cours...";
        
        document.getElementById('step2').style.opacity = '0.5';
        document.getElementById('step2').style.color = 'var(--text-secondary)';
        document.getElementById('step3').style.opacity = '1';
        document.getElementById('step3').style.color = 'var(--accent-blue)';

        let progress = 0;
        const healInterval = setInterval(() => {
            progress += 0.02;
            healMat.opacity = progress;
            
            // Les blocs se rapprochent très légèrement
            if(block1.position.x < -2) block1.position.x += 0.002;
            if(block2.position.x > 2) block2.position.x -= 0.002;

            if (progress > 0.5) {
                document.getElementById('step3').style.opacity = '0.5';
                document.getElementById('step3').style.color = 'var(--text-secondary)';
                document.getElementById('step4').style.opacity = '1';
                document.getElementById('step4').style.color = 'var(--accent-green)';
            }

            if (progress >= 1) {
                clearInterval(healInterval);
                healBtn.style.display = 'none';
                crackBtn.style.display = 'block';
                crackBtn.innerText = "Nouvelle Fissure";
                healBtn.disabled = false;
                healBtn.innerText = "Déclencher la cicatrisation";
            }
        }, 50);
    });
});
