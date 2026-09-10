'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

import { finishes, type Finish } from '@/lib/automotive';

export default function CarScene({ mode, finish = 'black', angle = 'auto' }: { mode: 'hero' | 'studio'; finish?: Finish; angle?: string }) {
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
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.045);
    scene.environment = environment.texture;
    room.dispose(); pmrem.dispose();
    const light = new THREE.DirectionalLight('#fff5e8', 2.4);
    light.position.set(2, 6, -4); scene.add(light);
    light.castShadow = true;
    light.shadow.mapSize.set(2048,2048);
    Object.assign(light.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:.1,far:18});
    light.shadow.normalBias = .025;
    light.shadow.bias = -.0002;
    const rim = new THREE.DirectionalLight('#e9edf2', 1.3);
    rim.position.set(-4, 3, 2); scene.add(rim);
    const body = new THREE.MeshPhysicalMaterial({ color: finishes[finish].color, metalness: 0.25, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.18 });
    const paintMaterials:THREE.MeshPhysicalMaterial[]=[];
    const details = new THREE.MeshStandardMaterial({ color: '#606570', metalness: 1, roughness: 0.24 });
    const glass = new THREE.MeshPhysicalMaterial({ color: '#101819', metalness: 0, roughness: 0.08, clearcoat:1, envMapIntensity:.7 });
    const draco = new DRACOLoader(); draco.setDecoderPath('/draco/');
    const loader = new GLTFLoader(); loader.setDRACOLoader(draco);
    let model: THREE.Object3D | undefined;
    const disposeObject = (object: THREE.Object3D) => object.traverse(o => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); const materials = Array.isArray(o.material) ? o.material : [o.material]; materials.forEach(m => m.dispose()); } });
    loader.load('/models/thar.glb', gltf => {
      if (disposed) { disposeObject(gltf.scene); return; }
      model = gltf.scene;
      model.rotation.y = Math.PI;
      model.traverse(o => {
        if (o instanceof THREE.Mesh) {
          const original = Array.isArray(o.material) ? o.material[0] : o.material;
          o.castShadow = true;
          o.receiveShadow = true;
          if (/^aiStandardSurface(1|2|3|4|21|33|43|44)SG$/.test(original.name)) {
            const paint=body.clone();
            if(original instanceof THREE.MeshStandardMaterial){paint.normalMap=original.normalMap;paint.normalScale.set(.3,.3);}
            paintMaterials.push(paint);o.material=paint;
          }
          if (/^aiStandardSurface(39|41)SG$/.test(original.name)) o.material = glass;
          if (original instanceof THREE.MeshStandardMaterial) {
            original.emissiveIntensity = .02;
            if(/^aiStandardSurface(15|17|19|22|29|31|35)SG$/.test(original.name)){original.metalness=0;original.roughness=.9;original.envMapIntensity=.25;}
          }
        }
      });
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      model.scale.multiplyScalar(4.1 / Math.max(size.x,size.z));
      bounds.setFromObject(model);
      const center = bounds.getCenter(new THREE.Vector3());
      model.position.add(new THREE.Vector3(-center.x,-bounds.min.y,-center.z));
      scene.add(model);
      const floor=new THREE.Mesh(new THREE.PlaneGeometry(20,20),new THREE.ShadowMaterial({opacity:.45}));
      floor.rotation.x=-Math.PI/2;floor.position.y=-.003;floor.receiveShadow=true;scene.add(floor);
      const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.4,5.5), new THREE.ShaderMaterial({vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv; void main(){vec2 p=(vUv-.5)*2.;float a=exp(-dot(p,p)*4.)*.42;gl_FragColor=vec4(0.,0.,0.,a);}',transparent:true,depthWrite:false}));
      shadow.rotation.x=-Math.PI/2;shadow.position.y=.005;scene.add(shadow);
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
      const height = mode === 'hero' ? 1.8 + p * .35 : 1.7 + p * .3;
      camera.position.set(Math.sin(orbit) * radius, height + pointerY, -Math.cos(orbit) * radius);
      target.set(0, mode === 'hero' ? .95 : 1.0, 0); camera.lookAt(target);
      body.color.lerp(new THREE.Color(finishes[latest.current.finish].color), reduced.matches ? 1 : .12);
      paintMaterials.forEach(paint=>paint.color.copy(body.color));
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
  return <div className={`car-scene ${mode}-scene ${status}`} ref={host} data-testid={`${mode}-scene`} role="img" aria-label={`Illustrative Mahindra Thar 4×4 in ${finishes[finish].label}. ${mode === 'studio' ? 'Choose a finish and view using the controls.' : 'A sculptural automotive studio scene.'}`}>
    <picture className="scene-poster"><source media="(max-width:700px)" srcSet={`/images/${mode}-mobile.webp`}/><img src={`/images/${mode}-desktop.webp`} alt="" width="1440" height="760"/></picture>
    {status === 'loading' && <span className="scene-loading">Preparing the showroom</span>}
    {status === 'fallback' && <span className="scene-fallback">Studio preview. Explore your options below.</span>}
  </div>;
}



