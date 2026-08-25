"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Upload, Check, Download, ShoppingCart, RotateCcw, Camera } from "lucide-react";

// ============================================================
// VASTI - VIRTUAL WIG TRY-ON APP
// Next.js 14 + Tailwind CSS + Framer Motion
// Catálogo real: Lla, Sofia, Elizabeth, Romi
// ============================================================

// ---------- PALETA VASTI ----------
// Negro:        #0A0A0A
// Off-white:    #F9F5F1
// Beige VASTI:  #E8DDD0
// Dorado suave: #C9A96E

// ---------- CATÁLOGO REAL VASTI ----------
// Productos extraídos del catálogo oficial

interface Product {
  id: number;
  nombre: string;
  color: string;
  largo: string;
  estilo: string;
  textura: string;
  imagen_url: string;
  categoria: string[];
  precio: string;
  bestseller: boolean;
  desc: string;
}

const products: Product[] = [
  {
    id: 1,
    nombre: "VASTI - LLA",
    color: "Rubia",
    largo: "Largo",
    estilo: "Ondas de Sirena",
    textura: "Lace Front",
    imagen_url: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=600&h=800&fit=crop",
    categoria: ["rubias", "largas", "premium"],
    precio: "$320.000",
    bestseller: true,
    desc: "Lla es la estrella de VASTI. Peluca rubia con lace front invisible y ondas de sirena que caen con elegancia natural. Perfecta para quienes buscan volumen, brillo y un look de alfombra roja. La base de encaje se funde con tu piel para un acabado impecable."
  },
  {
    id: 2,
    nombre: "VASTI - SOFIA",
    color: "Rubia con Mechas",
    largo: "Corto",
    estilo: "Bob con Mechas",
    textura: "Fibra Premium",
    imagen_url: "https://images.unsplash.com/photo-1503236823255-94609f598e71?w=600&h=800&fit=crop",
    categoria: ["rubias", "cortas"],
    precio: "$245.000",
    bestseller: false,
    desc: "Sofia reinventa el corte bob con mechas rubias que aportan dimensión y movimiento. Moderna, fresca y versátil. Ideal para quienes buscan un cambio impactante sin perder la feminidad. El corte preciso enmarca el rostro con estilo parisino."
  },
  {
    id: 3,
    nombre: "VASTI - ELIZABETH",
    color: "Rubio Oscuro con Mechas",
    largo: "Medio-Largo",
    estilo: "Ondulado",
    textura: "Seda Natural",
    imagen_url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop",
    categoria: ["rubias", "largas", "premium"],
    precio: "$290.000",
    bestseller: true,
    desc: "Elizabeth combina la sofisticación del rubio oscuro con mechas sutiles que captan la luz. Ondas suaves de seda natural que caen con gracia sobre los hombros. Una elección atemporal para la mujer que valora la elegancia discreta pero memorable."
  },
  {
    id: 4,
    nombre: "VASTI - ROMI",
    color: "Negro",
    largo: "Largo",
    estilo: "Liso",
    textura: "Seda Natural",
    imagen_url: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&h=800&fit=crop",
    categoria: ["morenas", "largas", "premium"],
    precio: "$275.000",
    bestseller: false,
    desc: "Romi es pureza y misterio en su máxima expresión. Cabello negro intenso de seda natural con brillo espejo y caída impecable. El largo extra le otorga un movimiento cinematográfico. Para quienes saben que el negro nunca pasa de moda."
  }
];

const filters = [
  { key: "todas", label: "Todas" },
  { key: "rubias", label: "Rubias" },
  { key: "morenas", label: "Morenas" },
  { key: "largas", label: "Largas" },
  { key: "cortas", label: "Cortas" },
  { key: "premium", label: "Premium Collection" },
];

// ---------- IA MOCK FUNCTION ----------
// TODO: Reemplazar por integración real con Google Gemini 2.5 Flash Image
// async function generateVastiTryOn(userPhotoFile: File, wigImageUrl: string, wigName: string): Promise<string> {
//   const formData = new FormData();
//   formData.append("image", userPhotoFile);
//   formData.append("wig_url", wigImageUrl);
//   formData.append("wig_name", wigName);
//   
//   const res = await fetch("https://api.nano-banana.com/v1/try-on", {
//     method: "POST",
//     headers: { "Authorization": `Bearer ${process.env.NEXT_PUBLIC_NANO_BANANA_API_KEY}` },
//     body: formData,
//   });
//   const data = await res.json();
//   return data.result_url;
// }

async function generateVastiTryOn(
  _userPhotoFile: File,
  _wigImageUrl: string,
  _wigName: string
): Promise<string> {
  // MOCK: Simula 3 segundos de procesamiento y devuelve placeholder
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=600&h=800&fit=crop");
    }, 3000);
  });
}

// ============================================================
// COMPONENTES
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const catalogRef = useRef<HTMLDivElement>(null);

  const filteredProducts = activeFilter === "todas"
    ? products
    : products.filter((p) => p.categoria.includes(activeFilter));

  const scrollToCatalog = () => {
    catalogRef.current?.scrollIntoView({ behavior: "smooth" });
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

    // Simular progreso
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
  };

  return (
    <div className="min-h-screen bg-[#F9F5F1] text-[#0A0A0A] font-sans selection:bg-[#C9A96E] selection:text-white">
      {/* ===== HEADER ===== */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#F9F5F1]/90 backdrop-blur-xl border-b border-[#E8DDD0]/50 h-[72px] flex items-center justify-between px-6 md:px-8">
        <button onClick={closeAll} className="font-serif text-[28px] font-semibold tracking-[6px] text-[#0A0A0A] hover:text-[#C9A96E] transition-colors">
          VASTI
        </button>
        <nav className="hidden md:flex items-center gap-10">
          <button onClick={scrollToCatalog} className="text-[13px] font-medium tracking-[1.5px] uppercase hover:text-[#C9A96E] transition-colors">Catálogo</button>
          <button onClick={scrollToCatalog} className="text-[13px] font-medium tracking-[1.5px] uppercase hover:text-[#C9A96E] transition-colors">Colecciones</button>
          <button onClick={scrollToCatalog} className="text-[13px] font-medium tracking-[1.5px] uppercase hover:text-[#C9A96E] transition-colors">Probador IA</button>
          <button className="bg-[#0A0A0A] text-[#F9F5F1] px-6 py-2.5 text-[12px] font-medium tracking-[1.5px] uppercase hover:bg-[#1C1C1C] transition-colors">
            Carrito (0)
          </button>
        </nav>
        <button className="md:hidden text-2xl">☰</button>
      </header>

      {/* ===== HERO ===== */}
      <section className="pt-[160px] pb-20 px-6 text-center max-w-[900px] mx-auto">
        <p className="text-[12px] tracking-[4px] uppercase text-[#C9A96E] mb-4">El Probador Virtual de VASTI</p>
        <h1 className="font-serif text-[clamp(36px,5vw,56px)] font-medium leading-[1.1] mb-5">
          Encontrá tu VASTI ideal en 3 segundos
        </h1>
        <p className="text-[17px] font-light text-[#666] leading-[1.7] mb-10 max-w-[600px] mx-auto">
          Probate toda nuestra colección con Inteligencia Artificial sin moverte de tu casa
        </p>
        <button
          onClick={scrollToCatalog}
          className="bg-[#0A0A0A] text-[#F9F5F1] px-12 py-[18px] text-[14px] font-medium tracking-[2px] uppercase hover:bg-[#C9A96E] hover:text-[#0A0A0A] transition-all duration-400 hover:-translate-y-0.5"
        >
          Empezar a probarme
        </button>
      </section>

      {/* ===== FILTERS ===== */}
      <div ref={catalogRef} className="flex flex-wrap gap-3 justify-center px-6 pb-10">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`px-6 py-2.5 text-[12px] font-medium tracking-[1px] uppercase border transition-all duration-300 ${
              activeFilter === f.key
                ? "bg-[#0A0A0A] text-[#F9F5F1] border-[#0A0A0A]"
                : "bg-transparent text-[#0A0A0A] border-[#E8DDD0] hover:border-[#C9A96E]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ===== GRID ===== */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 px-4 md:px-8 pb-20 max-w-[1200px] mx-auto">
        {filteredProducts.map((p) => (
          <motion.div
            key={p.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white cursor-pointer group overflow-hidden relative"
            onClick={() => setSelectedProduct(p)}
          >
            <div className="overflow-hidden aspect-[3/4] relative">
              <Image
                src={p.imagen_url}
                alt={p.nombre}
                width={600}
                height={800}
                className="w-full h-full object-cover transition-transform duration-600 group-hover:scale-105"
              />
              {p.bestseller && (
                <span className="absolute top-3 left-3 bg-[#C9A96E] text-white text-[10px] font-semibold tracking-[1px] uppercase px-3 py-1.5">
                  Bestseller
                </span>
              )}
            </div>
            <div className="p-5">
              <h3 className="font-serif text-[16px] font-medium mb-1.5">{p.nombre}</h3>
              <p className="text-[12px] text-[#888] tracking-[0.5px]">{p.color} · {p.largo} · {p.estilo}</p>
              <p className="text-[14px] font-semibold mt-2 text-[#0A0A0A]">{p.precio}</p>
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
            className="fixed inset-0 z-[200] bg-[#0A0A0A]/60 backdrop-blur-lg flex items-center justify-center p-5"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-[#F9F5F1] max-w-[1000px] w-full max-h-[90vh] overflow-y-auto relative grid md:grid-cols-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-5 right-5 z-10 bg-white w-11 h-11 rounded-full flex items-center justify-center text-[20px] hover:bg-[#E8DDD0] transition-colors shadow-sm"
              >
                <X size={18} />
              </button>
              <div className="aspect-[3/4] relative">
                <Image
                  src={selectedProduct.imagen_url}
                  alt={selectedProduct.nombre}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <h2 className="font-serif text-[32px] font-medium mb-3">{selectedProduct.nombre}</h2>
                <p className="text-[15px] text-[#666] leading-[1.7] mb-6">{selectedProduct.desc}</p>
                <div className="flex gap-6 mb-8 text-[13px] text-[#888]">
                  <div><strong className="block text-[14px] text-[#0A0A0A] mb-1">Color</strong>{selectedProduct.color}</div>
                  <div><strong className="block text-[14px] text-[#0A0A0A] mb-1">Largo</strong>{selectedProduct.largo}</div>
                  <div><strong className="block text-[14px] text-[#0A0A0A] mb-1">Textura</strong>{selectedProduct.textura}</div>
                </div>
                <p className="font-serif text-[28px] font-semibold mb-8">{selectedProduct.precio}</p>
                <button
                  onClick={() => { resetTryOn(); setTryOnStep("upload"); }}
                  className="bg-[#0A0A0A] text-[#F9F5F1] py-[18px] px-10 text-[14px] font-medium tracking-[1.5px] uppercase hover:bg-[#1C1C1C] transition-colors w-full mb-4"
                >
                  Probarme esta VASTI ✨
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
            {/* Header del probador */}
            <div className="flex justify-between items-center px-6 md:px-8 py-6">
              <span className="font-serif text-[22px] font-semibold tracking-[5px]">VASTI</span>
              <button onClick={closeAll} className="text-[28px] w-11 h-11 flex items-center justify-center hover:bg-[#E8DDD0] rounded-full transition-colors">
                <X size={22} />
              </button>
            </div>

            {/* Contenido del paso actual */}
            <div className="flex-1 flex items-center justify-center px-6 overflow-y-auto">
              <AnimatePresence mode="wait">
                {/* ---------- PASO A: UPLOAD ---------- */}
                {tryOnStep === "upload" && (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center max-w-[500px] w-full"
                  >
                    <p className="text-[11px] tracking-[3px] uppercase text-[#C9A96E] mb-3">Probador Virtual VASTI</p>
                    <h2 className="font-serif text-[26px] font-medium mb-2">
                      Subí tu foto para probarte la<br />{selectedProduct?.nombre}
                    </h2>
                    <p className="text-[14px] text-[#888] mb-8">Tu foto no se guarda. Es 100% privada.</p>

                    {/* Drop Zone */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={onDrop}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      className={`border-2 border-dashed rounded transition-all duration-300 p-12 cursor-pointer bg-white ${
                        dragOver ? "border-[#C9A96E] bg-[#C9A96E]/[0.03]" : "border-[#E8DDD0]"
                      }`}
                    >
                      <Upload className="w-12 h-12 mx-auto mb-5 text-[#C9A96E]" strokeWidth={1.5} />
                      <h3 className="font-serif text-[22px] mb-2">Arrastrá tu foto aquí</h3>
                      <p className="text-[14px] text-[#888] mb-5">o hacé clic para seleccionar</p>
                      <p className="text-[12px] text-[#aaa]">
                        De frente, con buena luz, pelo recogido si podés.<br />
                        Formatos: JPG, PNG · Máx. 10MB
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    />

                    {/* Preview */}
                    {userPhoto && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-6 rounded overflow-hidden shadow-xl max-w-[320px] mx-auto"
                      >
                        <Image src={userPhoto} alt="Tu foto" width={320} height={400} className="w-full" />
                      </motion.div>
                    )}

                    {/* Consent */}
                    <div className="flex items-start gap-3 mt-6 text-left">
                      <input
                        type="checkbox"
                        id="consent"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="w-[18px] h-[18px] mt-0.5 accent-[#0A0A0A]"
                      />
                      <label htmlFor="consent" className="text-[13px] text-[#666] leading-[1.5]">
                        Acepto el uso temporal de mi imagen para la prueba virtual de VASTI. Mi foto será procesada por IA y no será almacenada en nuestros servidores.
                      </label>
                    </div>

                    <button
                      onClick={startTryOn}
                      disabled={!userPhoto || !consent}
                      className="bg-[#0A0A0A] text-[#F9F5F1] py-4 px-10 text-[13px] font-medium tracking-[2px] uppercase hover:bg-[#1C1C1C] transition-colors mt-6 disabled:opacity-40 disabled:cursor-not-allowed"
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
                    className="text-center"
                  >
                    <motion.div
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="font-serif text-[42px] font-semibold tracking-[8px] mb-10"
                    >
                      VASTI
                    </motion.div>
                    <p className="text-[16px] text-[#666] mb-8 max-w-[400px] leading-[1.6]">
                      Colocándote tu {selectedProduct?.nombre}...<br />
                      La magia de VASTI está trabajando
                    </p>
                    <div className="w-[280px] h-[2px] bg-[#E8DDD0] rounded overflow-hidden mx-auto">
                      <motion.div
                        className="h-full bg-[#0A0A0A]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-[12px] text-[#aaa] mt-4">
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
                    className="text-center w-full max-w-[900px] px-4 pb-10"
                  >
                    <p className="text-[11px] tracking-[3px] uppercase text-[#C9A96E] mb-3">Resultado VASTI</p>
                    <h2 className="font-serif text-[28px] font-medium mb-8">
                      Así te queda {selectedProduct?.nombre}
                    </h2>

                    {/* Comparativa Antes/Después con Slider */}
                    <CompareSlider beforeImage={userPhoto} afterImage={resultImage} />

                    {/* Acciones */}
                    <div className="flex flex-wrap gap-3 justify-center mt-8 mb-10">
                      <button className="bg-[#0A0A0A] text-[#F9F5F1] py-4 px-8 text-[13px] font-medium tracking-[1.5px] uppercase hover:bg-[#1C1C1C] transition-colors flex items-center gap-2">
                        <Download size={16} /> Descargar Look
                      </button>
                      <button className="border border-[#E8DDD0] text-[#0A0A0A] py-4 px-8 text-[13px] font-medium tracking-[1.5px] uppercase hover:border-[#C9A96E] hover:bg-[#C9A96E]/[0.05] transition-colors flex items-center gap-2">
                        <ShoppingCart size={16} /> Agregar al Carrito
                      </button>
                      <button
                        onClick={() => { resetTryOn(); setTryOnStep("upload"); }}
                        className="border border-[#E8DDD0] text-[#0A0A0A] py-4 px-8 text-[13px] font-medium tracking-[1.5px] uppercase hover:border-[#C9A96E] hover:bg-[#C9A96E]/[0.05] transition-colors flex items-center gap-2"
                      >
                        <RotateCcw size={16} /> Probar otra VASTI
                      </button>
                      <button
                        onClick={() => { resetTryOn(); setTryOnStep("upload"); }}
                        className="border border-[#E8DDD0] text-[#0A0A0A] py-4 px-8 text-[13px] font-medium tracking-[1.5px] uppercase hover:border-[#C9A96E] hover:bg-[#C9A96E]/[0.05] transition-colors flex items-center gap-2"
                      >
                        <Camera size={16} /> Probar con otra foto
                      </button>
                    </div>

                    {/* CTA Compra */}
                    <div className="border-t border-[#E8DDD0] pt-8 max-w-[500px] mx-auto">
                      <p className="text-[14px] text-[#666] mb-4">¿Te gustó? Comprá esta VASTI ahora</p>
                      <p className="font-serif text-[24px] font-semibold mb-4">{selectedProduct?.precio}</p>
                      <button className="bg-[#0A0A0A] text-[#F9F5F1] py-4 px-10 text-[13px] font-medium tracking-[2px] uppercase hover:bg-[#1C1C1C] transition-colors">
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
// COMPONENTE: COMPARE SLIDER (Antes/Después)
// ============================================================
function CompareSlider({ beforeImage, afterImage }: { beforeImage: string; afterImage: string }) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      setSliderPosition((x / rect.width) * 100);
    },
    []
  );

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
    <div className="max-w-[500px] mx-auto">
      <div
        ref={containerRef}
        className="relative rounded overflow-hidden shadow-2xl aspect-[3/4] cursor-ew-resize select-none"
        onClick={(e) => handleMove(e.clientX)}
      >
        {/* After (VASTI) */}
        <div className="absolute inset-0">
          <Image src={afterImage} alt="Con VASTI" fill className="object-cover" />
        </div>
        {/* Before (Usuario) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <Image src={beforeImage} alt="Tu foto" fill className="object-cover" />
        </div>
        {/* Slider Handle */}
        <div
          className="absolute top-0 bottom-0 w-[3px] bg-white cursor-ew-resize z-10"
          style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-lg">
            <span className="text-[10px] font-bold tracking-[2px] text-[#0A0A0A]">◀ ▶</span>
          </div>
        </div>
      </div>
      <div className="flex justify-between mt-2 px-2">
        <span className="text-[11px] font-medium tracking-[2px] uppercase text-[#888]">Tu foto</span>
        <span className="text-[11px] font-medium tracking-[2px] uppercase text-[#888]">Con VASTI</span>
      </div>
    </div>
  );
}
