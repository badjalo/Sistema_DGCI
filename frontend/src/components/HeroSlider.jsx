import React, { useState, useEffect } from 'react';
import { ArrowRight, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';

const HeroSlider = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [animatedOptions, setAnimatedOptions] = useState([]);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dados de fallback caso a API não tenha slides configurados
  const defaultOptions = [
    {
      id: 1,
      titulo: "Sindicato dos Funcionários da DGCI",
      descricao: "Plataforma oficial de gestão sindical — moderna, segura e digital.",
      imagem_url: "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=1200&q=80",
      link_url: "#features"
    },
    {
      id: 2,
      titulo: "Gestão de Membros",
      descricao: "Registo completo de filiados com perfis, fotos e histórico sindical.",
      imagem_url: "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=1200&q=80",
      link_url: "#features"
    },
    {
      id: 3,
      titulo: "Controlo Financeiro",
      descricao: "Quotas, pagamentos e relatórios financeiros automatizados.",
      imagem_url: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80",
      link_url: "/login"
    }
  ];

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await axios.get('/api/slider/public');
        if (res.data && res.data.success && res.data.data.length > 0) {
          // /uploads/... funciona via proxy do Vite — nao precisa de URL absoluta
          setOptions(res.data.data);
        } else {
          setOptions(defaultOptions);
        }
      } catch (err) {
        console.error('Erro ao buscar slides:', err);
        setOptions(defaultOptions);
      } finally {
        setLoading(false);
      }
    };
    fetchSlides();
  }, []);

  const handleOptionClick = (index) => {
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  useEffect(() => {
    if (options.length === 0) return;
    
    const timers = [];
    setAnimatedOptions([]);
    
    options.forEach((_, i) => {
      const timer = setTimeout(() => {
        setAnimatedOptions(prev => [...prev, i]);
      }, 180 * i);
      timers.push(timer);
    });
    
    // Auto play
    const autoPlay = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % options.length);
    }, 6000);
    
    return () => {
      timers.forEach(timer => clearTimeout(timer));
      clearInterval(autoPlay);
    };
  }, [options]);

  if (loading) {
    return <div className="w-full h-[600px] bg-[#0f1f42] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#0f1f42] font-sans overflow-hidden">
      
      {/* Interactive Slider Container */}
      <div className="w-full max-w-7xl mx-auto px-4 h-[70vh] min-h-[500px] flex items-stretch overflow-hidden relative z-10 pt-20">
        {options.map((option, index) => (
          <div
            key={option.id || index}
            className={`
              relative flex flex-col justify-end overflow-hidden transition-all duration-700 ease-in-out cursor-pointer
              ${activeIndex === index ? 'active' : ''}
            `}
            style={{
              backgroundImage: `url('${option.imagem_url}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backfaceVisibility: 'hidden',
              opacity: animatedOptions.includes(index) ? 1 : 0,
              transform: animatedOptions.includes(index) ? 'translateX(0)' : 'translateX(-60px)',
              minWidth: '60px',
              margin: '0 4px',
              borderRadius: '24px',
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: activeIndex === index ? '#facc15' : 'rgba(255,255,255,0.1)',
              boxShadow: activeIndex === index 
                ? '0 20px 60px rgba(0,0,0,0.60)' 
                : '0 10px 30px rgba(0,0,0,0.30)',
              flex: activeIndex === index ? '7 1 0%' : '1 1 0%',
              zIndex: activeIndex === index ? 10 : 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              position: 'relative',
            }}
            onClick={() => handleOptionClick(index)}
          >
            {/* Dark overlay for text readability */}
            <div 
              className="absolute inset-0 pointer-events-none transition-all duration-700"
              style={{
                background: activeIndex === index 
                  ? 'linear-gradient(to top, rgba(15,31,66,0.9) 0%, rgba(15,31,66,0.4) 50%, rgba(0,0,0,0.1) 100%)' 
                  : 'linear-gradient(to top, rgba(15,31,66,0.9) 0%, rgba(15,31,66,0.7) 100%)'
              }}
            ></div>
            
            {/* Content */}
            <div className="absolute left-0 right-0 bottom-0 p-6 flex flex-col justify-end z-20 pointer-events-none w-full">
              
              {/* Active State Content */}
              <div 
                className="transition-all duration-700 ease-in-out"
                style={{
                  opacity: activeIndex === index ? 1 : 0,
                  transform: activeIndex === index ? 'translateY(0)' : 'translateY(20px)',
                  maxHeight: activeIndex === index ? '500px' : '0px',
                  overflow: 'hidden'
                }}
              >
                <div className="inline-flex items-center gap-2 bg-yellow-400/20 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider backdrop-blur-sm">
                  Destaque
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white mb-3 leading-tight drop-shadow-lg">
                  {option.titulo}
                </h2>
                <p className="text-slate-200 text-base md:text-lg mb-6 max-w-2xl drop-shadow-md font-medium">
                  {option.descricao}
                </p>
                
                {option.link_url && (
                  <div className="pointer-events-auto">
                    <a 
                      href={option.link_url}
                      className="inline-flex items-center gap-2 bg-yellow-400 text-[#0f1f42] font-black px-6 py-3 rounded-xl hover:bg-yellow-300 transition-all shadow-lg hover:shadow-yellow-400/20"
                    >
                      Ler mais <ArrowRight size={18} />
                    </a>
                  </div>
                )}
              </div>

              {/* Inactive State Content (Vertical/Icon) */}
              <div 
                className="transition-all duration-700 ease-in-out absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
                style={{
                  opacity: activeIndex === index ? 0 : 1,
                  transform: activeIndex === index ? 'translateY(20px)' : 'translateY(0)',
                  pointerEvents: activeIndex === index ? 'none' : 'auto'
                }}
              >
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                  <ImageIcon size={20} />
                </div>
                <span className="text-white font-bold whitespace-nowrap origin-bottom -rotate-90 translate-y-[-100%] text-sm tracking-widest uppercase opacity-80">
                  {option.titulo}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Decorative background elements for harmony with blue hero */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0f1f42] to-transparent z-20 pointer-events-none"></div>
      <div className="absolute top-1/2 right-0 w-96 h-96 rounded-full bg-yellow-400/5 blur-3xl z-0"></div>
      <div className="absolute top-1/4 left-10 w-72 h-72 rounded-full bg-[#1a2f5e] blur-3xl z-0 opacity-50"></div>
    </div>
  );
};

export default HeroSlider;
