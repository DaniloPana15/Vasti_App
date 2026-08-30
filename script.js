// ============================================================
// BASE DE DATOS DE PRODUCTOS VASTI
// ============================================================
const products = [
  {  
    id: 1,
    nombre: "VASTI - LIA",
    color: "Rubia",
    largo: "Largo",
    estilo: "Ondas de Sirena",
    textura: "Lace Front",
    imagen_url: "https://i.imgur.com/LzWCusX.jpeg",
    categoria: ["rubias", "largas", "premium"],
    precio: 320000,
    precio_str: "$320.000",
    bestseller: true,
    desc: "Lia es la estrella de VASTI. Peluca rubia con lace front invisible y ondas de sirena que caen con elegancia natural."
  },
  {
    id: 2,
    nombre: "VASTI - SOFIA",
    color: "Rubia con Mechas",
    largo: "Corto",
    estilo: "Bob con Mechas",
    textura: "Fibra Premium",
    imagen_url: "https://i.imgur.com/bcTwv9j.jpeg",
    categoria: ["rubias", "cortas"],
    precio: 245000,
    precio_str: "$245.000",
    bestseller: false,
    desc: "Sofia reinventa el corte bob con mechas rubias que aportan dimensión y movimiento. Moderna, fresca y versátil."
  },
  {
    id: 3,
    nombre: "VASTI - ELIZABETH",
    color: "Rubio Oscuro con Mechas",
    largo: "Medio-Largo",
    estilo: "Ondulado",
    textura: "Seda Natural",
    imagen_url: "https://i.imgur.com/8EjqyvD.jpeg",
    categoria: ["rubias", "largas", "premium"],
    precio: 290000,
    precio_str: "$290.000",
    bestseller: true,
    desc: "Elizabeth combina la sofisticación del rubio oscuro con mechas sutiles que captan la luz."
  },
  {
    id: 4,
    nombre: "VASTI - ROMI",
    color: "Negro",
    largo: "Largo",
    estilo: "Liso",
    textura: "Seda Natural",
    imagen_url: "https://i.imgur.com/Dsgc1GK.jpeg",
    categoria: ["morenas", "largas", "premium"],
    precio: 275000,
    precio_str: "$275.000",
    bestseller: false,
    desc: "Romi es pureza y misterio en su máxima expresión. Cabello negro intenso de seda natural con brillo espejo."
  }
];

const WHATSAPP_NUMBER = "5491164175503";

// ESTADO GLOBAL
let cart = [];
let selectedProduct = null;
let userPhotoData = null;

// ============================================================
// INICIALIZACIÓN Y EVENTOS DOM
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  renderProducts("todas");
  initFilters();
  initModals();
  initCart();
  initTryOn();
  lucide.createIcons();
});

// RENDER DE PRODUCTOS
function renderProducts(filter) {
  const grid = document.getElementById("products-grid");
  grid.innerHTML = "";

  const filtered = filter === "todas" 
    ? products 
    : products.filter(p => p.categoria.includes(filter));

  filtered.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.onclick = () => openProductModal(p);

    card.innerHTML = `
      <div class="product-img-wrapper">
        <img src="${p.imagen_url}" alt="${p.nombre}" />
        ${p.bestseller ? `<span class="bestseller-tag">★ Bestseller</span>` : ""}
      </div>
      <div class="product-info">
        <h3>${p.nombre}</h3>
        <p>${p.color} · ${p.largo}</p>
        <p class="product-price">${p.precio_str}</p>
      </div>
    `;
    grid.appendChild(card);
  });
}

// FILTROS
function initFilters() {
  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderProducts(btn.dataset.filter);
    });
  });
}

// MODAL PRODUCTO
function openProductModal(product) {
  selectedProduct = product;
  document.getElementById("modal-img").src = product.imagen_url;
  document.getElementById("modal-title").innerText = product.nombre;
  document.getElementById("modal-desc").innerText = product.desc;
  document.getElementById("modal-color").innerText = product.color;
  document.getElementById("modal-largo").innerText = product.largo;
  document.getElementById("modal-textura").innerText = product.textura;
  document.getElementById("modal-price").innerText = product.precio_str;

  document.getElementById("product-modal").classList.add("active");
}

function initModals() {
  document.getElementById("close-modal-btn").onclick = () => {
    document.getElementById("product-modal").classList.remove("active");
  };

  document.getElementById("modal-add-cart").onclick = () => {
    addToCart(selectedProduct);
    document.getElementById("product-modal").classList.remove("active");
  };

  document.getElementById("modal-start-tryon").onclick = () => {
    document.getElementById("product-modal").classList.remove("active");
    openTryOnOverlay();
  };
}

// CARRITO
function addToCart(product) {
  const item = cart.find(i => i.product.id === product.id);
  if (item) {
    item.quantity++;
  } else {
    cart.push({ product, quantity: 1 });
  }
  updateCartUI();
}

function updateCartUI() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + (item.product.precio * item.quantity), 0);

  document.getElementById("cart-count").innerText = count;
  document.getElementById("cart-count-badge").innerText = count;
  document.getElementById("cart-count-mobile-badge").innerText = count;

  const cartBody = document.getElementById("cart-body");
  const cartFooter = document.getElementById("cart-footer");

  if (cart.length === 0) {
    cartBody.innerHTML = `<p style="text-align:center; color:rgba(255,255,255,0.4); margin-top:40px;">Tu carrito está vacío</p>`;
    cartFooter.style.display = "none";
  } else {
    cartBody.innerHTML = "";
    cart.forEach(item => {
      const div = document.createElement("div");
      div.className = "cart-item";
      div.innerHTML = `
        <img src="${item.product.imagen_url}" />
        <div class="cart-item-details">
          <h4>${item.product.nombre}</h4>
          <p>${item.product.precio_str} (x${item.quantity})</p>
        </div>
      `;
      cartBody.appendChild(div);
    });
    cartFooter.style.display = "block";
    document.getElementById("cart-total-price").innerText = `$${total.toLocaleString("es-AR")}`;

    // Generar enlace WhatsApp
    const message = cart.map(i => `• ${i.product.nombre} x${i.quantity}`).join("%0A");
    document.getElementById("whatsapp-btn").href = `https://wa.me/${WHATSAPP_NUMBER}?text=Hola!%20Quiero%20consultar%20por:%0A${message}`;
  }
}

function initCart() {
  const overlay = document.getElementById("cart-overlay");
  document.getElementById("open-cart-btn").onclick = () => overlay.classList.add("active");
  document.getElementById("open-cart-mobile").onclick = () => overlay.classList.add("active");
  document.getElementById("close-cart-btn").onclick = () => overlay.classList.remove("active");
  document.getElementById("clear-cart-btn").onclick = () => { cart = []; updateCartUI(); };
}

// PROBADOR VIRTUAL IA
function openTryOnOverlay() {
  document.getElementById("tryon-wig-name").innerText = selectedProduct.nombre;
  document.getElementById("tryon-step-upload").style.display = "block";
  document.getElementById("tryon-step-loading").style.display = "none";
  document.getElementById("tryon-step-result").style.display = "none";
  document.getElementById("tryon-overlay").classList.add("active");
}

function initTryOn() {
  const dropZone = document.getElementById("drop-zone");
  const fileInput = document.getElementById("file-input");
  const consent = document.getElementById("consent-check");
  const btnProcess = document.getElementById("btn-start-process");

  document.getElementById("close-tryon-btn").onclick = () => {
    document.getElementById("tryon-overlay").classList.remove("active");
  };

  dropZone.onclick = () => fileInput.click();

  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        userPhotoData = event.target.result;
        document.getElementById("user-photo-img").src = userPhotoData;
        document.getElementById("photo-preview-box").style.display = "block";
        checkReady();
      };
      reader.readAsDataURL(file);
    }
  };

  consent.onchange = checkReady;

  function checkReady() {
    btnProcess.disabled = !(userPhotoData && consent.checked);
  }

  btnProcess.onclick = startSimulatedAI;
}

function startSimulatedAI() {
  document.getElementById("tryon-step-upload").style.display = "none";
  document.getElementById("tryon-step-loading").style.display = "block";

  let progress = 0;
  const progressFill = document.getElementById("progress-fill");
  const progressText = document.getElementById("progress-text");

  const interval = setInterval(() => {
    progress += 10;
    progressFill.style.width = `${progress}%`;

    if (progress === 30) progressText.innerText = "Detectando rostro...";
    if (progress === 60) progressText.innerText = "Ajustando peluca VASTI...";
    if (progress === 90) progressText.innerText = "Finalizando detalles...";

    if (progress >= 100) {
      clearInterval(interval);
      showResult();
    }
  }, 300);
}

function showResult() {
  document.getElementById("tryon-step-loading").style.display = "none";
  document.getElementById("tryon-step-result").style.display = "block";

  document.getElementById("result-wig-name").innerText = selectedProduct.nombre;
  document.getElementById("result-price").innerText = selectedProduct.precio_str;

  document.getElementById("slider-before").src = userPhotoData;
  document.getElementById("slider-after").src = selectedProduct.imagen_url;

  initCompareSlider();

  document.getElementById("btn-result-add-cart").onclick = () => {
    addToCart(selectedProduct);
    document.getElementById("tryon-overlay").classList.remove("active");
  };

  document.getElementById("btn-result-retry").onclick = () => {
    openTryOnOverlay();
  };
}

// SLIDER DE COMPARACIÓN
function initCompareSlider() {
  const container = document.getElementById("slider-container");
  const handle = document.getElementById("slider-handle");
  const beforeWrapper = document.getElementById("slider-before-wrapper");

  let isDragging = false;

  const move = (x) => {
    const rect = container.getBoundingClientRect();
    let pos = ((x - rect.left) / rect.width) * 100;
    if (pos < 0) pos = 0;
    if (pos > 100) pos = 100;

    handle.style.left = `${pos}%`;
    beforeWrapper.style.width = `${pos}%`;
  };

  container.onmousedown = () => isDragging = true;
  window.onmouseup = () => isDragging = false;
  window.onmousemove = (e) => { if (isDragging) move(e.clientX); };

  container.ontouchstart = () => isDragging = true;
  window.ontouchend = () => isDragging = false;
  window.ontouchmove = (e) => { if (isDragging) move(e.touches[0].clientX); };
    }

