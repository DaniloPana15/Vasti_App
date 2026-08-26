"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ShoppingBag, Upload, Download, ShoppingCart, RotateCcw,
  Camera, Menu, ChevronRight, Plus, Minus, Trash2, MessageCircle,
  Check, Sparkles, Zap, Star
} from "lucide-react";

// ============================================================
// VASTI v3 — FUTURISTA & SOFISTICADA
// Degradados, glassmorphism, glow effects
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

const products: Product[] = [
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
    desc: "Lla es la estrella de VASTI. Peluca rubia con lace front invisible y ondas de sirena que caen con elegancia natural. Perfecta para quienes buscan volumen, brillo y un look de alfombra roja."
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
    desc: "Sofia reinventa el corte bob con mechas rubias que aportan dimensión y movimiento. Moderna, fresca y versátil. Ideal para quienes buscan un cambio impactante sin perder la feminidad."
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
    desc: "Elizabeth combina la sofisticación del rubio oscuro con mechas sutiles que captan la luz. Ondas suaves de seda natural que caen con gracia sobre los hombros. Una elección atemporal."
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

const WHATSAPP_NUMBER = "549XXXXXXXXXX";

// ============================================================
// FUNCIÓN IA
// ============================================================

async function generateVastiTryOn(
  userPhotoFile: File,
  wigImageUrl: string,
  wigName: string
): Promise<string> {
  const formData = new FormData();
  formData.append("image", userPhotoFile);
  formData.append("wig_url", wigImageUrl);
  formData.append("wig_name", wigName);

  const res = await fetch("/api/try-on", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${res.status}`);
  }

  const data = await res.json();
  return data.result_url; // Ya viene en formato base64 data URL listo para usar
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function VastiApp() {
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
  const [tryOnError, setTryOnError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const catalogRef = useRef<HTMLDivElement>(null);

  const filteredProducts = activeFilter === "todas"
    ? products
    : products.filter((p) => p.categoria.includes(activeFilter));

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

  const generateWhatsAppLink = () => {
    if (cart.length === 0) return "";
    const items = cart
      .map((item) => `• ${item.product.nombre} x${item.quantity} — ${item.product.precio_str}`)
      .join("%0A");
    const total = `$${cartTotal.toLocaleString("es-AR")}`;
    const message = `¡Hola! 👋%0A%0AQuiero consultar sobre estas pelucas VASTI:%0A%0A${items}%0A%0A*Total: ${total}*%0A%0A¿Me podés ayudar? 💕`;
    return `https://wa.me/${5491164175503}?text=${message}`;
  };

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

  const startTryOn = async () => {
    if (!userPhotoFile || !selectedProduct) return;
    setTryOnStep("loading");
    setProgress(0);
    setTryOnError(null);

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) { clearInterval(interval); return 90; }
        return p + Math.random() * 8 + 2;
      });
    }, 600);

    try {
      const result = await generateVastiTryOn(userPhotoFile, selectedProduct.imagen_url, selectedProduct.nombre);
      clearInterval(interval);
      setProgress(100);
      setResultImage(result);
      setTimeout(() => setTryOnStep("result"), 400);
    } catch (err: any) {
      clearInterval(interval);
      setTryOnError(err.message || "Error al generar la imagen.");
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
    setTryOnError(null);
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

  useEffect(() => {
    const locked = selectedProduct || tryOnStep || cartOpen || mobileMenuOpen;
    document.body.style.overflow = locked ? "hidden" : "";
  }, [selectedProduct, tryOnStep, cartOpen, mobileMenuOpen]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#12121a] to-[#1a1a2e] text-[#f0f0f5] font-sans selection:bg-[#C9A96E] selection:text-[#0a0a0f]">

      {/* Animated background gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#C9A96E]/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#d4a5a5]/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[60%] w-[400px] h-[400px] bg-[#C9A96E]/3 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* ===== HEADER ===== */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/70 backdrop-blur-2xl border-b border-white/5 h-[72px] flex items-center justify-between px-6 md:px-8">
        <button onClick={closeAll} className="font-serif text-[28px] font-semibold tracking-[6px] text-white hover:text-[#C9A96E] transition-all duration-500">
          VASTI
        </button>

        <nav className="hidden md:flex items-center gap-10">
          <button onClick={scrollToCatalog} className="text-[13px] font-medium tracking-[1.5px] uppercase text-white/60 hover:text-[#C9A96E] transition-all duration-300">Catálogo</button>
          <button onClick={scrollToCatalog} className="text-[13px] font-medium tracking-[1.5px] uppercase text-white/60 hover:text-[#C9A96E] transition-all duration-300">Colecciones</button>
          <button onClick={scrollToCatalog} className="text-[13px] font-medium tracking-[1.5px] uppercase text-white/60 hover:text-[#C9A96E] transition-all duration-300">Probador IA</button>
          <button
            onClick={() => setCartOpen(true)}
            className="relative bg-gradient-to-r from-[#C9A96E] to-[#d4a5a5] text-[#0a0a0f] px-6 py-2.5 text-[12px] font-bold tracking-[1.5px] uppercase hover:shadow-[0_0_30px_rgba(201,169,110,0.4)] transition-all duration-500 flex items-center gap-2 rounded-full"
          >
            <ShoppingBag size={15} />
            Carrito ({cartCount})
          </button>
        </nav>

        <div className="flex items-center gap-3 md:hidden">
          <button onClick={() => setCartOpen(true)} className="relative p-2 text-white/80">
            <ShoppingBag size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gradient-to-r from-[#C9A96E] to-[#d4a5a5] text-[#0a0a0f] text-[10px] font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-white/80">
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* ===== MOBILE MENU ===== */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 z-[401] w-[300px] bg-[#12121a]/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <span className="font-serif text-[20px] font-semibold tracking-[4px] text-white">VASTI</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 flex flex-col p-6 gap-2">
                {["Catálogo", "Colecciones", "Probador IA"].map((item) => (
                  <button key={item} onClick={scrollToCatalog} className="text-left py-4 px-4 text-[14px] font-medium tracking-[1.5px] uppercase text-white/60 hover:text-[#C9A96E] hover:bg-white/5 rounded-xl transition-all flex items-center justify-between">
                    {item} <ChevronRight size={16} className="text-[#C9A96E]/60" />
                  </button>
                ))}
                <div className="border-t border-white/10 my-4" />
                <button onClick={() => { setCartOpen(true); setMobileMenuOpen(false); }} className="text-left py-4 px-4 text-[14px] font-medium tracking-[1.5px] uppercase text-white/60 hover:text-[#C9A96E] hover:bg-white/5 rounded-xl transition-all flex items-center justify-between">
                  <span className="flex items-center gap-3"><ShoppingBag size={18} /> Mi Carrito</span>
                  {cartCount > 0 && <span className="bg-gradient-to-r from-[#C9A96E] to-[#d4a5a5] text-[#0a0a0f] text-[11px] font-bold px-2.5 py-1 rounded-full">{cartCount}</span>}
                </button>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== CART SIDEBAR ===== */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 z-[401] w-full max-w-[420px] bg-[#12121a]/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div>
                  <span className="font-serif text-[20px] font-semibold tracking-[2px] text-white">Tu Carrito</span>
                  <p className="text-[12px] text-white/40 mt-1">{cartCount} {cartCount === 1 ? "producto" : "productos"}</p>
                </div>
                <button onClick={() => setCartOpen(false)} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {cart.length === 0 ? (
                  <div className="text-center py-20">
                    <ShoppingBag size={48} className="mx-auto text-white/10 mb-4" />
                    <p className="text-[16px] text-white/40">Tu carrito está vacío</p>
                    <p className="text-[13px] text-white/20 mt-2">Agregá una VASTI para empezar</p>
                    <button onClick={() => setCartOpen(false)} className="mt-6 bg-gradient-to-r from-[#C9A96E] to-[#d4a5a5] text-[#0a0a0f] py-3 px-8 text-[12px] font-bold tracking-[2px] uppercase rounded-full hover:shadow-[0_0_30px_rgba(201,169,110,0.3)] transition-all">
                      Ver Catálogo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex gap-4 bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-2xl">
                        <div className="w-20 h-20 relative rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-white/10">
                          <Image src={item.product.imagen_url} alt={item.product.nombre} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-serif text-[14px] font-medium text-white truncate">{item.product.nombre}</h4>
                          <p className="text-[12px] text-white/40">{item.product.color}</p>
                          <p className="text-[14px] font-semibold mt-1 text-[#C9A96E]">{item.product.precio_str}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <button onClick={() => updateQuantity(item.product.id, -1)} className="w-7 h-7 border border-white/20 rounded-lg flex items-center justify-center hover:border-[#C9A96E] hover:bg-[#C9A96E]/10 transition-all text-white/60">
                              <Minus size={12} />
                            </button>
                            <span className="text-[13px] font-medium w-4 text-center text-white">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.product.id, 1)} className="w-7 h-7 border border-white/20 rounded-lg flex items-center justify-center hover:border-[#C9A96E] hover:bg-[#C9A96E]/10 transition-all text-white/60">
                              <Plus size={12} />
                            </button>
                            <button onClick={() => removeFromCart(item.product.id)} className="ml-auto text-white/20 hover:text-red-400 transition-colors">
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
                <div className="p-6 border-t border-white/10 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[14px] text-white/40">Subtotal</span>
                    <span className="font-serif text-[22px] font-semibold text-white">${cartTotal.toLocaleString("es-AR")}</span>
                  </div>
                  <a href={generateWhatsAppLink()} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white py-4 text-[13px] font-bold tracking-[1.5px] uppercase rounded-full hover:shadow-[0_0_30px_rgba(37,211,102,0.3)] transition-all">
                    <MessageCircle size={18} /> Consultar por WhatsApp
                  </a>
                  <button onClick={clearCart} className="w-full text-[12px] text-white/20 hover:text-white/60 transition-colors tracking-[1px] uppercase">
                    Vaciar carrito
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>


      {/* ===== HERO ===== */}
      <section className="relative pt-[140px] md:pt-[160px] pb-16 md:pb-20 px-6 text-center max-w-[900px] mx-auto z-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 px-5 py-2 rounded-full mb-8">
          <Zap size={14} className="text-[#C9A96E]" />
          <span className="text-[11px] tracking-[3px] uppercase text-[#C9A96E] font-medium">El Probador Virtual de VASTI</span>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="font-serif text-[clamp(36px,6vw,64px)] font-medium leading-[1.05] mb-6 bg-gradient-to-r from-white via-[#f0e6d8] to-[#C9A96E] bg-clip-text text-transparent"
        >
          Encontrá tu Peluca VASTI<br />ideal en 3 segundos
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="text-[16px] md:text-[18px] font-light text-white/40 leading-[1.7] mb-12 max-w-[560px] mx-auto"
        >
          Descubre cómo te queda cada estilo con nuestro probador virtual, sin salir de casa.
        </motion.p>

        <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          onClick={scrollToCatalog}
          className="group relative bg-gradient-to-r from-[#C9A96E] via-[#d4b896] to-[#d4a5a5] text-[#0a0a0f] px-12 py-5 text-[14px] font-bold tracking-[2px] uppercase rounded-full hover:shadow-[0_0_40px_rgba(201,169,110,0.4)] transition-all duration-500 overflow-hidden"
        >
          <span className="relative z-10 flex items-center gap-2">
            <Sparkles size={16} /> Empezar a probarme
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-[#d4a5a5] via-[#d4b896] to-[#C9A96E] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </motion.button>
      </section>

      {/* ===== FILTERS ===== */}
      <div ref={catalogRef} className="relative z-10 flex flex-wrap gap-2 md:gap-3 justify-center px-4 md:px-6 pb-10">
        {filters.map((f) => (
          <button key={f.key} onClick={() => setActiveFilter(f.key)}
            className={`px-5 md:px-7 py-2.5 md:py-3 text-[11px] md:text-[12px] font-medium tracking-[1.5px] uppercase rounded-full border transition-all duration-500 ${
              activeFilter === f.key
                ? "bg-gradient-to-r from-[#C9A96E] to-[#d4a5a5] text-[#0a0a0f] border-transparent shadow-[0_0_20px_rgba(201,169,110,0.3)]"
                : "bg-white/5 backdrop-blur-sm text-white/50 border-white/10 hover:border-[#C9A96E]/50 hover:text-[#C9A96E] hover:bg-white/10"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ===== GRID ===== */}
      <section className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 px-4 md:px-8 pb-24 max-w-[1200px] mx-auto">
        {filteredProducts.map((p, i) => (
          <motion.div key={p.id} layout initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }}
            className="group cursor-pointer relative"
            onClick={() => setSelectedProduct(p)}
          >
            <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:border-[#C9A96E]/30 transition-all duration-700 hover:shadow-[0_0_40px_rgba(201,169,110,0.15)]">
              <div className="overflow-hidden aspect-square relative">
                <Image src={p.imagen_url} alt={p.nombre} width={600} height={600}
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/80 via-transparent to-transparent opacity-60" />
                {p.bestseller && (
                  <span className="absolute top-3 left-3 bg-gradient-to-r from-[#C9A96E] to-[#d4a5a5] text-[#0a0a0f] text-[9px] md:text-[10px] font-bold tracking-[1px] uppercase px-3 py-1.5 rounded-full shadow-lg">
                    <Star size={10} className="inline mr-1" /> Bestseller
                  </span>
                )}
              </div>
              <div className="p-4 md:p-5">
                <h3 className="font-serif text-[15px] md:text-[17px] font-medium text-white mb-1">{p.nombre}</h3>
                <p className="text-[11px] md:text-[12px] text-white/30 tracking-[0.5px]">{p.color} · {p.largo}</p>
                <p className="text-[14px] md:text-[15px] font-semibold mt-2 bg-gradient-to-r from-[#C9A96E] to-[#d4a5a5] bg-clip-text text-transparent">{p.precio_str}</p>
              </div>
              {/* Hover glow border */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                style={{ boxShadow: 'inset 0 0 30px rgba(201,169,110,0.1)' }}
              />
            </div>
          </motion.div>
        ))}
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="relative z-10 text-center py-12 text-[12px] text-white/15 tracking-[2px] border-t border-white/5">
        <p className="font-serif text-[14px] tracking-[6px] text-white/20 mb-2">VASTI</p>
        © 2026 — Todos los derechos reservados
      </footer>

      {/* ===== PRODUCT MODAL ===== */}
      <AnimatePresence>
        {selectedProduct && !tryOnStep && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-xl flex items-end md:items-center justify-center p-0 md:p-5"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#12121a]/95 backdrop-blur-2xl border border-white/10 w-full max-w-[1000px] max-h-[90vh] overflow-y-auto relative grid md:grid-cols-2 rounded-t-3xl md:rounded-3xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 z-10 bg-white/10 backdrop-blur-sm w-10 h-10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all border border-white/10">
                <X size={18} />
              </button>

              <div className="aspect-square md:aspect-[3/4] relative">
                <Image src={selectedProduct.imagen_url} alt={selectedProduct.nombre} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#12121a] via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#12121a]/50" />
              </div>

              <div className="p-6 md:p-10 flex flex-col justify-center">
                <h2 className="font-serif text-[28px] md:text-[34px] font-medium mb-3 bg-gradient-to-r from-white to-[#C9A96E] bg-clip-text text-transparent">{selectedProduct.nombre}</h2>
                <p className="text-[14px] md:text-[15px] text-white/40 leading-[1.7] mb-6">{selectedProduct.desc}</p>

                <div className="flex gap-4 md:gap-6 mb-6 md:mb-8">
                  {[{ label: "Color", val: selectedProduct.color }, { label: "Largo", val: selectedProduct.largo }, { label: "Textura", val: selectedProduct.textura }].map((d) => (
                    <div key={d.label} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                      <div className="text-[11px] text-white/30 uppercase tracking-wider mb-1">{d.label}</div>
                      <div className="text-[13px] text-white font-medium">{d.val}</div>
                    </div>
                  ))}
                </div>

                <p className="font-serif text-[26px] md:text-[30px] font-semibold mb-8 bg-gradient-to-r from-[#C9A96E] to-[#d4a5a5] bg-clip-text text-transparent">{selectedProduct.precio_str}</p>

                <button onClick={() => { resetTryOn(); setTryOnStep("upload"); }}
                  className="group relative bg-gradient-to-r from-[#C9A96E] via-[#d4b896] to-[#d4a5a5] text-[#0a0a0f] py-4 md:py-5 px-8 text-[13px] font-bold tracking-[1.5px] uppercase rounded-full hover:shadow-[0_0_40px_rgba(201,169,110,0.4)] transition-all duration-500 w-full mb-3 flex items-center justify-center gap-2 overflow-hidden"
                >
                  <Sparkles size={16} /> Probarme esta VASTI
                </button>

                <button onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}
                  className="border border-white/20 text-white py-4 md:py-5 px-8 text-[13px] font-medium tracking-[1.5px] uppercase rounded-full hover:border-[#C9A96E]/50 hover:bg-[#C9A96E]/5 transition-all w-full mb-4 flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={16} /> Agregar al Carrito
                </button>

                <p className="text-[11px] text-white/20 text-center tracking-[0.5px]">Probador con IA de VASTI — 100% privado</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* ===== TRY-ON OVERLAY ===== */}
      <AnimatePresence>
        {tryOnStep && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-[#0a0a0f] flex flex-col">
            <div className="flex justify-between items-center px-6 md:px-8 py-5 border-b border-white/5">
              <span className="font-serif text-[20px] md:text-[24px] font-semibold tracking-[5px] bg-gradient-to-r from-white to-[#C9A96E] bg-clip-text text-transparent">VASTI</span>
              <button onClick={closeAll} className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all">
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center px-4 md:px-6 overflow-y-auto">
              <AnimatePresence mode="wait">
                {/* UPLOAD */}
                {tryOnStep === "upload" && (
                  <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="text-center max-w-[500px] w-full pb-8"
                  >
                    <div className="inline-flex items-center gap-2 bg-[#C9A96E]/10 border border-[#C9A96E]/20 px-4 py-2 rounded-full mb-6">
                      <Sparkles size={14} className="text-[#C9A96E]" />
                      <span className="text-[11px] tracking-[2px] uppercase text-[#C9A96E] font-medium">Probador Virtual VASTI</span>
                    </div>
                    <h2 className="font-serif text-[24px] md:text-[30px] font-medium mb-3 text-white">
                      Subí tu foto para<br />probarte la <span className="bg-gradient-to-r from-[#C9A96E] to-[#d4a5a5] bg-clip-text text-transparent">{selectedProduct?.nombre}</span>
                    </h2>
                    <p className="text-[13px] md:text-[14px] text-white/30 mb-8">Tu foto no se guarda. Es 100% privada.</p>

                    <div onClick={() => fileInputRef.current?.click()} onDrop={onDrop}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      className={`border-2 border-dashed rounded-2xl transition-all duration-500 p-10 md:p-14 cursor-pointer bg-white/5 backdrop-blur-sm ${
                        dragOver ? "border-[#C9A96E] bg-[#C9A96E]/5 shadow-[0_0_40px_rgba(201,169,110,0.1)]" : "border-white/10"
                      }`}
                    >
                      <Upload className="w-12 h-12 mx-auto mb-5 text-[#C9A96E]" strokeWidth={1} />
                      <h3 className="font-serif text-[20px] md:text-[24px] text-white mb-2">Arrastrá tu foto aquí</h3>
                      <p className="text-[14px] text-white/30 mb-5">o tocá para seleccionar</p>
                      <p className="text-[12px] text-white/15">De frente, con buena luz, pelo recogido si podés.<br />JPG, PNG · Máx. 10MB</p>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    />

                    {userPhoto && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="mt-6 rounded-2xl overflow-hidden shadow-2xl max-w-[280px] md:max-w-[320px] mx-auto ring-1 ring-white/10"
                      >
                        <Image src={userPhoto} alt="Tu foto" width={320} height={320} className="w-full aspect-square object-cover" />
                      </motion.div>
                    )}

                    <div className="flex items-start gap-3 mt-6 text-left max-w-[500px] mx-auto">
                      <input type="checkbox" id="consent" checked={consent} onChange={(e) => setConsent(e.target.checked)}
                        className="w-[18px] h-[18px] mt-0.5 accent-[#C9A96E] flex-shrink-0 rounded"
                      />
                      <label htmlFor="consent" className="text-[12px] md:text-[13px] text-white/40 leading-[1.5]">
                        Acepto el uso temporal de mi imagen para la prueba virtual de VASTI. Mi foto será procesada por IA y no será almacenada.
                      </label>
                    </div>

                    <button onClick={startTryOn} disabled={!userPhoto || !consent}
                      className="bg-gradient-to-r from-[#C9A96E] to-[#d4a5a5] text-[#0a0a0f] py-4 px-10 text-[13px] font-bold tracking-[2px] uppercase rounded-full hover:shadow-[0_0_40px_rgba(201,169,110,0.4)] transition-all mt-6 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Probar esta VASTI
                    </button>
                  </motion.div>
                )}

                {/* LOADING */}
                {tryOnStep === "loading" && (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center px-4">
                    <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
                      className="font-serif text-[40px] md:text-[48px] font-semibold tracking-[8px] mb-8 bg-gradient-to-r from-white via-[#C9A96E] to-[#d4a5a5] bg-clip-text text-transparent"
                    >
                      VASTI
                    </motion.div>
                    <div className="inline-flex items-center gap-2 bg-[#25D366]/10 border border-[#25D366]/20 px-4 py-2 rounded-full mb-6">
                      <span className="w-2 h-2 bg-[#25D366] rounded-full animate-pulse" />
                      <span className="text-[11px] font-medium tracking-[1px] uppercase text-[#25D366]">IA de Google Gemini activa</span>
                    </div>
                    <p className="text-[15px] md:text-[16px] text-white/40 mb-8 max-w-[400px] leading-[1.6] mx-auto">
                      Colocándote tu <span className="text-[#C9A96E]">{selectedProduct?.nombre}</span> con IA...<br />
                      Esto puede tardar entre 5 y 15 segundos
                    </p>
                    <div className="w-[260px] md:w-[300px] h-[3px] bg-white/10 rounded-full overflow-hidden mx-auto">
                      <motion.div className="h-full bg-gradient-to-r from-[#C9A96E] to-[#d4a5a5] rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-[11px] md:text-[12px] text-white/20 mt-5">
                      {progress < 25 && "Analizando tu rostro con IA..."}
                      {progress >= 25 && progress < 50 && "Detectando línea del cabello..."}
                      {progress >= 50 && progress < 75 && "Fusionando la peluca con tu foto..."}
                      {progress >= 75 && progress < 90 && "Ajustando luces y sombras..."}
                      {progress >= 90 && "Generando imagen final..."}
                    </p>
                  </motion.div>
                )}

                {/* RESULT */}
                {tryOnStep === "result" && userPhoto && resultImage && (
                  <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center w-full max-w-[900px] px-4 pb-8">
                    {tryOnError && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl mb-4 text-[13px]">
                        <strong>⚠️ La IA no pudo procesar tu foto:</strong> {tryOnError}<br />
                        <span className="text-[12px] text-red-300/60">Se muestra la imagen de referencia. Probá con otra foto.</span>
                      </div>
                    )}
                    {!tryOnError && (
                      <div className="inline-flex items-center gap-2 bg-[#25D366]/10 border border-[#25D366]/20 px-4 py-2 rounded-full mb-3">
                        <Check size={14} className="text-[#25D366]" />
                        <span className="text-[11px] font-medium tracking-[1px] uppercase text-[#25D366]">Generado con IA de Google Gemini</span>
                      </div>
                    )}
                    <p className="text-[11px] tracking-[3px] uppercase text-[#C9A96E] mb-2 md:mb-3">Resultado VASTI</p>
                    <h2 className="font-serif text-[26px] md:text-[32px] font-medium mb-6 md:mb-8 text-white">
                      Así te queda <span className="bg-gradient-to-r from-[#C9A96E] to-[#d4a5a5] bg-clip-text text-transparent">{selectedProduct?.nombre}</span>
                    </h2>

                    <CompareSlider beforeImage={userPhoto} afterImage={resultImage} />

                    <div className="flex flex-wrap gap-3 justify-center mt-8 mb-10">
                      <button className="bg-gradient-to-r from-[#C9A96E] to-[#d4a5a5] text-[#0a0a0f] py-3.5 px-7 text-[12px] font-bold tracking-[1.5px] uppercase rounded-full hover:shadow-[0_0_30px_rgba(201,169,110,0.4)] transition-all flex items-center gap-2">
                        <Download size={15} /> Descargar
                      </button>
                      <button onClick={() => { if (selectedProduct) addToCart(selectedProduct); }}
                        className="border border-white/20 text-white py-3.5 px-7 text-[12px] font-medium tracking-[1.5px] uppercase rounded-full hover:border-[#C9A96E]/50 hover:bg-[#C9A96E]/5 transition-all flex items-center gap-2"
                      >
                        <ShoppingCart size={15} /> Al Carrito
                      </button>
                      <button onClick={() => { resetTryOn(); setTryOnStep("upload"); }}
                        className="border border-white/20 text-white py-3.5 px-7 text-[12px] font-medium tracking-[1.5px] uppercase rounded-full hover:border-[#C9A96E]/50 hover:bg-[#C9A96E]/5 transition-all flex items-center gap-2"
                      >
                        <RotateCcw size={15} /> Otra VASTI
                      </button>
                      <button onClick={() => { resetTryOn(); setTryOnStep("upload"); }}
                        className="border border-white/20 text-white py-3.5 px-7 text-[12px] font-medium tracking-[1.5px] uppercase rounded-full hover:border-[#C9A96E]/50 hover:bg-[#C9A96E]/5 transition-all flex items-center gap-2"
                      >
                        <Camera size={15} /> Otra foto
                      </button>
                    </div>

                    <div className="border-t border-white/10 pt-8 max-w-[500px] mx-auto">
                      <p className="text-[13px] md:text-[14px] text-white/30 mb-4">¿Te gustó? Comprá esta VASTI ahora</p>
                      <p className="font-serif text-[24px] md:text-[28px] font-semibold mb-4 bg-gradient-to-r from-[#C9A96E] to-[#d4a5a5] bg-clip-text text-transparent">{selectedProduct?.precio_str}</p>
                      <button onClick={() => { if (selectedProduct) addToCart(selectedProduct); }}
                        className="bg-gradient-to-r from-[#C9A96E] to-[#d4a5a5] text-[#0a0a0f] py-4 px-10 text-[13px] font-bold tracking-[2px] uppercase rounded-full hover:shadow-[0_0_40px_rgba(201,169,110,0.4)] transition-all"
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
        className="relative rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(201,169,110,0.15)] aspect-square cursor-ew-resize select-none ring-1 ring-white/10"
        onClick={(e) => handleMove(e.clientX)}
      >
        {/* AFTER IMAGE (con la peluca - resultado de la IA) */}
        <div className="absolute inset-0">
          <Image src={afterImage} alt="Con VASTI" fill className="object-cover" />
        </div>
        
        {/* BEFORE IMAGE (foto original del usuario) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <Image src={beforeImage} alt="Tu foto" fill className="object-cover" />
        </div>

        {/* Slider handle */}
        <div
          className="absolute top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#C9A96E] to-[#d4a5a5] cursor-ew-resize z-10 shadow-[0_0_20px_rgba(201,169,110,0.5)]"
          style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-br from-[#C9A96E] to-[#d4a5a5] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(201,169,110,0.5)]">
            <span className="text-[10px] font-bold tracking-[2px] text-[#0a0a0f]">◀ ▶</span>
          </div>
        </div>
      </div>
      <div className="flex justify-between mt-3 px-2">
        <span className="text-[10px] md:text-[11px] font-medium tracking-[2px] uppercase text-white/30">Tu foto</span>
        <span className="text-[10px] md:text-[11px] font-medium tracking-[2px] uppercase text-[#C9A96E]">Con VASTI</span>
      </div>
    </div>
  );
}
