'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

import { finishes, type Finish } from '@/lib/automotive';

export default function CarScene({
  mode,
  finish = 'black',
  angle = 'auto',
}: {
  mode: 'hero' | 'studio';
  finish?: Finish;
  angle?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef({ finish, angle });
  latest.current = { finish, angle };
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const current = host.current;
    if (!current) return;
    const el: HTMLDivElement = current;
    let renderer: THREE.WebGLRenderer;
    try {
      const mobileDevice = matchMedia('(max-width: 700px)').matches;
      renderer = new THREE.WebGLRenderer({
        antialias: !mobileDevice,
        alpha: true,
        powerPreference: mobileDevice ? 'low-power' : 'high-performance',
      });
    } catch {
      setStatus('fallback');
      return;
    }

    let disposed = false,
      ready = false,
      visible = true,
      frame = 0,
      rendered = false;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const fine = matchMedia('(pointer: fine)');

    // Keep the first render light on high-DPI screens; the poster remains visible while the model loads.
    renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth <= 700 ? 1.25 : 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = mode === 'hero' ? 1.25 : 1.35;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.style.cursor = 'grab';
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

    // Studio Environment with crisp 3D reflections
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.0);
    scene.environment = environment.texture;
    room.dispose();
    pmrem.dispose();

    // 4-Point Premium Automotive Studio Lighting
    const overheadSoftbox = new THREE.DirectionalLight('#ffffff', 3.6);
    overheadSoftbox.position.set(0, 9, 1);
    overheadSoftbox.castShadow = true;
    overheadSoftbox.shadow.mapSize.set(innerWidth <= 700 ? 512 : 1024, innerWidth <= 700 ? 512 : 1024);
    Object.assign(overheadSoftbox.shadow.camera, {
      left: -4.5,
      right: 4.5,
      top: 4.5,
      bottom: -4.5,
      near: 0.1,
      far: 20,
    });
    overheadSoftbox.shadow.normalBias = 0.03;
    overheadSoftbox.shadow.bias = -0.0001;
    scene.add(overheadSoftbox);

    const keyLight = new THREE.DirectionalLight('#fffaf0', 2.8);
    keyLight.position.set(5, 5, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight('#cce4ff', 3.0);
    rimLight.position.set(-6, 4, -5);
    scene.add(rimLight);

    const frontFill = new THREE.DirectionalLight('#ffffff', 1.8);
    frontFill.position.set(-3, 3, 6);
    scene.add(frontFill);

    // Automotive Metallic Paint Material
    const bodyPaint = new THREE.MeshPhysicalMaterial({
      color: finishes[finish].color,
      metalness: 0.85,
      roughness: 0.18,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      reflectivity: 1.0,
      ior: 1.54,
    });

    const paintMaterials: THREE.MeshPhysicalMaterial[] = [];

    // Automotive Tinted Glass
    const tintedGlass = new THREE.MeshPhysicalMaterial({
      color: '#080d12',
      metalness: 0.1,
      roughness: 0.02,
      clearcoat: 1.0,
      clearcoatRoughness: 0.01,
      transparent: true,
      opacity: 0.92,
      ior: 1.52,
      envMapIntensity: 1.8,
    });

    const draco = new DRACOLoader();
    draco.setDecoderPath('/draco/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);

    let model: THREE.Object3D | undefined;
    const disposeObject = (object: THREE.Object3D) => {
      object.traverse((o: THREE.Object3D) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const materials = Array.isArray(o.material) ? o.material : [o.material];
          materials.forEach((m) => m.dispose());
        }
      });
    };

    let loadStarted = false;
    const loadModel = () => {
      if (loadStarted || disposed) return;
      loadStarted = true;
      loader.load(
      '/models/thar.glb',
      (gltf) => {
        if (disposed) {
          disposeObject(gltf.scene);
          return;
        }
        model = gltf.scene;
        model.rotation.y = Math.PI;

        model.traverse((o: THREE.Object3D) => {
          if (o instanceof THREE.Mesh) {
            const original = Array.isArray(o.material) ? o.material[0] : o.material;
            o.castShadow = true;
            o.receiveShadow = true;
            const name = original?.name || '';

            // Body paint panels
            if (/^aiStandardSurface(1|2|3|4|21|33|43|44)SG$/.test(name)) {
              const paint = bodyPaint.clone();
              if (original instanceof THREE.MeshStandardMaterial) {
                if (original.normalMap) {
                  paint.normalMap = original.normalMap;
                  paint.normalScale.set(0.25, 0.25);
                }
                if (original.roughnessMap) paint.roughnessMap = original.roughnessMap;
              }
              paintMaterials.push(paint);
              o.material = paint;
            }
            // Glass & Windshields
            else if (/^aiStandardSurface(39|41)SG$/.test(name)) {
              o.material = tintedGlass;
            }
            // Rims & Alloy Wheels
            else if (/^aiStandardSurface(16|20|42)SG$/.test(name)) {
              if (original instanceof THREE.MeshStandardMaterial) {
                original.metalness = 0.95;
                original.roughness = 0.14;
                original.envMapIntensity = 2.0;
              }
            }
            // Headlights & LED Lamps
            else if (/^aiStandardSurface(30|32)SG$/.test(name)) {
              if (original instanceof THREE.MeshStandardMaterial) {
                original.emissive = new THREE.Color('#fffbe0');
                original.emissiveIntensity = 2.4;
                original.envMapIntensity = 2.0;
              }
            }
            // Tires & Rubber
            else if (/^aiStandardSurface(15|17|19|22|29|31|35)SG$/.test(name)) {
              if (original instanceof THREE.MeshStandardMaterial) {
                original.metalness = 0.05;
                original.roughness = 0.78;
                original.envMapIntensity = 0.45;
              }
            }
            else if (original instanceof THREE.MeshStandardMaterial) {
              original.envMapIntensity = 1.2;
              original.roughness = Math.min(original.roughness, 0.4);
            }
          }
        });

        const bounds = new THREE.Box3().setFromObject(model);
        const size = bounds.getSize(new THREE.Vector3());
        model.scale.multiplyScalar(4.1 / Math.max(size.x, size.z));
        bounds.setFromObject(model);
        const center = bounds.getCenter(new THREE.Vector3());
        model.position.add(new THREE.Vector3(-center.x, -bounds.min.y, -center.z));
        scene.add(model);

        const floor = new THREE.Mesh(
          new THREE.PlaneGeometry(30, 30),
          new THREE.ShadowMaterial({ opacity: 0.55 })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.002;
        floor.receiveShadow = true;
        scene.add(floor);

        const shadow = new THREE.Mesh(
          new THREE.PlaneGeometry(3.6, 5.8),
          new THREE.ShaderMaterial({
            vertexShader:
              'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
            fragmentShader:
              'varying vec2 vUv; void main(){vec2 p=(vUv-.5)*2>; float d=length(p*vec2(1.2, 0.9)); float a=smoothstep(1.0, 0.0, d)*0.55; gl_FragColor=vec4(0.02,0.02,0.03,a);}',
            transparent: true,
            depthWrite: false,
          })
        );
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = 0.004;
        scene.add(shadow);

        ready = true;
      },
      undefined,
      () => {
        if (!disposed) setStatus('fallback');
      }
      );
    };

    let pointerX = 0,
      pointerY = 0;
    let orbit = mode === 'hero' ? 0.76 : 0.66;
    let targetOrbit = orbit;
    let autoRotation = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let dragOrbitStart = 0;
    let dragPitch = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      dragOrbitStart = targetOrbit;
      renderer.domElement.style.cursor = 'grabbing';
      if (e.pointerId) {
        try {
          renderer.domElement.setPointerCapture(e.pointerId);
        } catch {}
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (isDragging) {
        const deltaX = (e.clientX - startX) * 0.008;
        const deltaY = (e.clientY - startY) * 0.004;
        targetOrbit = dragOrbitStart + deltaX;
        dragPitch = THREE.MathUtils.clamp(-deltaY, -0.6, 0.8);
      } else if (fine.matches && !reduced.matches) {
        const r = el.getBoundingClientRect();
        pointerX = ((e.clientX - r.left) / r.width - 0.5) * 0.25;
        pointerY = ((e.clientY - r.top) / r.height - 0.5) * 0.2;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (isDragging) {
        isDragging = false;
        renderer.domElement.style.cursor = 'grab';
        if (e.pointerId) {
          try {
            renderer.domElement.releasePointerCapture(e.pointerId);
          } catch {}
        }
      }
    };

    const onPointerLeave = () => {
      if (!isDragging) {
        pointerX = 0;
        pointerY = 0;
      }
    };

    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointerleave', onPointerLeave);

    const resize = () => {
      const w = el.clientWidth,
        h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();

    const intersection = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (!entry.isIntersecting || loadStarted) return;
        const start = () => loadModel();
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(start, { timeout: mode === 'hero' ? 1200 : 2400 });
        } else {
          setTimeout(start, mode === 'hero' ? 250 : 600);
        }
      },
      { rootMargin: mode === 'hero' ? '0px' : '240px' }
    );
    intersection.observe(el);

    const target = new THREE.Vector3();
    let previousFrame = '';

    function animate() {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      if (!ready || !visible || document.hidden) return;

      const mobile = innerWidth <= 700;
      const act = el.closest<HTMLElement>('[data-sc-act]');
      let p = 0;
      if (act && !reduced.matches) {
        const rect = act.getBoundingClientRect();
        p =
          mode === 'studio'
            ? THREE.MathUtils.clamp(
                -rect.top / Math.max(1, act.offsetHeight - innerHeight),
                0,
                1
              )
            : THREE.MathUtils.clamp(-rect.top / innerHeight, 0, 1);
      }

      if (!isDragging) {
        if (!reduced.matches) {
          autoRotation += mode === 'hero' ? 0.003 : 0.0018;
        }

        let baseDesired = mode === 'hero' ? 0.76 + p * 0.6 : 0.66 + p * 1.5;
        if (mode === 'studio' && latest.current.angle !== 'auto') {
          baseDesired =
            ({ front: 0.14, side: 1.56, rear: 2.7 } as Record<string, number>)[
              latest.current.angle
            ] ?? 0.7;
          targetOrbit = baseDesired;
        } else {
          targetOrbit = baseDesired + autoRotation;
        }
        dragPitch = THREE.MathUtils.lerp(dragPitch, 0, 0.05);
      }

      orbit = reduced.matches
        ? targetOrbit
        : THREE.MathUtils.lerp(orbit, targetOrbit + pointerX, 0.08);
      const radius = mobile
        ? mode === 'hero'
          ? 6.8
          : 7.0
        : mode === 'hero'
        ? 7.2
        : 6.9;
      const height =
        (mode === 'hero' ? 1.75 + p * 0.35 : 1.65 + p * 0.3) + pointerY + dragPitch;

      camera.position.set(
        Math.sin(orbit) * radius,
        height,
        -Math.cos(orbit) * radius
      );
      target.set(0, mode === 'hero' ? 0.95 : 1.0, 0);
      camera.lookAt(target);

      bodyPaint.color.lerp(
        new THREE.Color(finishes[latest.current.finish].color),
        reduced.matches ? 1 : 0.12
      );
      paintMaterials.forEach((paint) => paint.color.copy(bodyPaint.color));

      const signature = orbit.toFixed(3) + ':' + height.toFixed(3) + ':' + bodyPaint.color.getHexString() + ':' + camera.aspect.toFixed(3);
      if (signature === previousFrame && rendered) return;
      previousFrame = signature;

      renderer.render(scene, camera);
      el.dataset.sceneState = orbit.toFixed(2) + ':' + bodyPaint.color.getHexString();
      if (!rendered) {
        rendered = true;
        setStatus('ready');
      }
    }

    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersection.disconnect();
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointerleave', onPointerLeave);
      scene.traverse((o: THREE.Object3D) => {
        if (o instanceof THREE.Mesh) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => {
            const map = (m as THREE.MeshBasicMaterial).map;
            map?.dispose();
          });
        }
      });
      if (model) disposeObject(model);
      bodyPaint.dispose();
      tintedGlass.dispose();
      
      
      environment.dispose();
      draco.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [mode]);

  return (
    <div
      className={'car-scene ' + mode + '-scene ' + status}
      ref={host}
      data-testid={mode + '-scene'}
      role="img"
      aria-label={'Realistic 3D Mahindra Thar 4��4" in ' + finishes[finish].label + '.'}
    >
      <picture className="scene-poster">
        <source
          media="(max-width:700px)"
          srcSet={'/images/' + mode + '-mobile.webp'}
        />
        <img
          src={'/images/' + mode + '-desktop.webp'}
          alt=""
          width="1440"
          height="760"
        />
      </picture>
      {status === 'loading' && mode === 'studio' && (
        <span className="scene-loading">Preparing 3D showroom...</span>
      )}
      {status === 'fallback' && (
        <span className="scene-fallback">Studio preview.</span>
      )}
    </div>
  );
}

