import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const STORY_STEPS = [
  '⚔️ Dũng sĩ xâm nhập khu rừng bóng tối để tìm đường đến lâu đài.',
  '🐺 Né đòn của bầy sói bóng đêm và thu thập tinh thể ánh sáng.',
  '🏰 Đột phá cổng thành, hạ gục pháp sư canh giữ tháp.',
  '👑 Giải cứu công chúa và đưa cô ấy đến cánh cổng dịch chuyển an toàn.'
];

const OBJECT_STYLE_GUIDE = [
  { icon: '🧙‍♂️', label: 'Dũng sĩ', tone: 'hero', detail: 'Áo giáp xanh lam phát sáng nhẹ.' },
  { icon: '👑', label: 'Công chúa', tone: 'princess', detail: 'Ánh hồng dịu và chuyển động theo nhân vật.' },
  { icon: '💎', label: 'Tinh thể', tone: 'crystal', detail: 'Tinh thể neon xoay liên tục để dễ nhận biết.' },
  { icon: '🐺', label: 'Sói bóng đêm', tone: 'wolf', detail: 'Tông tím-xám với ánh mắt đỏ cảnh báo.' }
];

function createGradientTexture(stops) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const gradient = ctx.createRadialGradient(128, 88, 10, 128, 128, 150);
  stops.forEach(([position, color]) => gradient.addColorStop(position, color));

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 140; i += 1) {
    const alpha = Math.random() * 0.18;
    const size = Math.random() * 2.5;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(Math.random() * 256, Math.random() * 256, size, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function App() {
  const mountRef = useRef(null);
  const [status, setStatus] = useState('Bắt đầu hành trình giải cứu!');
  const [collected, setCollected] = useState(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080f1d);
    scene.fog = new THREE.Fog(0x080f1d, 14, 62);

    const camera = new THREE.PerspectiveCamera(70, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 7, 14);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(0x99c7ff, 0x261f18, 0.95);
    scene.add(hemi);

    const moonLight = new THREE.DirectionalLight(0xa7c5ff, 1.25);
    moonLight.position.set(7, 13, 2);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.set(1024, 1024);
    scene.add(moonLight);

    const rimLight = new THREE.PointLight(0x6fe2ff, 0.75, 30);
    rimLight.position.set(8, 7, -6);
    scene.add(rimLight);

    const groundTexture = createGradientTexture([
      [0, '#35583a'],
      [0.5, '#1f3b31'],
      [1, '#111a20']
    ]);
    if (groundTexture) {
      groundTexture.repeat.set(6, 6);
    }

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshStandardMaterial({
        map: groundTexture || undefined,
        color: 0x2a4434,
        roughness: 0.95,
        metalness: 0.05
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const createCharacter = ({ armorColor, clothTexture }) => {
      const group = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.5, 1.2, 4, 16),
        new THREE.MeshStandardMaterial({
          color: armorColor,
          map: clothTexture || undefined,
          metalness: 0.3,
          roughness: 0.45,
          emissive: armorColor,
          emissiveIntensity: 0.08
        })
      );
      body.castShadow = true;
      group.add(body);

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 24, 24),
        new THREE.MeshStandardMaterial({ color: 0xf2d0a4, roughness: 0.6 })
      );
      head.position.y = 1.1;
      head.castShadow = true;
      group.add(head);
      return group;
    };

    const heroTexture = createGradientTexture([
      [0, '#7dd3ff'],
      [0.6, '#347bff'],
      [1, '#1f3b77']
    ]);
    const princessTexture = createGradientTexture([
      [0, '#ffd6ef'],
      [0.6, '#ff79bd'],
      [1, '#7f3f72']
    ]);

    const hero = createCharacter({ armorColor: 0x2f8fff, clothTexture: heroTexture });
    hero.position.set(-7, 1, 0);
    scene.add(hero);

    const princess = createCharacter({ armorColor: 0xff8dc5, clothTexture: princessTexture });
    princess.position.set(8, 1, 0);
    scene.add(princess);

    const portal = new THREE.Mesh(
      new THREE.TorusGeometry(1.4, 0.25, 20, 100),
      new THREE.MeshStandardMaterial({
        color: 0x8cf2ff,
        emissive: 0x2a7da3,
        emissiveIntensity: 1.2,
        metalness: 0.4,
        roughness: 0.2
      })
    );
    portal.position.set(10, 2.5, -6);
    scene.add(portal);

    const crystals = [];
    const crystalTexture = createGradientTexture([
      [0, '#e8ffff'],
      [0.52, '#82f5ff'],
      [1, '#1e789f']
    ]);

    for (let i = 0; i < 6; i += 1) {
      const crystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.35),
        new THREE.MeshStandardMaterial({
          color: 0x7ef9ff,
          map: crystalTexture || undefined,
          emissive: 0x156b78,
          emissiveIntensity: 0.9,
          roughness: 0.2,
          metalness: 0.25
        })
      );
      crystal.position.set(-4 + i * 2, 1, -3 + (i % 2) * 3);
      crystal.userData.collected = false;
      scene.add(crystal);
      crystals.push(crystal);
    }

    const wolves = [];
    const wolfTexture = createGradientTexture([
      [0, '#746ca4'],
      [0.5, '#48456f'],
      [1, '#232639']
    ]);

    for (let i = 0; i < 3; i += 1) {
      const wolf = new THREE.Mesh(
        new THREE.BoxGeometry(1, 0.8, 1.8),
        new THREE.MeshStandardMaterial({
          color: 0x5c658f,
          map: wolfTexture || undefined,
          emissive: 0x120e2e,
          emissiveIntensity: 0.3,
          roughness: 0.5
        })
      );
      wolf.position.set(-1 + i * 3, 0.6, 4);
      wolf.userData.phase = i * 1.3;
      wolf.castShadow = true;
      scene.add(wolf);
      wolves.push(wolf);
    }

    const fireflyMaterial = new THREE.PointsMaterial({ color: 0xfbfbc8, size: 0.08 });
    const fireflyGeometry = new THREE.BufferGeometry();
    const fireflyPositions = new Float32Array(120 * 3);
    for (let i = 0; i < 120; i += 1) {
      fireflyPositions[i * 3] = (Math.random() - 0.5) * 26;
      fireflyPositions[i * 3 + 1] = 1 + Math.random() * 6;
      fireflyPositions[i * 3 + 2] = (Math.random() - 0.5) * 24;
    }
    fireflyGeometry.setAttribute('position', new THREE.BufferAttribute(fireflyPositions, 3));
    const fireflies = new THREE.Points(fireflyGeometry, fireflyMaterial);
    scene.add(fireflies);

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
        princess.position.lerp(new THREE.Vector3(hero.position.x + 1.2, 1, hero.position.z + 0.8), 0.08);

        if (princess.position.distanceTo(portal.position) < 2.2) {
          setStatus('🎉 Nhiệm vụ hoàn thành! Dũng sĩ đã giải cứu công chúa thành công.');
        }
      }

      hero.rotation.y = Math.sin(time * 3) * 0.12;
      princess.rotation.y = Math.cos(time * 2.6) * 0.1;

      portal.rotation.y += 0.015;
      portal.material.emissiveIntensity = 0.9 + Math.sin(time * 3) * 0.3;
      rimLight.intensity = 0.6 + Math.sin(time * 2) * 0.15;

      fireflies.rotation.y = time * 0.035;

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
      fireflyGeometry.dispose();
      fireflyMaterial.dispose();
      groundTexture?.dispose();
      heroTexture?.dispose();
      princessTexture?.dispose();
      crystalTexture?.dispose();
      wolfTexture?.dispose();
    };
  }, []);

  return (
    <div className="page">
      <div className="hud">
        <h1>Dũng Sĩ Giải Cứu Công Chúa</h1>
        <p className="status-text">{status}</p>
        <p className="crystal-counter">Tinh thể: {collected}/6</p>

        <div className="object-guide">
          {OBJECT_STYLE_GUIDE.map((item) => (
            <article key={item.label} className={`guide-card guide-${item.tone}`}>
              <span>{item.icon}</span>
              <div>
                <h3>{item.label}</h3>
                <p>{item.detail}</p>
              </div>
            </article>
          ))}
        </div>

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
