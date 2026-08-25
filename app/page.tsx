"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ShoppingBag, Upload, Download, ShoppingCart, RotateCcw,
  Camera, Menu, ChevronRight, Plus, Minus, Trash2, MessageCircle,
  Check, Sparkles
} from "lucide-react";

// ============================================================
// VASTI v2 — VIRTUAL WIG TRY-ON APP
// Next.js 14 + Tailwind CSS + Framer Motion
// Catálogo real: Lla, Sofia, Elizabeth, Romi
// Features: Carrito, WhatsApp, Menú mobile, IA ready
// ============================================================

interface Product {
  id: number;
  nombre: string;
  color: string;
  largo: string;
  estilo: string;
  textura: string;
  imagen_url: string;
  categoria: string[];
  precio: number;
  precio_str: string;
  bestseller: boolean;
  desc: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

// ---------- CATÁLOGO REAL VASTI (imágenes 1:1 de pelucas reales) ----------
const products: Product[] = [
  {
    id: 1,
    nombre: "VASTI - LLA",
    color: "Rubia",
    largo: "Largo",
    estilo: "Ondas de Sirena",
    textura: "Lace Front",
    imagen_url: "https://kimi-web-img.kimi.ai/img/www.everydaywigs.com/4d160a17cfb304d2e5e82765c3396a36b94d1986.jpg",
    categoria: ["rubias", "largas", "premium"],
    precio: 320000,
    precio_str: "$320.000",
    bestseller: true,
    desc: "Lla es la estrella de VASTI. Peluca rubia con lace front invisible y ondas de sirena que caen con elegancia natural. Perfecta para quienes buscan volumen, brillo y un look de alfombra roja."
  },
  {
    id: 2,
    nombre: "VASTI - SOFIA",
    color: "Rubia con Mechas",
    largo: "Corto",
    estilo: "Bob con Mechas",
    textura: "Fibra Premium",
    imagen_url: "https://kimi-web-img.kimi.ai/img/i.ebayimg.com/50bb0a675ad55e41d72f3b8d87edf878d8e7ee46.jpg",
    categoria: ["rubias", "cortas"],
    precio: 245000,
    precio_str: "$245.000",
    bestseller: false,
    desc: "Sofia reinventa el corte bob con mechas rubias que aportan dimensión y movimiento. Moderna, fresca y versátil. Ideal para quienes buscan un cambio impactante sin perder la feminidad."
  },
  {
    id: 3,
    nombre: "VASTI - ELIZABETH",
    color: "Rubio Oscuro con Mechas",
    largo: "Medio-Largo",
    estilo: "Ondulado",
    textura: "Seda Natural",
    imagen_url: "https://kimi-web-img.kimi.ai/img/i.ebayimg.com/c75c5d7f7af604ed3ff9ad269697e4b184534a4e.JPG",
    categoria: ["rubias", "largas", "premium"],
    precio: 290000,
    precio_str: "$290.000",
    bestseller: true,
    desc: "Elizabeth combina la sofisticación del rubio oscuro con mechas sutiles que captan la luz. Ondas suaves de seda natural que caen con gracia sobre los hombros. Una elección atemporal."
  },
  {
    id: 4,
    nombre: "VASTI - ROMI",
    color: "Negro",
    largo: "Largo",
    estilo: "Liso",
    textura: "Seda Natural",
    imagen_url: "https://kimi-web-img.kimi.ai/img/i.ebayimg.com/1d8baccdb35fea161f5c26452af80a8e547a9039.jpg",
    categoria: ["morenas", "largas", "premium"],
    precio: 275000,
    precio_str: "$275.000",
    bestseller: false,
    desc: "Romi es pureza y misterio en su máxima expresión. Cabello negro intenso de seda natural con brillo espejo y caída impecable. El largo extra le otorga un movimiento cinematográfico."
  }
];

const filters = [
  { key: "todas", label: "Todas" },
  { key: "rubias", label: "Rubias" },
  { key: "morenas", label: "Morenas" },
  { key: "largas", label: "Largas" },
  { key: "cortas", label: "Cortas" },
  { key: "premium", label: "Premium" },
];

const WHATSAPP_NUMBER = "549XXXXXXXXXX"; // ← Cambiá esto por tu número real

// ============================================================
// FUNCIÓN IA — Lista para conectar con Google Gemini 2.5 Flash
// ============================================================

/*
// === INTEGRACIÓN REAL CON NANO BANANA API (Google Gemini 2.5 Flash Image) ===
// 1. Andá a https://nano-banana.com y creá una cuenta
// 2. Obtené tu API key
// 3. En Vercel → Settings → Environment Variables, agregá: NANO_BANANA_API_KEY (sin NEXT_PUBLIC_)
// 4. Guardá y redeployá

async function generateVastiTryOn(
  userPhotoFile: File,
  wigImageUrl: string,
  wigName: string
): Promise<string> {
  const formData = new FormData();
  formData.append("image", userPhotoFile);
  formData.append("wig_url", wigImageUrl);
  formData.append("wig_name", wigName);
  formData.append("prompt", `Place this exact wig (${wigName}) on the person in the photo. Keep the face 100% identical. Photorealistic result.`);

  // Llamamos a nuestro propio endpoint del servidor (seguro, la API key no se expone)
  const res = await fetch("/api/try-on", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${res.status}`);
  }

  const data = await res.json();
  return data.result_url || data.image_url;
}
*/

// === MOCK (funciona sin API key) ===
async function generateVastiTryOn(
  _userPhotoFile: File,
  wigImageUrl: string,
  _wigName: string
): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(wigImageUrl);
    }, 3000);
  });
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function VastiApp() {
  // --- Estados ---
  const [activeFilter, setActiveFilter] = useState("todas");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [tryOnStep, setTryOnStep] = useState<"upload" | "loading" | "result" | null>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [userPhotoFile, setUserPhotoFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartAnimating, setCartAnimating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const catalogRef = useRef<HTMLDivElement>(null);

  // --- Filtrado ---
  const filteredProducts = activeFilter === "todas"
    ? products
    : products.filter((p) => p.categoria.includes(activeFilter));

  // --- Carrito ---
  const cartTotal = cart.reduce((sum, item) => sum + item.product.precio * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setCartAnimating(true);
    setTimeout(() => setCartAnimating(false), 300);
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => setCart([]);

  // --- WhatsApp ---
  const generateWhatsAppLink = () => {
    if (cart.length === 0) return "";
    const items = cart
      .map((item) => `• ${item.product.nombre} x${item.quantity} — ${item.product.precio_str}`)
      .join("%0A");
    const total = `$${cartTotal.toLocaleString("es-AR")}`;
    const message = `¡Hola! 👋%0A%0AQuiero consultar sobre estas pelucas VASTI que agregué al carrito:%0A%0A${items}%0A%0A*Total: ${total}*%0A%0A¿Me podés ayudar con la compra? 💕`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
  };

  // --- Upload ---
  const handleFile = useCallback((file: File) => {
    setUserPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setUserPhoto(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    },
    [handleFile]
  );

  // --- Try-On Flow ---
  const startTryOn = async () => {
    if (!userPhotoFile || !selectedProduct) return;
    setTryOnStep("loading");
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 95) { clearInterval(interval); return 95; }
        return p + Math.random() * 12 + 3;
      });
    }, 350);

    try {
      const result = await generateVastiTryOn(userPhotoFile, selectedProduct.imagen_url, selectedProduct.nombre);
      clearInterval(interval);
      setProgress(100);
      setResultImage(result);
      setTimeout(() => setTryOnStep("result"), 400);
    } catch (err) {
      clearInterval(interval);
      console.error(err);
      setResultImage(selectedProduct.imagen_url);
      setTimeout(() => setTryOnStep("result"), 400);
    }
  };

  const resetTryOn = () => {
    setUserPhoto(null);
    setUserPhotoFile(null);
    setConsent(false);
    setResultImage(null);
    setProgress(0);
  };

  const closeAll = () => {
    setSelectedProduct(null);
    setTryOnStep(null);
    resetTryOn();
    setMobileMenuOpen(false);
  };

  const scrollToCatalog = () => {
    catalogRef.current?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  // --- Lock body scroll ---
  useEffect(() => {
    const locked = selectedProduct || tryOnStep || cartOpen || mobileMenuOpen;
    document.body.style.overflow = locked ? "hidden" : "";
  }, [selectedProduct, tryOnStep, cartOpen, mobileMenuOpen]);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-[#F9F5F1] text-[#0A0A0A] font-sans selection:bg-[#C9A96E] selection:text-white">

      {/* ===== HEADER ===== */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#F9F5F1]/90 backdrop-blur-xl border-b border-[#E8DDD0]/50 h-[72px] flex items-center justify-between px-6 md:px-8">
        <button onClick={closeAll} className="font-serif text-[28px] font-semibold tracking-[6px] text-[#0A0A0A] hover:text-[#C9A96E] transition-colors">
          VASTI
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-10">
          <button onClick={scrollToCatalog} className="text-[13px] font-medium tracking-[1.5px] uppercase hover:text-[#C9A96E] transition-colors">Catálogo</button>
          <button onClick={scrollToCatalog} className="text-[13px] font-medium tracking-[1.5px] uppercase hover:text-[#C9A96E] transition-colors">Colecciones</button>
          <button onClick={scrollToCatalog} className="text-[13px] font-medium tracking-[1.5px] uppercase hover:text-[#C9A96E] transition-colors">Probador IA</button>
          <button
            onClick={() => setCartOpen(true)}
            className="bg-[#0A0A0A] text-[#F9F5F1] px-6 py-2.5 text-[12px] font-medium tracking-[1.5px] uppercase hover:bg-[#1C1C1C] transition-colors flex items-center gap-2"
          >
            <ShoppingBag size={15} />
            Carrito ({cartCount})
          </button>
        </nav>

        {/* Mobile buttons */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={() => setCartOpen(true)}
            className="relative p-2"
          >
            <ShoppingBag size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#C9A96E] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
          <button onClick={() => setMobileMenuOpen(true)} className="p-2">
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* ===== MOBILE MENU (Sidebar) ===== */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[400] bg-[#0A0A0A]/50 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 z-[401] w-[280px] bg-[#F9F5F1] shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-[#E8DDD0]">
                <span className="font-serif text-[20px] font-semibold tracking-[4px]">VASTI</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-[#E8DDD0] rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 flex flex-col p-6 gap-1">
                {["Catálogo", "Colecciones", "Probador IA"].map((item) => (
                  <button
                    key={item}
                    onClick={scrollToCatalog}
                    className="text-left py-4 px-4 text-[14px] font-medium tracking-[1.5px] uppercase hover:bg-[#E8DDD0]/50 rounded-lg transition-colors flex items-center justify-between"
                  >
                    {item}
                    <ChevronRight size={16} className="text-[#C9A96E]" />
                  </button>
                ))}
                <div className="border-t border-[#E8DDD0] my-4" />
                <button
                  onClick={() => { setCartOpen(true); setMobileMenuOpen(false); }}
                  className="text-left py-4 px-4 text-[14px] font-medium tracking-[1.5px] uppercase hover:bg-[#E8DDD0]/50 rounded-lg transition-colors flex items-center justify-between"
                >
                  <span className="flex items-center gap-3">
                    <ShoppingBag size={18} /> Mi Carrito
                  </span>
                  {cartCount > 0 && (
                    <span className="bg-[#C9A96E] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {cartCount}
                    </span>
                  )}
                </button>
              </nav>
              <div className="p-6 border-t border-[#E8DDD0]">
                <p className="text-[11px] text-[#aaa] tracking-[1px] text-center">
                  © 2026 VASTI
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== CART SIDEBAR ===== */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[400] bg-[#0A0A0A]/50 backdrop-blur-sm"
              onClick={() => setCartOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 z-[401] w-full max-w-[420px] bg-[#F9F5F1] shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-[#E8DDD0]">
                <div>
                  <span className="font-serif text-[20px] font-semibold tracking-[2px]">Tu Carrito</span>
                  <p className="text-[12px] text-[#888] mt-1">{cartCount} {cartCount === 1 ? "producto" : "productos"}</p>
                </div>
                <button onClick={() => setCartOpen(false)} className="p-2 hover:bg-[#E8DDD0] rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {cart.length === 0 ? (
                  <div className="text-center py-20">
                    <ShoppingBag size={48} className="mx-auto text-[#E8DDD0] mb-4" />
                    <p className="text-[16px] text-[#888]">Tu carrito está vacío</p>
                    <p className="text-[13px] text-[#aaa] mt-2">Agregá una VASTI para empezar</p>
                    <button
                      onClick={() => setCartOpen(false)}
                      className="mt-6 bg-[#0A0A0A] text-[#F9F5F1] py-3 px-8 text-[12px] font-medium tracking-[2px] uppercase"
                    >
                      Ver Catálogo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex gap-4 bg-white p-4 rounded-lg">
                        <div className="w-20 h-20 relative rounded overflow-hidden flex-shrink-0">
                          <Image src={item.product.imagen_url} alt={item.product.nombre} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-serif text-[14px] font-medium truncate">{item.product.nombre}</h4>
                          <p className="text-[12px] text-[#888]">{item.product.color}</p>
                          <p className="text-[14px] font-semibold mt-1">{item.product.precio_str}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <button
                              onClick={() => updateQuantity(item.product.id, -1)}
                              className="w-7 h-7 border border-[#E8DDD0] rounded flex items-center justify-center hover:border-[#C9A96E] transition-colors"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-[13px] font-medium w-4 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, 1)}
                              className="w-7 h-7 border border-[#E8DDD0] rounded flex items-center justify-center hover:border-[#C9A96E] transition-colors"
                            >
                              <Plus size={12} />
                            </button>
                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="ml-auto text-[#aaa] hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-[#E8DDD0] space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[14px] text-[#888]">Subtotal</span>
                    <span className="font-serif text-[20px] font-semibold">${cartTotal.toLocaleString("es-AR")}</span>
                  </div>
                  <a
                    href={generateWhatsAppLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white py-4 text-[13px] font-medium tracking-[1.5px] uppercase rounded-lg hover:bg-[#128C7E] transition-colors"
                  >
                    <MessageCircle size={18} />
                    Consultar por WhatsApp
                  </a>
                  <button
                    onClick={clearCart}
                    className="w-full text-[12px] text-[#aaa] hover:text-[#0A0A0A] transition-colors tracking-[1px] uppercase"
                  >
                    Vaciar carrito
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== HERO ===== */}
      <section className="pt-[140px] md:pt-[160px] pb-16 md:pb-20 px-6 text-center max-w-[900px] mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[12px] tracking-[4px] uppercase text-[#C9A96E] mb-4"
        >
          El Probador Virtual de VASTI
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-serif text-[clamp(32px,5vw,56px)] font-medium leading-[1.1] mb-5"
        >
          Encontrá tu VASTI ideal en 3 segundos
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-[16px] md:text-[17px] font-light text-[#666] leading-[1.7] mb-10 max-w-[600px] mx-auto"
        >
          Probate toda nuestra colección con Inteligencia Artificial sin moverte de tu casa
        </motion.p>
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={scrollToCatalog}
          className="bg-[#0A0A0A] text-[#F9F5F1] px-10 md:px-12 py-4 md:py-[18px] text-[13px] md:text-[14px] font-medium tracking-[2px] uppercase hover:bg-[#C9A96E] hover:text-[#0A0A0A] transition-all duration-400"
        >
          Empezar a probarme
        </motion.button>
      </section>

      {/* ===== FILTERS ===== */}
      <div ref={catalogRef} className="flex flex-wrap gap-2 md:gap-3 justify-center px-4 md:px-6 pb-8 md:pb-10">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`px-4 md:px-6 py-2 md:py-2.5 text-[11px] md:text-[12px] font-medium tracking-[1px] uppercase border transition-all duration-300 ${
              activeFilter === f.key
                ? "bg-[#0A0A0A] text-[#F9F5F1] border-[#0A0A0A]"
                : "bg-transparent text-[#0A0A0A] border-[#E8DDD0] hover:border-[#C9A96E]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ===== GRID 1:1 ===== */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 px-4 md:px-8 pb-20 max-w-[1200px] mx-auto">
        {filteredProducts.map((p, i) => (
          <motion.div
            key={p.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="bg-white cursor-pointer group overflow-hidden relative shadow-sm hover:shadow-xl transition-shadow duration-500"
            onClick={() => setSelectedProduct(p)}
          >
            <div className="overflow-hidden aspect-square relative">
              <Image
                src={p.imagen_url}
                alt={p.nombre}
                width={600}
                height={600}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              {p.bestseller && (
                <span className="absolute top-2 left-2 md:top-3 md:left-3 bg-[#C9A96E] text-white text-[9px] md:text-[10px] font-semibold tracking-[1px] uppercase px-2 md:px-3 py-1 md:py-1.5">
                  Bestseller
                </span>
              )}
              <div className="absolute inset-0 bg-[#0A0A0A]/0 group-hover:bg-[#0A0A0A]/10 transition-colors duration-500" />
            </div>
            <div className="p-3 md:p-5">
              <h3 className="font-serif text-[14px] md:text-[16px] font-medium mb-1">{p.nombre}</h3>
              <p className="text-[11px] md:text-[12px] text-[#888] tracking-[0.5px]">{p.color} · {p.largo}</p>
              <p className="text-[13px] md:text-[14px] font-semibold mt-1.5 md:mt-2 text-[#0A0A0A]">{p.precio_str}</p>
            </div>
          </motion.div>
        ))}
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="text-center py-10 text-[12px] text-[#aaa] tracking-[1px] border-t border-[#E8DDD0]">
        © 2026 VASTI — Todos los derechos reservados
      </footer>

      {/* ===== PRODUCT MODAL ===== */}
      <AnimatePresence>
        {selectedProduct && !tryOnStep && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#0A0A0A]/60 backdrop-blur-lg flex items-end md:items-center justify-center p-0 md:p-5"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#F9F5F1] w-full max-w-[1000px] max-h-[90vh] overflow-y-auto relative grid md:grid-cols-2 rounded-t-2xl md:rounded-none"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 z-10 bg-white/90 w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#E8DDD0] transition-colors shadow-sm"
              >
                <X size={18} />
              </button>

              <div className="aspect-square md:aspect-[3/4] relative">
                <Image
                  src={selectedProduct.imagen_url}
                  alt={selectedProduct.nombre}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="p-6 md:p-12 flex flex-col justify-center">
                <h2 className="font-serif text-[26px] md:text-[32px] font-medium mb-3">{selectedProduct.nombre}</h2>
                <p className="text-[14px] md:text-[15px] text-[#666] leading-[1.7] mb-6">{selectedProduct.desc}</p>
                <div className="flex gap-4 md:gap-6 mb-6 md:mb-8 text-[12px] md:text-[13px] text-[#888]">
                  <div><strong className="block text-[13px] md:text-[14px] text-[#0A0A0A] mb-1">Color</strong>{selectedProduct.color}</div>
                  <div><strong className="block text-[13px] md:text-[14px] text-[#0A0A0A] mb-1">Largo</strong>{selectedProduct.largo}</div>
                  <div><strong className="block text-[13px] md:text-[14px] text-[#0A0A0A] mb-1">Textura</strong>{selectedProduct.textura}</div>
                </div>
                <p className="font-serif text-[24px] md:text-[28px] font-semibold mb-6 md:mb-8">{selectedProduct.precio_str}</p>

                <button
                  onClick={() => { resetTryOn(); setTryOnStep("upload"); }}
                  className="bg-[#0A0A0A] text-[#F9F5F1] py-4 md:py-[18px] px-8 md:px-10 text-[13px] font-medium tracking-[1.5px] uppercase hover:bg-[#1C1C1C] transition-colors w-full mb-3 flex items-center justify-center gap-2"
                >
                  <Sparkles size={16} />
                  Probarme esta VASTI
                </button>

                <button
                  onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}
                  className="border border-[#E8DDD0] text-[#0A0A0A] py-4 md:py-[18px] px-8 md:px-10 text-[13px] font-medium tracking-[1.5px] uppercase hover:border-[#C9A96E] hover:bg-[#C9A96E]/[0.05] transition-colors w-full mb-4 flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={16} />
                  Agregar al Carrito
                </button>

                <p className="text-[11px] text-[#aaa] text-center tracking-[0.5px]">
                  Probador con IA de VASTI — 100% privado
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== TRY-ON OVERLAY ===== */}
      <AnimatePresence>
        {tryOnStep && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-[#F9F5F1] flex flex-col"
          >
            <div className="flex justify-between items-center px-6 md:px-8 py-5">
              <span className="font-serif text-[20px] md:text-[22px] font-semibold tracking-[5px]">VASTI</span>
              <button onClick={closeAll} className="p-2 hover:bg-[#E8DDD0] rounded-full transition-colors">
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center px-4 md:px-6 overflow-y-auto">
              <AnimatePresence mode="wait">
                {/* ---------- PASO A: UPLOAD ---------- */}
                {tryOnStep === "upload" && (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center max-w-[500px] w-full pb-8"
                  >
                    <p className="text-[11px] tracking-[3px] uppercase text-[#C9A96E] mb-3">Probador Virtual VASTI</p>
                    <h2 className="font-serif text-[22px] md:text-[26px] font-medium mb-2">
                      Subí tu foto para probarte la<br />{selectedProduct?.nombre}
                    </h2>
                    <p className="text-[13px] md:text-[14px] text-[#888] mb-6 md:mb-8">Tu foto no se guarda. Es 100% privada.</p>

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={onDrop}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      className={`border-2 border-dashed rounded-lg transition-all duration-300 p-8 md:p-12 cursor-pointer bg-white ${
                        dragOver ? "border-[#C9A96E] bg-[#C9A96E]/[0.03]" : "border-[#E8DDD0]"
                      }`}
                    >
                      <Upload className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4 md:mb-5 text-[#C9A96E]" strokeWidth={1.5} />
                      <h3 className="font-serif text-[18px] md:text-[22px] mb-2">Arrastrá tu foto aquí</h3>
                      <p className="text-[13px] md:text-[14px] text-[#888] mb-4 md:mb-5">o tocá para seleccionar</p>
                      <p className="text-[11px] md:text-[12px] text-[#aaa]">
                        De frente, con buena luz, pelo recogido si podés.<br />
                        JPG, PNG · Máx. 10MB
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    />

                    {userPhoto && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-5 md:mt-6 rounded-lg overflow-hidden shadow-xl max-w-[280px] md:max-w-[320px] mx-auto"
                      >
                        <Image src={userPhoto} alt="Tu foto" width={320} height={320} className="w-full aspect-square object-cover" />
                      </motion.div>
                    )}

                    <div className="flex items-start gap-3 mt-5 md:mt-6 text-left max-w-[500px] mx-auto">
                      <input
                        type="checkbox"
                        id="consent"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="w-[18px] h-[18px] mt-0.5 accent-[#0A0A0A] flex-shrink-0"
                      />
                      <label htmlFor="consent" className="text-[12px] md:text-[13px] text-[#666] leading-[1.5]">
                        Acepto el uso temporal de mi imagen para la prueba virtual de VASTI. Mi foto será procesada por IA y no será almacenada.
                      </label>
                    </div>

                    <button
                      onClick={startTryOn}
                      disabled={!userPhoto || !consent}
                      className="bg-[#0A0A0A] text-[#F9F5F1] py-3.5 md:py-4 px-8 md:px-10 text-[12px] md:text-[13px] font-medium tracking-[2px] uppercase hover:bg-[#1C1C1C] transition-colors mt-5 md:mt-6 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Probar esta VASTI
                    </button>
                  </motion.div>
                )}

                {/* ---------- PASO B: LOADING ---------- */}
                {tryOnStep === "loading" && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center px-4"
                  >
                    <motion.div
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="font-serif text-[36px] md:text-[42px] font-semibold tracking-[8px] mb-8 md:mb-10"
                    >
                      VASTI
                    </motion.div>
                    <p className="text-[14px] md:text-[16px] text-[#666] mb-6 md:mb-8 max-w-[400px] leading-[1.6] mx-auto">
                      Colocándote tu {selectedProduct?.nombre}...<br />
                      La magia de VASTI está trabajando
                    </p>
                    <div className="w-[240px] md:w-[280px] h-[2px] bg-[#E8DDD0] rounded overflow-hidden mx-auto">
                      <motion.div className="h-full bg-[#0A0A0A]" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-[11px] md:text-[12px] text-[#aaa] mt-4">
                      {progress < 30 && "Analizando tu rostro..."}
                      {progress >= 30 && progress < 50 && "Ajustando la base de la peluca..."}
                      {progress >= 50 && progress < 70 && "Fusionando tonos y texturas..."}
                      {progress >= 70 && progress < 90 && "Renderizando el resultado final..."}
                      {progress >= 90 && "¡Listo! Preparando tu look VASTI..."}
                    </p>
                  </motion.div>
                )}

                {/* ---------- PASO C: RESULT ---------- */}
                {tryOnStep === "result" && userPhoto && resultImage && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center w-full max-w-[900px] px-4 pb-8"
                  >
                    <p className="text-[11px] tracking-[3px] uppercase text-[#C9A96E] mb-2 md:mb-3">Resultado VASTI</p>
                    <h2 className="font-serif text-[24px] md:text-[28px] font-medium mb-6 md:mb-8">
                      Así te queda {selectedProduct?.nombre}
                    </h2>

                    <CompareSlider beforeImage={userPhoto} afterImage={resultImage} />

                    <div className="flex flex-wrap gap-2 md:gap-3 justify-center mt-6 md:mt-8 mb-8 md:mb-10">
                      <button className="bg-[#0A0A0A] text-[#F9F5F1] py-3 md:py-4 px-6 md:px-8 text-[12px] md:text-[13px] font-medium tracking-[1.5px] uppercase hover:bg-[#1C1C1C] transition-colors flex items-center gap-2">
                        <Download size={15} /> Descargar
                      </button>
                      <button
                        onClick={() => { if (selectedProduct) addToCart(selectedProduct); }}
                        className="border border-[#E8DDD0] text-[#0A0A0A] py-3 md:py-4 px-6 md:px-8 text-[12px] md:text-[13px] font-medium tracking-[1.5px] uppercase hover:border-[#C9A96E] hover:bg-[#C9A96E]/[0.05] transition-colors flex items-center gap-2"
                      >
                        <ShoppingCart size={15} /> Al Carrito
                      </button>
                      <button
                        onClick={() => { resetTryOn(); setTryOnStep("upload"); }}
                        className="border border-[#E8DDD0] text-[#0A0A0A] py-3 md:py-4 px-6 md:px-8 text-[12px] md:text-[13px] font-medium tracking-[1.5px] uppercase hover:border-[#C9A96E] hover:bg-[#C9A96E]/[0.05] transition-colors flex items-center gap-2"
                      >
                        <RotateCcw size={15} /> Otra VASTI
                      </button>
                      <button
                        onClick={() => { resetTryOn(); setTryOnStep("upload"); }}
                        className="border border-[#E8DDD0] text-[#0A0A0A] py-3 md:py-4 px-6 md:px-8 text-[12px] md:text-[13px] font-medium tracking-[1.5px] uppercase hover:border-[#C9A96E] hover:bg-[#C9A96E]/[0.05] transition-colors flex items-center gap-2"
                      >
                        <Camera size={15} /> Otra foto
                      </button>
                    </div>

                    <div className="border-t border-[#E8DDD0] pt-6 md:pt-8 max-w-[500px] mx-auto">
                      <p className="text-[13px] md:text-[14px] text-[#666] mb-3 md:mb-4">¿Te gustó? Comprá esta VASTI ahora</p>
                      <p className="font-serif text-[22px] md:text-[24px] font-semibold mb-3 md:mb-4">{selectedProduct?.precio_str}</p>
                      <button
                        onClick={() => { if (selectedProduct) addToCart(selectedProduct); }}
                        className="bg-[#0A0A0A] text-[#F9F5F1] py-3.5 md:py-4 px-8 md:px-10 text-[12px] md:text-[13px] font-medium tracking-[2px] uppercase hover:bg-[#1C1C1C] transition-colors"
                      >
                        Comprar {selectedProduct?.nombre}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// COMPONENTE: COMPARE SLIDER
// ============================================================
function CompareSlider({ beforeImage, afterImage }: { beforeImage: string; afterImage: string }) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPosition((x / rect.width) * 100);
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => isDragging && handleMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => isDragging && handleMove(e.touches[0].clientX);
    const onUp = () => setIsDragging(false);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
    };
  }, [isDragging, handleMove]);

  return (
    <div className="max-w-[400px] md:max-w-[500px] mx-auto">
      <div
        ref={containerRef}
        className="relative rounded-lg overflow-hidden shadow-2xl aspect-square cursor-ew-resize select-none"
        onClick={(e) => handleMove(e.clientX)}
      >
        <div className="absolute inset-0">
          <Image src={afterImage} alt="Con VASTI" fill className="object-cover" />
        </div>
        <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
          <Image src={beforeImage} alt="Tu foto" fill className="object-cover" />
        </div>
        <div
          className="absolute top-0 bottom-0 w-[3px] bg-white cursor-ew-resize z-10"
          style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 md:w-11 md:h-11 bg-white rounded-full flex items-center justify-center shadow-lg">
            <span className="text-[9px] md:text-[10px] font-bold tracking-[2px] text-[#0A0A0A]">◀ ▶</span>
          </div>
        </div>
      </div>
      <div className="flex justify-between mt-2 px-2">
        <span className="text-[10px] md:text-[11px] font-medium tracking-[2px] uppercase text-[#888]">Tu foto</span>
        <span className="text-[10px] md:text-[11px] font-medium tracking-[2px] uppercase text-[#888]">Con VASTI</span>
      </div>
    </div>
  );
}
