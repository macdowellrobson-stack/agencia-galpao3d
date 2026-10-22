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
  const [activeTab, setActiveTab] = useState("marina"); // 'marina', 'esteira', '3d'
  
  // Token Replicate (armazenado com persistência local)
  const [replicateToken, setReplicateToken] = useState(() => localStorage.getItem("replicate_api_token") || "");
  const [isTokenSaved, setIsTokenSaved] = useState(false);

  // Parâmetros do Produto
  const [productName, setProductName] = useState("Quadro Maternidade porta-retrato com Pezinho");
  const [mandatoryFeatures, setMandatoryFeatures] = useState(
    "Dimensões totais: 17,0 cm de largura x 11,5 cm de altura. Nicho para foto revelada: 7,5 x 10,0 cm. Relevo 3D do pezinho de bebê em material fosco acetinado branco. Moldura monobloco elegante com nicho fotográfico ao lado."
  );
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imageBase64, setImageBase64] = useState("");
  const fileInputRef = useRef(null);

  // Estados Financeiros do Rodrigo (Markup por Dentro)
  const [custoProduto, setCustoProduto] = useState(9.50);
  const [insumosEmbalagem, setInsumosEmbalagem] = useState(1.50);
  const [freteEntrega, setFreteEntrega] = useState(8.45);
  const [impostosPct, setImpostosPct] = useState(4.0);
  const [comissaoMLPct, setComissaoMLPct] = useState(11.5);
  const [comissaoAfiliadosPct, setComissaoAfiliadosPct] = useState(0.0);
  const [margemDesejadaPct, setMargemDesejadaPct] = useState(36.0);
  const [qtdUnidades, setQtdUnidades] = useState(21);

  // Estados de Geração das 6 Imagens
  const [loadingMap, setLoadingMap] = useState({});
  const [generatedImages, setGeneratedImages] = useState({
    p1: null, p2: null, p3: null, p4: null, p5: null, p6: null
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [previewModalImg, setPreviewModalImg] = useState(null);

  // Ref do Three.js
  const mountRef = useRef(null);

  // Salvar Token
  const handleSaveToken = () => {
    localStorage.setItem("replicate_api_token", replicateToken.trim());
    setIsTokenSaved(true);
    setStatusMessage("Token da Replicate salvo com sucesso!");
    setTimeout(() => {
      setIsTokenSaved(false);
      setStatusMessage("");
    }, 3000);
  };

  // Upload de Imagem
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

  // Os 6 Prompts Oficiais do Mercado Livre (1:1 • 1200x1200px)
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

  // Disparo da Função Netlify Serverless (Sem bloqueio de CORS)
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
      alert(`Erro ao gerar ${promptObj.number}:${err.message}`);
      setStatusMessage(`Falha na ${promptObj.number}:${err.message}`);
    } finally {
      setLoadingMap(prev => ({ ...prev, [promptObj.id]: false }));
    }
  };

  // Cálculo Exato de Margem por Dentro (Rodrigo)
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

  // Cenário Isométrico 3D (Three.js WebGL)
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

    // Piso Geral
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 20),
      new THREE.MeshStandardMaterial({ color: 0x181c24, roughness: 0.8 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Divisória Central entre Diretoria e Central de Agentes
    const divider = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 5, 18),
      new THREE.MeshStandardMaterial({ color: 0x222834 })
    );
    divider.position.set(0, 2.5, 0);
    scene.add(divider);

    // Sala da Diretoria (Esquerda) - Mesa dos Sócios
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

    // Central de Agentes (Direita - Sofia, Lucas, Marina, Rodrigo)
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
      {/* Sidebar de Navegação */}
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
              className={`w-full flex items-center gap-3 px-
