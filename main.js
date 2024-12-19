import * as THREE from "three";
import { GUI } from "dat.gui";
async function loadShaderFile(url) {
  const response = await fetch(url);
  const shaderCode = await response.text();
  return shaderCode;
}

async function main() {
  const gui = new GUI();
  const brushFolder = gui.addFolder("Brush");
  const clearFolder = gui.addFolder("Clear");

  const paramsClear = {
    clearCanvas: function () {
      shaderMaterial.uniforms.clear.value = 1;
      // Сбросить значение clear на следующем кадре
      requestAnimationFrame(() => {
        shaderMaterial.uniforms.clear.value = 0;
      });
    },
  };

  const cursor = document.getElementById("customCursor");
  const blurIcon = document.querySelector(".blurIcon");

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const canvas = renderer.domElement;

  const renderTarget1 = new THREE.WebGLRenderTarget(
    canvas.clientWidth,
    canvas.clientHeight
  );
  const renderTarget2 = new THREE.WebGLRenderTarget(
    canvas.clientWidth,
    canvas.clientHeight
  );

  const rtWidth = 512;
  const rtHeight = 512;
  const renderTarget = new THREE.WebGLRenderTarget(rtWidth, rtHeight);

  const shaderCode = await loadShaderFile("glsl.glsl");
  const camera = new THREE.PerspectiveCamera(
    75,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    1000
  );

  camera.position.z = 5;
  const scene = new THREE.Scene();

  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load("img/1a.png");
  const texture2 = textureLoader.load("img/bg.png");
  const texture3 = textureLoader.load("img/image 1.png");

  const planeGeometry = new THREE.PlaneGeometry(20, 20);
  // Кисть
  let colorInput = new THREE.Color("#000000");

  let brush = {
    size: 0.14,
    sizeBlur: 0.45,
    color: "#000000",
  };
  const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      res: {
        value: new THREE.Vector2(canvas.clientWidth, canvas.clientHeight),
      },
      mouse: { value: new THREE.Vector2() },
      tex: { type: "t", value: texture },
      tex2: { type: "t", value: texture2 },
      tex3: { type: "t", value: texture3 },
      tPrevious: { value: renderTarget.texture },
      time: { value: 0 },
      uMouseBlur: { value: new THREE.Vector2(0.0, 0.0) },
      u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
      u_mousePrevious: { value: new THREE.Vector2(0.5, 0.5) },
      colorBrash: { value: colorInput },
      lineWidth: { value: 0.0 },
      lineWidthPrevious: { value: 0.0 },
      isDraw: { value: 0.0 },
      isPaint: { value: 1.0 },
      clear: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: shaderCode,
  });

  const plane = new THREE.Mesh(planeGeometry, shaderMaterial);
  scene.add(plane);

  const pointer = new THREE.Vector2();
  let isDrawing = false;
  let isPainting = true;
  let currentPressure = 0.0;
  let currentMouse = new THREE.Vector2(0.5, 0.5);
  let previousMouse = new THREE.Vector2(0.5, 0.5);
  let isPicker = false;

  let drawingTimeout;

const startDrawing = (e) => {
  if (isPicker) return;

  // Отложить начало рисования на 10 мс
  clearTimeout(drawingTimeout);
  drawingTimeout = setTimeout(() => {
    isDrawing = true;

    currentMouse.set(e.clientX, -e.clientY + window.innerHeight);
    shaderMaterial.uniforms.u_mousePrevious.value.copy(currentMouse);
    shaderMaterial.uniforms.u_mouse.value.copy(currentMouse);

    const brushSize = isPainting ? brush.size : brush.sizeBlur;
    currentPressure = e.pressure * brushSize || 0.01;
    shaderMaterial.uniforms.lineWidthPrevious.value = currentPressure;
    shaderMaterial.uniforms.lineWidth.value = currentPressure;

    draw(e);
  }, 10);
};

  clearFolder.add(paramsClear, "clearCanvas").name("Clear Canvas");
  clearFolder.open();
  let colorController;
  // Размер кисти
  brushFolder.add(brush, "size", 0.1, 1.0).onChange(function (value) {
    currentPressure = value;
    shaderMaterial.uniforms.lineWidthPrevious.value = currentPressure;
    shaderMaterial.uniforms.lineWidth.value = currentPressure;
  });

  // Размер кисти размытия
  brushFolder.add(brush, "sizeBlur", 0.3, 4.0).onChange(function (value) {
    if (!isPainting) {
      currentPressure = value;
      shaderMaterial.uniforms.lineWidthPrevious.value = currentPressure;
      shaderMaterial.uniforms.lineWidth.value = currentPressure;
    }
  });
  // Цвет кисти
  colorController = brushFolder.addColor(brush, "color").onChange(function () {
    colorInput = new THREE.Color(brush.color);
    shaderMaterial.uniforms.colorBrash.value = new THREE.Color(brush.color);
  });
  brushFolder.open();

  const params = {
    imageFormat: "png",
    imageQuality: 0.9,
    fileName: "canvas-image",
    saveImage: function () {
      // Создаем временный канвас
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = currentRenderTarget.width;
      tempCanvas.height = currentRenderTarget.height;
      const tempContext = tempCanvas.getContext("2d");

      // Создаем буфер для чтения пикселей
      const pixels = new Uint8Array(
        4 * currentRenderTarget.width * currentRenderTarget.height
      );

      // Читаем пиксели из renderTarget
      renderer.readRenderTargetPixels(
        currentRenderTarget,
        0,
        0,
        currentRenderTarget.width,
        currentRenderTarget.height,
        pixels
      );

      // Создаем ImageData для записи в канвас
      const imageData = new ImageData(
        new Uint8ClampedArray(pixels),
        currentRenderTarget.width,
        currentRenderTarget.height
      );

      // Записываем пиксели в временный канвас
      tempContext.putImageData(imageData, 0, 0);

      // Переворачиваем изображение вертикально, так как WebGL и Canvas имеют разную систему координат
      tempContext.scale(1, -1);
      tempContext.drawImage(
        tempCanvas,
        0,
        -currentRenderTarget.height,
        currentRenderTarget.width,
        currentRenderTarget.height
      );

      // Определяем MIME-тип на основе выбранного формата
      const mimeType = `image/${this.imageFormat}`;

      // Создаем URL данных с учетом формата и качества
      const dataURL = tempCanvas.toDataURL(mimeType, this.imageQuality);

      // Создаем ссылку для скачивания
      const link = document.createElement("a");
      link.download = `${this.fileName}.${this.imageFormat}`;
      link.href = dataURL;
      link.click();
    },
  };

  // Создаем папку для параметров сохранения
  const saveFolder = gui.addFolder("Save Options");

  // Добавляем выбор формата
  saveFolder.add(params, "imageFormat", ["png", "jpeg", "webp"]).name("Format");

  // Добавляем слайдер для качества
  saveFolder.add(params, "imageQuality", 0.1, 1).step(0.1).name("Quality");

  // Добавляем поле для имени файла
  saveFolder.add(params, "fileName").name("File Name");

  // Добавляем кнопку сохранения
  saveFolder.add(params, "saveImage").name("Save Image");

  // Открываем папку по умолчанию
  saveFolder.open();

  const draw = (e) => {
    pointer.x = e.clientX;
    pointer.y = -e.clientY + window.innerHeight;
    shaderMaterial.uniforms.uMouseBlur.value = pointer;
    if (!isDrawing) return;
    shaderMaterial.uniforms.isDraw.value = 1.0;
    let brushSize = 0.0;
    if (isPainting) {
      brushSize = brush.size;
    } else {
      brushSize = brush.sizeBlur;
    }
    const targetPressure = e.pressure * brushSize;
    const newPressure = THREE.MathUtils.lerp(
      currentPressure,
      targetPressure,
      0.001
    );

    shaderMaterial.uniforms.lineWidthPrevious.value = currentPressure;
    shaderMaterial.uniforms.lineWidth.value = newPressure;
    currentPressure = targetPressure;

    previousMouse.copy(currentMouse);
    currentMouse.set(e.clientX, -e.clientY + window.innerHeight);

    shaderMaterial.uniforms.u_mousePrevious.value = previousMouse;
    shaderMaterial.uniforms.u_mouse.value = currentMouse;
  };

  const stopDrawing = () => {
    isDrawing = false;
    shaderMaterial.uniforms.isDraw.value = 0.0;
  };

  const inputColor = () => {
    const color = new THREE.Color(colorInput.r, colorInput.g, colorInput.b);
    shaderMaterial.uniforms.colorBrash.value = color;
    return color;
  };

  canvas.addEventListener("pointerdown", startDrawing);
  canvas.addEventListener("pointermove", draw);
  canvas.addEventListener("pointerup", stopDrawing);

  document.addEventListener("keydown", (event) => {
    if (event.code === "KeyZ") {
      isPainting = false;
      shaderMaterial.uniforms.isPaint.value = 0.0;
    } else if (event.key === "Alt") {
      isPicker = true;
    }
  });

  document.addEventListener("keyup", (event) => {
    if (event.code === "KeyZ") {
      isPainting = true;
      shaderMaterial.uniforms.isPaint.value = 1.0;
    } else if (event.key === "Alt") {
      isPicker = false;
    }
  });

  let currentRenderTarget = renderTarget1;
  let previousRenderTarget = renderTarget2;

  window.addEventListener("resize", () => {
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    shaderMaterial.uniforms.res.value.set(
      canvas.clientWidth,
      canvas.clientHeight
    );
  });

  // Функция для считывания цвета под курсором
  function pickColor(x, y) {
    const pixelBuffer = new Uint8Array(4);
    renderer.readRenderTargetPixels(
      currentRenderTarget,
      x,
      currentRenderTarget.height - y,
      1,
      1,
      pixelBuffer
    );
    // Преобразование цвета из rgba() в числовой вектор (vec4)
    const colorVector = new THREE.Vector4(
      pixelBuffer[0] / 255, // R (нормализация к диапазону 0-1)
      pixelBuffer[1] / 255, // G (нормализация к диапазону 0-1)
      pixelBuffer[2] / 255, // B (нормализация к диапазону 0-1)
      pixelBuffer[3] / 255 // A (нормализация к диапазону 0-1)
    );
    const color = `rgba(${pixelBuffer[0]}, ${pixelBuffer[1]}, ${
      pixelBuffer[2]
    }, ${pixelBuffer[3] / 255})`;
    colorInput = new THREE.Color(colorVector.x, colorVector.y, colorVector.z);

    shaderMaterial.uniforms.colorBrash.value = colorInput;

    brush.color = color;

    colorController.updateDisplay();
    console.log("Цвет:", color);
  }

  // Обработчик клика с проверкой нажатия Alt
  canvas.addEventListener("click", (event) => {
    if (event.ctrlKey && event.altKey) {
      pickColor(event.clientX, event.clientY);
    }
  });

  let ctrlPressed = false;
  let altPressed = false;
  let zPressed = false;

  canvas.addEventListener("pointermove", (event) => {
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
  });

  // Обработка нажатия клавиш
  document.addEventListener("keydown", (e) => {
    if (e.key === "Control") ctrlPressed = true;
    if (e.key === "Alt") altPressed = true;
    if (e.code === "KeyZ") zPressed = true;

    // Если одновременно зажаты Ctrl и Alt, активируем режим пипетки
    if (ctrlPressed && altPressed) {
      cursor.classList.add("picker");
    } else if (zPressed) {
      cursor.classList.add("bloor");
      cursor.style.width = brush.sizeBlur * 40 + "px";
      blurIcon.style.display = "block";
    }
  });

  // Обработка отпускания клавиш
  document.addEventListener("keyup", (e) => {
    if (e.key === "Control") ctrlPressed = false;
    if (e.key === "Alt") altPressed = false;
    if (e.code === "KeyZ") zPressed = false;

    // Если отпущена любая из клавиш, отключаем режим пипетки
    if (!ctrlPressed || !altPressed) {
      cursor.classList.remove("picker");
    }
    if (!zPressed) {
      cursor.classList.remove("bloor");
      blurIcon.style.display = "none";
    }
  });

  let time = 0;
  function render() {
    time += 0.01;
    shaderMaterial.uniforms.time.value = time;
    if (zPressed) {
      cursor.style.width = brush.sizeBlur * 40 + "px";
      cursor.style.height = brush.sizeBlur * 40 + "px";
    } else {
      cursor.style.width = brush.size * 40 + "px";
      cursor.style.height = brush.size * 40 + "px";
    }

    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    const temp = currentRenderTarget;
    currentRenderTarget = previousRenderTarget;
    previousRenderTarget = temp;
    shaderMaterial.uniforms.tPrevious.value = previousRenderTarget.texture;

    renderer.setRenderTarget(currentRenderTarget);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);

    renderer.render(scene, camera);

    requestAnimationFrame(render);
  }
  render();

  document.addEventListener("contextmenu", function (event) {
    event.preventDefault();
  });
}

main();
