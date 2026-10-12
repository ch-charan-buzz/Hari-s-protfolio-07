import * as THREE from "three";

(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // 1. Dynamic copyright year
  const year = $("#year");
  if (year) {
    year.textContent = new Date().getFullYear();
  }

  // 2. Scroll progress bar
  const progress = $("#progress");

  function updateProgress() {
    const maxScroll =
      document.documentElement.scrollHeight - window.innerHeight;

    const percent =
      maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;

    if (progress) {
      progress.style.width = `${percent}%`;
    }
  }

  window.addEventListener("scroll", updateProgress, {
    passive: true
  });

  updateProgress();

  // 3. Scroll reveal animations
  const revealElements = $$(".reveal");

  if (
    reducedMotion ||
    !("IntersectionObserver" in window)
  ) {
    revealElements.forEach((element) => {
      element.classList.add("visible");
    });
  } else {
    const observer = new IntersectionObserver(
      (entries, observerInstance) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observerInstance.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -35px 0px"
      }
    );

    revealElements.forEach((element, index) => {
      element.style.setProperty(
        "--delay",
        `${(index % 4) * 80}ms`
      );

      observer.observe(element);
    });
  }

  // 4. Active navigation links
  const navLinks = $$(".nav-links a");

  const sections = navLinks
    .map((link) => $(link.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          navLinks.forEach((link) => {
            const active =
              link.getAttribute("href") ===
              `#${entry.target.id}`;

            if (active) {
              link.setAttribute("aria-current", "location");
            } else {
              link.removeAttribute("aria-current");
            }
          });
        });
      },
      {
        rootMargin: "-25% 0px -60% 0px"
      }
    );

    sections.forEach((section) => {
      navObserver.observe(section);
    });
  }

  // 5. Project card interactions
  $$(".project").forEach((card) => {
    card.setAttribute("tabindex", "0");

    if (!reducedMotion) {
      card.addEventListener("pointermove", (event) => {
        if (event.pointerType === "touch") return;

        const rect = card.getBoundingClientRect();

        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;

        const rotateX = (0.5 - y) * 2.5;
        const rotateY = (x - 0.5) * 2.5;

        card.style.transform =
          `translateY(-5px) perspective(900px) ` +
          `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });

      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    }
  });

  // 6. Three.js interactive 3D scene
  const sceneHost = $("#scene");

  if (!sceneHost) return;

  let renderer;

  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
  } catch (error) {
    console.warn("WebGL is unavailable.", error);
    return;
  }

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, 2)
  );

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  renderer.domElement.setAttribute("aria-hidden", "true");
  sceneHost.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    38,
    1,
    0.1,
    100
  );

  camera.position.set(0, 0, 8);

  const group = new THREE.Group();
  scene.add(group);

  // Main 3D object
  const coreGeometry = new THREE.IcosahedronGeometry(
    1.25,
    2
  );

  const coreMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x182014,
    metalness: 0.7,
    roughness: 0.24,
    clearcoat: 1,
    clearcoatRoughness: 0.18,
    flatShading: true
  });

  const core = new THREE.Mesh(
    coreGeometry,
    coreMaterial
  );

  group.add(core);

  // Neon wireframe
  const wireGeometry = new THREE.IcosahedronGeometry(
    1.48,
    2
  );

  const wireMaterial = new THREE.MeshBasicMaterial({
    color: 0xc5ff42,
    wireframe: true,
    transparent: true,
    opacity: 0.72
  });

  const wire = new THREE.Mesh(
    wireGeometry,
    wireMaterial
  );

  group.add(wire);

  // Orbiting rings
  const ringGeometry = new THREE.TorusGeometry(
    0.78,
    0.018,
    8,
    100
  );

  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xe8ffb0
  });

  const ringA = new THREE.Mesh(
    ringGeometry,
    ringMaterial
  );

  ringA.rotation.set(1.05, 0.35, 0.25);
  group.add(ringA);

  const ringB = new THREE.Mesh(
    new THREE.TorusGeometry(1.85, 0.009, 6, 120),
    new THREE.MeshBasicMaterial({
      color: 0xc5ff42,
      transparent: true,
      opacity: 0.45
    })
  );

  ringB.rotation.set(0.9, 0.2, -0.45);
  group.add(ringB);

  const ringC = new THREE.Mesh(
    new THREE.TorusGeometry(2.05, 0.007, 6, 120),
    new THREE.MeshBasicMaterial({
      color: 0x8b9d69,
      transparent: true,
      opacity: 0.38
    })
  );

  ringC.rotation.set(1.5, -0.55, 0.3);
  group.add(ringC);

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 1.7));

  const keyLight = new THREE.PointLight(
    0xc5ff42,
    48,
    20
  );

  keyLight.position.set(3, 2, 5);
  scene.add(keyLight);

  const fillLight = new THREE.PointLight(
    0x819cba,
    22,
    18
  );

  fillLight.position.set(-4, -2, 2);
  scene.add(fillLight);

  // 7. Floating particles
  const particleCount = 280;
  const positions = new Float32Array(
    particleCount * 3
  );

  const particleData = [];

  for (let i = 0; i < particleCount; i++) {
    const radius = 2.1 + Math.random() * 2.7;
    const angle = Math.random() * Math.PI * 2;
    const height = (Math.random() - 0.5) * 5.2;

    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = height;
    positions[i * 3 + 2] = Math.sin(angle) * radius;

    particleData.push({
      radius,
      angle,
      height,
      speed:
        (Math.random() * 0.12 + 0.025) *
        (Math.random() < 0.5 ? -1 : 1)
    });
  }

  const particleGeometry = new THREE.BufferGeometry();

  particleGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
  );

  const particleMaterial = new THREE.PointsMaterial({
    color: 0xc5ff42,
    size: 0.025,
    transparent: true,
    opacity: 0.7
  });

  const particles = new THREE.Points(
    particleGeometry,
    particleMaterial
  );

  scene.add(particles);

  // 8. Mouse movement and dragging
  const pointer = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0
  };

  const drag = {
    active: false,
    x: 0,
    y: 0,
    rotationX: 0,
    rotationY: 0
  };

  sceneHost.addEventListener("pointermove", (event) => {
    const rect = sceneHost.getBoundingClientRect();

    pointer.targetX =
      ((event.clientX - rect.left) / rect.width - 0.5) * 2;

    pointer.targetY =
      ((event.clientY - rect.top) / rect.height - 0.5) * 2;

    if (drag.active) {
      group.rotation.y =
        drag.rotationY +
        (event.clientX - drag.x) * 0.008;

      group.rotation.x =
        drag.rotationX +
        (event.clientY - drag.y) * 0.008;
    }
  });

  sceneHost.addEventListener("pointerdown", (event) => {
    if (event.target.closest("a, button")) return;

    drag.active = true;
    drag.x = event.clientX;
    drag.y = event.clientY;
    drag.rotationX = group.rotation.x;
    drag.rotationY = group.rotation.y;

    sceneHost.style.cursor = "grabbing";
  });

  function stopDragging() {
    drag.active = false;
    sceneHost.style.cursor = "grab";
  }

  window.addEventListener("pointerup", stopDragging);
  window.addEventListener("pointercancel", stopDragging);

  sceneHost.addEventListener("pointerleave", () => {
    pointer.targetX = 0;
    pointer.targetY = 0;
  });

  // 9. Responsive canvas sizing
  function resizeScene() {
    const width = Math.max(1, sceneHost.clientWidth);
    const height = Math.max(1, sceneHost.clientHeight);

    renderer.setSize(width, height, false);

    camera.aspect = width / height;
    camera.position.x = width < 600 ? 0.35 : 1.2;
    camera.position.z = width < 600 ? 9 : 8;
    camera.updateProjectionMatrix();

    group.position.x = width < 600 ? 1.15 : 2.05;
    group.scale.setScalar(width < 600 ? 0.72 : 1);
  }

  resizeScene();

  window.addEventListener("resize", resizeScene, {
    passive: true
  });

  const resizeObserver =
    "ResizeObserver" in window
      ? new ResizeObserver(resizeScene)
      : null;

  if (resizeObserver) {
    resizeObserver.observe(sceneHost);
  }

  // 10. Animation loop
  const clock = new THREE.Clock();
  let animationFrame;
  let pageVisible = !document.hidden;

  function animate() {
    animationFrame = requestAnimationFrame(animate);

    if (!pageVisible) return;

    const elapsed = clock.getElapsedTime();

    pointer.x +=
      (pointer.targetX - pointer.x) * 0.035;

    pointer.y +=
      (pointer.targetY - pointer.y) * 0.035;

    if (!drag.active && !reducedMotion) {
      group.rotation.y += 0.0035;

      group.rotation.x +=
        (pointer.y * 0.12 - group.rotation.x) * 0.018;

      group.rotation.y += pointer.x * 0.0015;
    }

    core.rotation.y = -elapsed * 0.08;

    wire.rotation.y = elapsed * 0.12;
    wire.rotation.x = -elapsed * 0.07;

    ringA.rotation.z = elapsed * 0.16;
    ringB.rotation.z = -elapsed * 0.045;

    ringC.rotation.x =
      1.5 + Math.sin(elapsed * 0.18) * 0.08;

    if (!reducedMotion) {
      const attribute =
        particleGeometry.attributes.position;

      for (let i = 0; i < particleCount; i++) {
        const particle = particleData[i];

        const angle =
          particle.angle + elapsed * particle.speed;

        attribute.array[i * 3] =
          Math.cos(angle) * particle.radius;

        attribute.array[i * 3 + 1] =
          particle.height +
          Math.sin(elapsed * 0.35 + particle.angle) * 0.08;

        attribute.array[i * 3 + 2] =
          Math.sin(angle) * particle.radius;
      }

      attribute.needsUpdate = true;
      particles.rotation.y = elapsed * 0.025;
    }

    renderer.render(scene, camera);
  }

  document.addEventListener("visibilitychange", () => {
    pageVisible = !document.hidden;

    if (pageVisible) {
      clock.start();
    }
  });

  animate();

  // 11. Clean up Three.js resources
  window.addEventListener(
    "pagehide",
    () => {
      cancelAnimationFrame(animationFrame);

      resizeObserver?.disconnect();

      window.removeEventListener(
        "pointerup",
        stopDragging
      );

      window.removeEventListener(
        "pointercancel",
        stopDragging
      );

      window.removeEventListener(
        "resize",
        resizeScene
      );

      coreGeometry.dispose();
      coreMaterial.dispose();

      wireGeometry.dispose();
      wireMaterial.dispose();

      ringGeometry.dispose();
      ringMaterial.dispose();

      ringB.geometry.dispose();
      ringB.material.dispose();

      ringC.geometry.dispose();
      ringC.material.dispose();

      particleGeometry.dispose();
      particleMaterial.dispose();

      renderer.dispose();
    },
    { once: true }
  );
})();