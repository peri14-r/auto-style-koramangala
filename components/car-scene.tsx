'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

import { finishes, type Finish } from '@/lib/automotive';

export default function CarScene({ mode, finish = 'silver', angle = 'auto' }: { mode: 'hero' | 'studio'; finish?: Finish; angle?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef({ finish, angle });
  latest.current = { finish, angle };
  const [status, setStatus] = useState('loading');
  useEffect(() => {
    const current = host.current;
    if (!current) return;
    const el: HTMLDivElement = current;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); }
    catch { setStatus('fallback'); return; }
    let disposed = false, ready = false, visible = true, frame = 0, rendered = false;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const fine = matchMedia('(pointer: fine)');
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = mode === 'hero' ? .9 : 1.05;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.045);
    scene.environment = environment.texture;
    room.dispose(); pmrem.dispose();
    const light = new THREE.DirectionalLight('#ffffff', 3.4);
    light.position.set(2, 6, -4); scene.add(light);
    const rim = new THREE.DirectionalLight(mode === 'hero' ? '#b9d1ed' : '#f4a28a', 2.5);
    rim.position.set(-4, 3, 2); scene.add(rim);
    const body = new THREE.MeshPhysicalMaterial({ color: finishes[finish].color, metalness: 0.78, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.13 });
    const details = new THREE.MeshStandardMaterial({ color: '#606570', metalness: 1, roughness: 0.24 });
    const glass = new THREE.MeshPhysicalMaterial({ color: '#242933', metalness: 0.2, roughness: 0.12, transparent: true, opacity: 0.87 });
    const draco = new DRACOLoader(); draco.setDecoderPath('/draco/');
    const loader = new GLTFLoader(); loader.setDRACOLoader(draco);
    let model: THREE.Object3D | undefined;
    const disposeObject = (object: THREE.Object3D) => object.traverse(o => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); const materials = Array.isArray(o.material) ? o.material : [o.material]; materials.forEach(m => m.dispose()); } });
    loader.load('/models/ferrari.glb', gltf => {
      if (disposed) { disposeObject(gltf.scene); return; }
      model = gltf.scene.children[0];
      model.traverse(o => {
        if (o instanceof THREE.Mesh) {
          const original = Array.isArray(o.material) ? o.material[0] : o.material;
          if (/Leather|Interior|Carpet/.test(original.name)) o.material = new THREE.MeshStandardMaterial({color:'#15161a',roughness:.8});
          if (original.name === 'Tires') o.material = new THREE.MeshStandardMaterial({color:'#101114',roughness:.94});
          if (o.name === 'body') o.material = body;
          else if (['rim_fl','rim_fr','rim_rr','rim_rl','trim'].includes(o.name)) o.material = details;
          else if (o.name === 'glass') o.material = glass;
        }
      });
      scene.add(model);
      const shadowTex = new THREE.TextureLoader().load('/models/ferrari_ao.png');
      const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.655 * 4, 1.3 * 4), new THREE.ShaderMaterial({ uniforms:{shadowMap:{value:shadowTex}}, vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform sampler2D shadowMap; varying vec2 vUv; void main(){float a=(1.-texture2D(shadowMap,vUv).r)*0.48;gl_FragColor=vec4(0.,0.,0.,a);}', transparent:true,depthWrite:false }));
      shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.01; shadow.renderOrder = 2;
      model.add(shadow);
      ready = true;
    }, undefined, () => { if (!disposed) setStatus('fallback'); });
    let pointerX = 0, pointerY = 0, orbit = 0.8;
    const pointer = (e: PointerEvent) => { if (!fine.matches || reduced.matches) return; const r = el.getBoundingClientRect(); pointerX = ((e.clientX - r.left) / r.width - .5) * .16; pointerY = ((e.clientY - r.top) / r.height - .5) * .12; };
    const leave = () => { pointerX = 0; pointerY = 0; };
    el.addEventListener('pointermove', pointer); el.addEventListener('pointerleave', leave);
    const resize = () => { const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); };
    const observer = new ResizeObserver(resize); observer.observe(el); resize();
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { rootMargin: '100px' }); intersection.observe(el);
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
        p = mode === 'studio' ? THREE.MathUtils.clamp(-rect.top / Math.max(1, act.offsetHeight - innerHeight), 0, 1) : THREE.MathUtils.clamp(-rect.top / innerHeight, 0, 1);
      }
      let desired = mode === 'hero' ? .76 + p * .4 : .66 + p * 1.35;
      if (mode === 'studio' && latest.current.angle !== 'auto') desired = ({ front: .14, side: 1.56, rear: 2.7 } as Record<string, number>)[latest.current.angle] ?? .7;
      orbit = reduced.matches ? desired : THREE.MathUtils.lerp(orbit, desired + pointerX, .075);
      const radius = mobile ? (mode === 'hero' ? 6.3 : 6.5) : (mode === 'hero' ? 6.7 : 6.4);
      const height = mode === 'hero' ? 1.9 + p * .6 : 1.65 + p * .45;
      camera.position.set(Math.sin(orbit) * radius, height + pointerY, -Math.cos(orbit) * radius);
      target.set(0, mode === 'hero' ? .55 : .6, 0); camera.lookAt(target);
      body.color.lerp(new THREE.Color(finishes[latest.current.finish].color), reduced.matches ? 1 : .12);
      const signature = `${orbit.toFixed(3)}:${height.toFixed(3)}:${body.color.getHexString()}:${camera.aspect.toFixed(3)}:${pointerY.toFixed(3)}`;
      if (signature === previousFrame && rendered) return;
      previousFrame = signature;
      renderer.render(scene, camera);
      el.dataset.sceneState = `${orbit.toFixed(2)}:${body.color.getHexString()}`;
      el.dataset.scVerifyState = `${orbit.toFixed(2)}:${height.toFixed(2)}:${body.color.getHexString()}`;
      if(reduced.matches) el.dataset.scVerifyHold = 'true';
      if (!rendered) { rendered = true; setStatus('ready'); }
    }
    animate();
    const capture = () => { if (ready) { renderer.render(scene,camera); el.dataset.poster = renderer.domElement.toDataURL('image/png'); } };
    el.addEventListener('scene:capture',capture);
    const contextLost = (e: Event) => { e.preventDefault(); setStatus('fallback'); ready = false; };
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    return () => { disposed = true; cancelAnimationFrame(frame); observer.disconnect(); intersection.disconnect(); el.removeEventListener('pointermove', pointer); el.removeEventListener('pointerleave', leave); el.removeEventListener('scene:capture',capture); renderer.domElement.removeEventListener('webglcontextlost', contextLost); scene.traverse(o => { if (o instanceof THREE.Mesh) { const mats = Array.isArray(o.material) ? o.material : [o.material]; mats.forEach(m => { const map = (m as THREE.MeshBasicMaterial).map; map?.dispose(); }); } }); if (model) disposeObject(model); body.dispose(); details.dispose(); glass.dispose(); environment.dispose(); draco.dispose(); renderer.dispose(); renderer.domElement.remove(); };
  }, [mode]);
  return <div className={`car-scene ${mode}-scene ${status}`} ref={host} data-testid={`${mode}-scene`} role="img" aria-label={`Illustrative sports car in ${finishes[finish].label}. ${mode === 'studio' ? 'Choose a finish and view using the controls.' : 'A sculptural automotive studio scene.'}`}>
    <picture className="scene-poster"><source media="(max-width:700px)" srcSet={`/images/${mode}-mobile.webp`}/><img src={`/images/${mode}-desktop.webp`} alt="" width="1440" height="760"/></picture>
    {status === 'loading' && <span className="scene-loading">Preparing the showroom</span>}
    {status === 'fallback' && <span className="scene-fallback">Studio preview. Explore your options below.</span>}
  </div>;
}



