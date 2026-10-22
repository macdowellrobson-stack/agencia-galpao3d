import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { 
  Building2, Sparkles, Image as ImageIcon, DollarSign, 
  Download, ArrowRight, Bot, ShieldCheck, ChevronRight,
  Maximize2, Play, Pause, AlertTriangle, MessageSquare,
  Package, Upload, RefreshCw, Layers, Key, CheckCircle, Copy,
  Eye, Check, Info, ZoomIn, X
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("marina");
  
  const [replicateToken, setReplicateToken] = useState(() => localStorage.getItem("replicate_api_token") || "");
  const [isTokenSaved, setIsTokenSaved] = useState(false);

  const [productName, setProductName] = useState("Quadro Maternidade porta-retrato com Pezinho");
  const [mandatoryFeatures, setMandatoryFeatures] = useState(
    "Dimensões totais: 17,0 cm de largura x 11,5 cm de altura. Nicho para foto revelada: 7,5 x 10,0 cm. Relevo 3D do pezinho de bebê em material fosco acetinado branco. Moldura monobloco elegante com nicho fotográfico ao lado."
  );
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imageBase64, setImageBase64] = useState("");
  const fileInputRef = useRef(null);

  const [custoProduto, setCustoProduto] = useState(9.50);
  const [insumosEmbalagem, setInsumosEmbalagem] = useState(1.50);
  const [freteEntrega, setFreteEntrega] = useState(8.45);
  const [impostosPct, setImpostosPct] = useState(4.0);
  const [comissaoMLPct, setComissaoMLPct] = useState(11.5);
  const [comissaoAfiliadosPct, setComissaoAfiliadosPct] = useState(0.0);
  const [margemDesejadaPct, setMargemDesejadaPct] = useState(36.0);
  const [qtdUnidades, setQtdUnidades] = useState(21);

  const [loadingMap, setLoadingMap] = useState({});
  const [generatedImages, setGeneratedImages] = useState({
    p1: null, p2: null, p3: null, p4: null, p5: null, p6: null
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [previewModalImg, setPreviewModalImg] = useState(null);

  const mountRef = useRef(null);

  const handleSaveToken = () => {
    localStorage.setItem("replicate_api_token", replicateToken.trim());
    setIsTokenSaved(true);
    setStatusMessage("Token da Replicate salvo com sucesso!");
    setTimeout(() => {
      setIsTokenSaved(false);
      setStatusMessage("");
    }, 3000);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        setUploadedImage(result);
        setImageBase64(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const rawPrompts = [
    {
      id: "p1",
      number: "Foto 1",
      title: "Fundo Ambiente (Catálogo ML)",
      badge: "Capa / Catálogo",
      aspect: "1:1 • 1200x1200px",
      description: "Foto profissional com fundo ambientado e iluminação de estúdio perfeita para destaque no catálogo.",
      promptTemplate: (name, desc) => 
        `Crie uma foto de anúncio de e-commerce profissional, proporção 1:1, de alta resolução, mostrando o produto ${name}. Descrição e características: ${desc}. O fundo deve ser ambientado em um quarto de bebê acolhedor sobre prateleira de madeira clara, com iluminação de estúdio suave e foco nítido no produto, ideal para o fundo de catálogo do Mercado Livre. Sem textos ou marcas d'água, ultra fotorrealista.`
    },
    {
      id: "p2",
      number: "Foto 2",
      title: "Produto em Uso (Lifestyle)",
      badge: "Lifestyle",
      aspect: "1:1 • 1200x1200px",
      description: "Pessoa real manuseando ou interagindo com o item em ambiente acolhedor e natural.",
      promptTemplate: (name, desc) => 
        `Crie uma foto estilo estilo de vida (lifestyle), proporção 1:1, mostrando mãos delicadas segurando com carinho o produto ${name}. Detalhes: ${desc}. Em um quarto de bebê com iluminação natural suave vinda de uma janela lateral, transmitindo afeto, aconchego e acabamento impecável do produto.`
    },
    {
      id: "p3",
      number: "Foto 3",
      title: "Antes e Depois / Certo e Errado",
      badge: "Split-Screen",
      aspect: "1:1 • 1200x1200px",
      description: "Comparação dividida ao meio destacando a facilidade e a solução definitiva do produto.",
      promptTemplate: (name, desc) => 
        `Crie uma imagem de anúncio em formato de comparação dividida ao meio (split-screen), proporção 1:1. O lado esquerdo mostra a bagunça frustrante de pó de gesso, água e molde tradicional quebrado. O lado direito com iluminação clara exibe o produto pronto e limpo: ${name} (${desc}), comprovando praticidade absoluta e zero sujeira.`
    },
    {
      id: "p4",
      number: "Foto 4",
      title: "Destaque de Benefícios",
      badge: "Vantagens",
      aspect: "1:1 • 1200x1200px",
      description: "Visual clean e moderno com o produto centralizado e callouts elegantes dos diferenciais.",
      promptTemplate: (name, desc) => 
        `Crie uma imagem de marketing limpa e moderna, proporção 1:1, focada em destacar os principais benefícios do produto ${name} (${desc}). O produto deve aparecer em destaque no centro com fundo neutro sofisticado e elementos visuais sutis destacando: 'Sem sujeira', 'Pronto para expor' e 'Material durável e lavável'.`
    },
    {
      id: "p5",
      number: "Foto 5",
      title: "Medidas e Dimensões",
      badge: "Infográfico Técnico",
      aspect: "1:1 • 1200x1200px",
      description: "Perspectiva nítida com linhas de cota discretas indicando 17x11,5 cm e nicho fotográfico.",
      promptTemplate: (name, desc) => 
        `Crie uma imagem explicativa de dimensões, proporção 1:1, para o produto ${name}. Detalhes: ${desc}. O produto deve ser exibido em perspectiva angular clara sobre um fundo neutro e sofisticado, acompanhado por linhas de cota elegantes e cotas legíveis: 17,0 cm de largura, 11,5 cm de altura e nicho para foto 7,5 x 10,0 cm.`
    },
    {
      id: "p6",
      number: "Foto 6",
      title: "Funcionalidade e Detalhes Construtivos",
      badge: "Macro Close-up",
      aspect: "1:1 • 1200x1200px",
      description: "Macro fotografia destacando textura acetinada, curvas e acabamento do pezinho 3D.",
      promptTemplate: (name, desc) => 
        `Crie uma foto em close-up macro de altíssima definição, proporção 1:1, focada na riqueza de detalhes construtivos do produto ${name}. Detalhes do relevo: ${desc}. Iluminação rasante que revele a textura acetinada elegante, a precisão milimétrica dos dedinhos em relevo e a qualidade de fabricação rígida premium.`
    }
  ];

  const generateSingleImage = async (promptObj) => {
    if (!imageBase64) {
      alert("Por favor, anexe primeiro a foto da peça física!");
      return;
    }
    if (!replicateToken) {
      alert("Por favor, cole e salve o seu Token da Replicate no campo superior!");
      return;
    }

    setLoadingMap(prev => ({ ...prev, [promptObj.id]: true }));
    setStatusMessage(`Marina processando ${promptObj.title} via servidor...`);

    const fullPromptText = promptObj.promptTemplate(productName, mandatoryFeatures);

    try {
      const response = await fetch("/.netlify/functions/replicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageBase64,
          prompt: fullPromptText,
          token: replicateToken.trim()
        })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Falha na comunicação com o servidor.");
      }

      setGeneratedImages(prev => ({ ...prev, [promptObj.id]: data.output }));
      setStatusMessage(`${promptObj.number} gerada com sucesso pela Marina!`);
    } catch (err) {
      console.error(err);
      alert(`Erro ao gerar ${promptObj.number}: ${err.message}`);
      setStatusMessage(`Falha na ${promptObj.number}: ${err.message}`);
    } finally {
      setLoadingMap(prev => ({ ...prev, [promptObj.id]: false }));
    }
  };

  const baseCalculo = Number(custoProduto) + Number(freteEntrega) + Number(insumosEmbalagem);
  const somaTaxasPct = Number(impostosPct) + Number(comissaoMLPct) + Number(comissaoAfiliadosPct) + Number(margemDesejadaPct);
  const divisor = 1 - (somaTaxasPct / 100);
  const precoVenda = divisor > 0 ? baseCalculo / divisor : 0;
  
  const impostosValor = precoVenda * (Number(impostosPct) / 100);
  const comissaoMLValor = precoVenda * (Number(comissaoMLPct) / 100);
  const comissaoAfiliadosValor = precoVenda * (Number(comissaoAfiliadosPct) / 100);
  const margemLucroValor = precoVenda * (Number(margemDesejadaPct) / 100);
  const lucroLiquidoTotalLote = margemLucroValor * Number(qtdUnidades);
  const faturamentoTotalLote = precoVenda * Number(qtdUnidades);

  useEffect(() => {
    if (activeTab !== "3d" || !mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e1117);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffeedd, 1.2);
    dirLight.position.set(15, 25, 15);
    scene.add(dirLight);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 20),
      new THREE.MeshStandardMaterial({ color: 0x181c24, roughness: 0.8 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const divider = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 5, 18),
      new THREE.MeshStandardMaterial({ color: 0x222834 })
    );
    divider.position.set(0, 2.5, 0);
    scene.add(divider);

    const dirDesk = new THREE.Mesh(
      new THREE.BoxGeometry(7, 0.8, 3.5),
      new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.4 })
    );
    dirDesk.position.set(-6, 1.5, 0);
    scene.add(dirDesk);

    for (let i = -1; i <= 1; i += 2) {
      const mon = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 1.2, 1.8),
        new THREE.MeshStandardMaterial({ color: 0x111111 })
      );
      mon.position.set(-5.5, 2.7, i * 1.5);
      mon.rotation.y = Math.PI / 2;
      scene.add(mon);
    }

    const agentPositions = [
      { name: "Sofia", x: 4, z: -3.5, color: 0xa855f7 },
      { name: "Lucas", x: 8, z: -3.5, color: 0x3b82f6 },
      { name: "Marina", x: 4, z: 3.5, color: 0xf59e0b },
      { name: "Rodrigo", x: 8, z: 3.5, color: 0x10b981 }
    ];

    agentPositions.forEach(agent => {
      const aDesk = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.7, 1.8),
        new THREE.MeshStandardMaterial({ color: 0x2a313d })
      );
      aDesk.position.set(agent.x, 1.4, agent.z);
      scene.add(aDesk);

      const aMon = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 1.0, 1.5),
        new THREE.MeshStandardMaterial({ color: 0x0a0c10, emissive: agent.color, emissiveIntensity: 0.25 })
      );
      aMon.position.set(agent.x, 2.3, agent.z);
      scene.add(aMon);

      const chair = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 1.2, 16),
        new THREE.MeshStandardMaterial({ color: 0x15181f })
      );
      chair.position.set(agent.x - (agent.x > 6 ? 1.5 : -1.5), 0.8, agent.z);
      scene.add(chair);
    });

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(22, 22, 22);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 2, 0);

    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [activeTab]);

  return (
    <div className="flex h-screen w-screen bg-[#090b0e] text-gray-100 font-sans overflow-hidden">
      <aside className="w-64 bg-[#11141a] border-r border-gray-800/80 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-5 border-b border-gray-800/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-bold text-white shadow-lg shadow-orange-500/20">
              3D
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wider uppercase text-white">Galpão Arte 3D</h1>
              <p className="text-[10px] text-orange-400 font-semibold tracking-widest uppercase">Central de Agentes IA</p>
            </div>
          </div>

          <nav className="p-3 space-y-1.5">
            <button
              onClick={() => setActiveTab("marina")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition ${
                activeTab === "marina" ? "bg-orange-600 text-white shadow-lg shadow-orange-600/30" : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Estúdio da Marina (IA)</span>
            </button>

            <button
              onClick={() => setActiveTab("esteira")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition ${
                activeTab === "esteira" ? "bg-orange-600 text-white shadow-lg shadow-orange-600/30" : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
              }`}
            >
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Precificação do Rodrigo</span>
            </button>

            <button
              onClick={() => setActiveTab("3d")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition ${
                activeTab === "3d" ? "bg-orange-600 text-white shadow-lg shadow-orange-600/30" : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
              }`}
            >
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>Escritório Isométrico 3D</span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-gray-800/80 bg-[#0c0e12] text-xs">
          <p className="text-gray-400">Motor de Renderização</p>
          <p className="text-emerald-400 font-semibold flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Ponte Serverless Ativa
          </p>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto bg-[#090b0e]">
        <header className="h-16 border-b border-gray-800/80 bg-[#11141a]/90 backdrop-blur px-6 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              {activeTab === "marina" && "Estúdio da Marina • 6 Fotos Oficiais para Mercado Livre"}
              {activeTab === "esteira" && "Módulo de Precificação Financeira • Rodrigo"}
              {activeTab === "3d" && "Layout Isométrico 3D • Escritório da Agência"}
            </h2>
            <p className="text-xs text-gray-400">Preservação exata do relevo da peça e cenário 1:1</p>
          </div>
        </header>

        {statusMessage && (
          <div className="bg-orange-500/10 border-b border-orange-500/20 px-6 py-2.5 text-xs text-orange-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-orange-400" />
              <span>{statusMessage}</span>
            </div>
            <button onClick={() => setStatusMessage("")} className="text-gray-500 hover:text-white">✕</button>
          </div>
        )}

        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
          {activeTab === "marina" && (
            <>
              <div className="bg-[#12151d] border border-gray-800/80 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2">
                      Conexão com Replicate (Image-to-Image)
                      <span className="text-[10px] font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        {replicateToken ? "Token Ativo" : "Insira seu Token"}
                      </span>
                    </h3>
                    <p className="text-[11px] text-gray-400">Segmentação e preservação milimétrica da peça</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-1/2">
                  <input
                    type="password"
                    placeholder="Cole seu token Replicate (r8_...)"
                    value={replicateToken}
                    onChange={(e) => setReplicateToken(e.target.value)}
                    className="flex-1 bg-[#090b0e] border border-gray-700/80 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                  <button
                    onClick={handleSaveToken}
                    className="px-4 py-2 bg-gray-800 hover:bg-orange-600 text-gray-200 hover:text-white rounded-xl text-xs font-semibold shrink-0 transition"
                  >
                    {isTokenSaved ? "Salvo!" : "Salvar Token"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 bg-[#12151d] border border-gray-800/80 rounded-2xl p-5 space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Nome do Produto
                    </label>
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="mt-1 w-full bg-[#090b0e] border border-gray-700/80 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-medium outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Características Obrigatórias & Dimensões
                    </label>
                    <textarea
                      rows={3}
                      value={mandatoryFeatures}
                      onChange={(e) => setMandatoryFeatures(e.target.value)}
                      className="mt-1 w-full bg-[#090b0e] border border-gray-700/80 focus:border-orange-500 rounded-xl p-3 text-xs text-gray-300 font-mono outline-none leading-relaxed"
                    />
                  </div>
                </div>

                <div className="lg:col-span-4 bg-[#12151d] border-2 border-dashed border-gray-700 hover:border-orange-500 rounded-2xl p-4 flex flex-col justify-between transition">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-300 uppercase flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-orange-400" /> Foto Obrigatória da Peça
                    </span>
                    {uploadedImage && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                        Integrada
                      </span>
                    )}
                  </div>

                  {uploadedImage ? (
                    <div className="relative h-36 rounded-xl overflow-hidden bg-black/50 border border-gray-800 flex items-center justify-center">
                      <img src={uploadedImage} alt="Peça Física" className="h-full w-full object-contain" />
                      <button
                        onClick={() => { setUploadedImage(null); setImageBase64(""); }}
                        className="absolute top-2 right-2 bg-black/70 hover:bg-red-600 text-white p-1 rounded-lg text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="h-36 rounded-xl border border-dashed border-gray-800 bg-[#090b0e] hover:bg-gray-800/40 flex flex-col items-center justify-center cursor-pointer p-3 text-center transition"
                    >
                      <Upload className="w-5 h-5 text-orange-400 mb-1.5" />
                      <p className="text-xs font-semibold text-gray-200">Clique para anexar a foto da peça</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">JPG ou PNG</p>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 w-full py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-xl transition"
                  >
                    {uploadedImage ? "Substituir Foto da Peça" : "Escolher Arquivo"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rawPrompts.map((p) => {
                  const img = generatedImages[p.id];
                  const isLoading = loadingMap[p.id];
                  const compiledPrompt = p.promptTemplate(productName, mandatoryFeatures);

                  return (
                    <div key={p.id} className="bg-[#12151d] border border-gray-800/80 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xl">
                      <div className="p-4 border-b border-gray-800/80 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black text-orange-400 uppercase tracking-wider">{p.number}</span>
                            <span className="text-[10px] bg-gray-800 text-gray-300 px-2 py-0.5 rounded font-medium">{p.badge}</span>
                          </div>
                          <h4 className="text-xs font-bold text-white mt-0.5">{p.title}</h4>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(compiledPrompt);
                            setStatusMessage(`Prompt da ${p.number} copiado!`);
                          }}
                          className="p-1.5 text-gray-400 hover:text-white bg-gray-800/60 hover:bg-gray-700 rounded-lg text-xs transition"
                          title="Copiar Prompt Compilado"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="relative aspect-square w-full bg-black/60 flex items-center justify-center p-2 overflow-hidden group">
                        {isLoading ? (
                          <div className="text-center space-y-2 p-4">
                            <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
                            <p className="text-xs text-gray-300 font-semibold">Marina renderizando com Replicate...</p>
                            <p className="text-[10px] text-gray-500">Isolando peça e aplicando cenário 1:1</p>
                          </div>
                        ) : img ? (
                          <>
                            <img src={img} alt={p.title} className="w-full h-full object-cover rounded-xl" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                              <button
                                onClick={() => setPreviewModalImg(img)}
                                className="p-2 bg-black/80 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                              >
                                <ZoomIn className="w-4 h-4" /> Ampliar
                              </button>
                              <a
                                href={img}
                                download={`${p.number.toLowerCase().replace(" ", "_")}_anuncio.jpg`}
                                className="p-2 bg-black/80 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                              >
                                <Download className="w-4 h-4" /> Baixar
                              </a>
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-6 space-y-2">
                            <Sparkles className="w-8 h-8 text-gray-600 mx-auto" />
                            <p className="text-xs text-gray-400">{p.description}</p>
                            <span className="inline-block text-[10px] text-gray-500 font-mono bg-gray-900/60 px-2 py-0.5 rounded">
                              {p.aspect}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-3 bg-[#0d0f14] border-t border-gray-800/80 flex items-center justify-between gap-2">
                        <button
                          onClick={() => generateSingleImage(p)}
                          disabled={isLoading}
                          className="flex-1 py-2 bg-gray-800 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          {isLoading ? "Renderizando..." : `Gerar ${p.number}`}
                        </button>
                        {img && (
                          <a
                            href={img}
                            download={`${p.number.toLowerCase().replace(" ", "_")}_anuncio.jpg`}
                            className="p-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-xl transition"
                            title="Baixar Foto HD"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {activeTab === "esteira" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 bg-[#12151d] border border-gray-800/80 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200">Custos Base da Peça</h3>
                
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 uppercase">Custo dos Produtos (Filamento / Peça)</label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-2.5 text-xs text-gray-500">R$</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={custoProduto} 
                      onChange={(e) => setCustoProduto(e.target.value)}
                      className="w-full bg-[#090b0e] border border-gray-700/80 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-white focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-400 uppercase">Insumos / Embalagem</label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-2.5 text-xs text-gray-500">R$</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={insumosEmbalagem} 
                      onChange={(e) => setInsumosEmbalagem(e.target.value)}
                      className="w-full bg-[#090b0e] border border-gray-700/80 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-white focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-400 uppercase">Frete Entrega (Unitário Full)</label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-2.5 text-xs text-gray-500">R$</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={freteEntrega} 
                      onChange={(e) => setFreteEntrega(e.target.value)}
                      className="w-full bg-[#090b0e] border border-gray-700/80 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-white focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[10px] text-gray-400 uppercase">Impostos DAS (%)</label>
                    <input 
                      type="number" 
                      value={impostosPct} 
                      onChange={(e) => setImpostosPct(e.target.value)}
                      className="w-full mt-1 bg-[#090b0e] border border-gray-700/80 rounded-xl p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 uppercase">Comissão ML (%)</label>
                    <input 
                      type="number" 
                      value={comissaoMLPct} 
                      onChange={(e) => setComissaoMLPct(e.target.value)}
                      className="w-full mt-1 bg-[#090b0e] border border-gray-700/80 rounded-xl p-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-emerald-400 uppercase font-bold">Margem Desejada (%)</label>
                  <input 
                    type="number" 
                    value={margemDesejadaPct} 
                    onChange={(e) => setMargemDesejadaPct(e.target.value)}
                    className="w-full mt-1 bg-[#090b0e] border border-gray-700/80 rounded-xl p-2 text-xs text-emerald-400 font-bold"
                  />
                </div>
              </div>

              <div className="lg:col-span-7 bg-[#12151d] border border-gray-800/80 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-200">Detalhamento do Preço (Markup por Dentro)</h3>
                  <span className="text-[10px] bg-orange-500/20 text-orange-400 font-bold px-2 py-0.5 rounded">Fórmula Oficial</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-gray-800/40">
                    <span className="text-gray-400">Custo dos produtos</span>
                    <span className="text-red-400 font-semibold">R$ {Number(custoProduto).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-800/40">
                    <span className="text-gray-400">Frete entrega</span>
                    <span className="text-red-400 font-semibold">R$ {Number(freteEntrega).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-800/40">
                    <span className="text-gray-400">Insumos / Embalagem</span>
                    <span className="text-red-400 font-semibold">R$ {Number(insumosEmbalagem).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-700 bg-white/5 px-2 rounded font-bold">
                    <span className="text-gray-200">Base de cálculo</span>
                    <span className="text-white">R$ {baseCalculo.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-800/40">
                    <span className="text-gray-400">Impostos ({impostosPct}%)</span>
                    <span className="text-red-400 font-semibold">R$ {impostosValor.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-800/40">
                    <span className="text-gray-400">Comissão marketplace ({comissaoMLPct}%)</span>
                    <span className="text-red-400 font-semibold">R$ {comissaoMLValor.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-800/40">
                    <span className="text-gray-400">Margem de lucro ({margemDesejadaPct}%)</span>
                    <span className="text-emerald-400 font-semibold">R$ {margemLucroValor.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-3 text-sm font-black bg-orange-500/10 p-3 rounded-xl border border-orange-500/30">
                    <span className="text-orange-400">Preço de venda sugerido</span>
                    <span className="text-white text-base">R$ {precoVenda.toFixed(2)}</span>
                  </div>
                </div>

                <div className="p-4 bg-[#181c24] rounded-xl border border-gray-700/80 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">Qtd. Unidades</p>
                    <input 
                      type="number" 
                      value={qtdUnidades} 
                      onChange={(e) => setQtdUnidades(e.target.value)}
                      className="w-16 mx-auto mt-1 bg-black/40 border border-gray-600 rounded px-2 py-1 text-center font-bold text-white text-xs"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">Faturamento Bruto</p>
                    <p className="text-sm font-bold text-white mt-1">R$ {faturamentoTotalLote.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase">Lucro Líquido</p>
                    <p className="text-base font-black text-emerald-400 mt-0.5">R$ {lucroLiquidoTotalLote.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "3d" && (
            <div className="bg-[#12151d] border border-gray-800/80 rounded-2xl overflow-hidden flex flex-col h-[650px] relative">
              <div className="p-4 border-b border-gray-800/80 flex items-center justify-between bg-[#11141a]">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase">Escritório Isométrico Galpão Arte 3D</h3>
                  <p className="text-[11px] text-gray-400">Arraste para girar a maquete e use o scroll do mouse para zoom</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full font-semibold">
                    Diretoria Executiva
                  </span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-semibold">
                    Central de Agentes (Sofia, Lucas, Marina, Rodrigo)
                  </span>
                </div>
              </div>

              <div ref={mountRef} className="flex-1 w-full h-full cursor-grab active:cursor-grabbing" />
            </div>
          )}
        </div>
      </main>

      {previewModalImg && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-[#12151d] border border-gray-800 rounded-2xl overflow-hidden p-4">
            <button
              onClick={() => setPreviewModalImg(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-red-600 text-white rounded-full transition"
            >
              <X className="w-4 h-4" />
            </button>
            <img src={previewModalImg} alt="Visualização" className="w-full aspect-square object-cover rounded-xl" />
            <div className="mt-4 flex justify-end gap-2">
              <a
                href={previewModalImg}
                download="criativo_mercado_livre.jpg"
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition"
              >
                <Download className="w-4 h-4" /> Baixar Imagem Original
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
