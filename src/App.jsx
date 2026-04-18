import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const STORY_STEPS = [
  '⚔️ Dũng sĩ xâm nhập khu rừng bóng tối để tìm đường đến lâu đài.',
  '🐺 Né đòn của bầy sói bóng đêm và thu thập tinh thể ánh sáng.',
  '🏰 Đột phá cổng thành, hạ gục pháp sư canh giữ tháp.',
  '👑 Giải cứu công chúa và đưa cô ấy đến cánh cổng dịch chuyển an toàn.'
];

function App() {
  const mountRef = useRef(null);
  const [status, setStatus] = useState('Bắt đầu hành trình giải cứu!');
  const [collected, setCollected] = useState(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101c34);
    scene.fog = new THREE.Fog(0x101c34, 15, 60);

    const camera = new THREE.PerspectiveCamera(70, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 7, 14);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(0x8db7ff, 0x2f2418, 0.9);
    scene.add(hemi);

    const moonLight = new THREE.DirectionalLight(0xa0c4ff, 1.1);
    moonLight.position.set(5, 12, 4);
    moonLight.castShadow = true;
    scene.add(moonLight);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshStandardMaterial({ color: 0x22331f, roughness: 0.9, metalness: 0.1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const createCharacter = (color) => {
      const group = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.5, 1.2, 4, 8),
        new THREE.MeshStandardMaterial({ color, metalness: 0.2, roughness: 0.6 })
      );
      body.castShadow = true;
      group.add(body);

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 24, 24),
        new THREE.MeshStandardMaterial({ color: 0xf2d0a4 })
      );
      head.position.y = 1.1;
      head.castShadow = true;
      group.add(head);
      return group;
    };

    const hero = createCharacter(0x2979ff);
    hero.position.set(-7, 1, 0);
    scene.add(hero);

    const princess = createCharacter(0xff7eb6);
    princess.position.set(8, 1, 0);
    scene.add(princess);

    const portal = new THREE.Mesh(
      new THREE.TorusGeometry(1.4, 0.25, 20, 100),
      new THREE.MeshStandardMaterial({ color: 0x8cf2ff, emissive: 0x2a7da3, emissiveIntensity: 1.2 })
    );
    portal.position.set(10, 2.5, -6);
    scene.add(portal);

    const crystals = [];
    for (let i = 0; i < 6; i += 1) {
      const crystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.35),
        new THREE.MeshStandardMaterial({ color: 0x7ef9ff, emissive: 0x156b78, emissiveIntensity: 0.8 })
      );
      crystal.position.set(-4 + i * 2, 1, -3 + (i % 2) * 3);
      crystal.userData.collected = false;
      scene.add(crystal);
      crystals.push(crystal);
    }

    const wolves = [];
    for (let i = 0; i < 3; i += 1) {
      const wolf = new THREE.Mesh(
        new THREE.BoxGeometry(1, 0.8, 1.8),
        new THREE.MeshStandardMaterial({ color: 0x474d68 })
      );
      wolf.position.set(-1 + i * 3, 0.6, 4);
      wolf.userData.phase = i * 1.3;
      wolf.castShadow = true;
      scene.add(wolf);
      wolves.push(wolf);
    }

    const keys = new Set();
    const speed = 0.09;
    let rescued = false;
    let animationId;

    const onKeyDown = (event) => keys.add(event.key.toLowerCase());
    const onKeyUp = (event) => keys.delete(event.key.toLowerCase());
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();

    const animate = () => {
      const time = clock.getElapsedTime();
      animationId = requestAnimationFrame(animate);

      if (keys.has('w') || keys.has('arrowup')) hero.position.z -= speed;
      if (keys.has('s') || keys.has('arrowdown')) hero.position.z += speed;
      if (keys.has('a') || keys.has('arrowleft')) hero.position.x -= speed;
      if (keys.has('d') || keys.has('arrowright')) hero.position.x += speed;

      hero.position.x = THREE.MathUtils.clamp(hero.position.x, -12, 12);
      hero.position.z = THREE.MathUtils.clamp(hero.position.z, -10, 10);

      wolves.forEach((wolf) => {
        wolf.position.z = 4 + Math.sin(time + wolf.userData.phase) * 4;
      });

      crystals.forEach((crystal) => {
        if (crystal.userData.collected) return;
        crystal.rotation.y += 0.03;
        crystal.position.y = 1 + Math.sin(time * 2 + crystal.position.x) * 0.15;

        if (hero.position.distanceTo(crystal.position) < 1.1) {
          crystal.userData.collected = true;
          crystal.visible = false;
          setCollected((prev) => {
            const next = prev + 1;
            setStatus(`Đã thu thập ${next}/6 tinh thể ánh sáng.`);
            return next;
          });
        }
      });

      const nearestWolf = wolves.some((wolf) => hero.position.distanceTo(wolf.position) < 1.4);
      if (nearestWolf) {
        setStatus('💥 Bị sói cản đường! Lùi lại và né đòn.');
      }

      if (!rescued && hero.position.distanceTo(princess.position) < 1.6) {
        rescued = true;
        setStatus('👑 Đã gặp công chúa! Hãy dẫn cô ấy tới cổng dịch chuyển.');
      }

      if (rescued) {
        princess.position.lerp(
          new THREE.Vector3(hero.position.x + 1.2, 1, hero.position.z + 0.8),
          0.08
        );

        if (princess.position.distanceTo(portal.position) < 2.2) {
          setStatus('🎉 Nhiệm vụ hoàn thành! Dũng sĩ đã giải cứu công chúa thành công.');
        }
      }

      portal.rotation.y += 0.015;
      portal.material.emissiveIntensity = 0.9 + Math.sin(time * 3) * 0.3;

      camera.position.x += (hero.position.x * 0.45 - camera.position.x) * 0.03;
      camera.position.z += (hero.position.z + 14 - camera.position.z) * 0.03;
      camera.lookAt(hero.position.x, 1, hero.position.z - 1);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj.isMesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((material) => material.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    };
  }, []);

  return (
    <div className="page">
      <div className="hud">
        <h1>Dũng Sĩ Giải Cứu Công Chúa</h1>
        <p>{status}</p>
        <p>Tinh thể: {collected}/6</p>
        <div className="plan">
          <h2>Kịch bản nhiệm vụ</h2>
          <ol>
            {STORY_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
        <p className="hint">Di chuyển: W A S D hoặc phím mũi tên.</p>
      </div>
      <div className="canvas" ref={mountRef} />
    </div>
  );
}

export default App;
