document.addEventListener("DOMContentLoaded", () => {
    // --- AUDIO API (Sound Design) ---
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    let quakeOsc = null, quakeGain = null;

    function createRumbleSound() {
        if(audioCtx.state === 'suspended') audioCtx.resume();
        quakeOsc = audioCtx.createOscillator();
        quakeGain = audioCtx.createGain();
        
        quakeOsc.type = 'sine'; // Grondement très grave
        quakeOsc.frequency.setValueAtTime(30, audioCtx.currentTime);
        
        // Tremblement de fréquence pour effet séisme
        quakeOsc.frequency.linearRampToValueAtTime(45, audioCtx.currentTime + 0.5);
        quakeOsc.frequency.linearRampToValueAtTime(25, audioCtx.currentTime + 1.0);
        quakeOsc.frequency.linearRampToValueAtTime(40, audioCtx.currentTime + 1.5);
        
        quakeGain.gain.setValueAtTime(0, audioCtx.currentTime);
        quakeGain.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 1);

        quakeOsc.connect(quakeGain);
        quakeGain.connect(audioCtx.destination);
        quakeOsc.start();
    }

    function stopRumbleSound() {
        if(quakeGain) {
            quakeGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1);
            setTimeout(() => { if(quakeOsc){ quakeOsc.stop(); quakeOsc.disconnect(); quakeOsc = null; } }, 1000);
        }
    }

    const simBtn = document.getElementById('sim-btn');
    const scene = document.getElementById('scene');
    const person = document.getElementById('person');
    const bubble = document.getElementById('bubble');
    
    // Étapes
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    const step4 = document.getElementById('step4');

    // Afficher la bulle du guide au début
    setTimeout(() => {
        bubble.style.opacity = '1';
    }, 500);

    let isSimulating = false;

    simBtn.addEventListener('click', () => {
        if(isSimulating) return;
        isSimulating = true;
        simBtn.disabled = true;
        
        // Reset steps
        step1.style.opacity = '1'; step1.style.color = 'var(--accent-red)';
        step2.style.opacity = '0.5'; step2.style.color = 'var(--text-secondary)';
        step3.style.opacity = '0.5'; step3.style.color = 'var(--text-secondary)';
        step4.style.opacity = '0.5'; step4.style.color = 'var(--text-secondary)';
        
        // Reset person
        person.className = 'character';
        person.style.left = '20%';

        // Phase 1 : Séisme commence
        createRumbleSound();
        bubble.innerText = "ATTENTION ! SÉISME DÉTECTÉ !";
        bubble.style.color = "red";
        scene.classList.add('shake');
        simBtn.innerText = "Séisme en cours...";

        // Phase 2 : Se baisser
        setTimeout(() => {
            bubble.innerText = "ÉTAPE 1 : Baissez-vous immédiatement !";
            bubble.style.color = "black";
            
            step1.style.opacity = '0.5'; step1.style.color = 'var(--text-secondary)';
            step2.style.opacity = '1'; step2.style.color = 'var(--accent-blue)';
            
            person.classList.add('posture-drop');
        }, 2000);

        // Phase 3 : S'abriter
        setTimeout(() => {
            bubble.innerText = "ÉTAPE 2 : Abritez-vous sous la table !";
            
            step2.style.opacity = '0.5'; step2.style.color = 'var(--text-secondary)';
            step3.style.opacity = '1'; step3.style.color = 'var(--accent-blue)';
            
            person.classList.add('posture-cover');
        }, 4000);

        // Phase 4 : S'agripper
        setTimeout(() => {
            bubble.innerText = "ÉTAPE 3 : Agrippez-vous au pied du meuble !";
            
            step3.style.opacity = '0.5'; step3.style.color = 'var(--text-secondary)';
            step4.style.opacity = '1'; step4.style.color = 'var(--accent-green)';
            
            // On peut simuler l'agrippement en ajoutant une bordure ou une animation
        }, 6000);

        // Fin du séisme
        setTimeout(() => {
            stopRumbleSound();
            scene.classList.remove('shake');
            bubble.innerText = "La secousse est terminée. Restez prudent et évacuez si nécessaire.";
            
            simBtn.disabled = false;
            simBtn.innerText = "Recommencer la simulation";
            isSimulating = false;
        }, 10000);
    });
});
