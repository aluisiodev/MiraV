import type { Idioma } from "@/lib/i18n";

export interface TextoDiretor {
  cargo: string;
  descricao: string;
  diaADia: string[];
  frentes: string[];
}

export interface Diretor {
  id: string;
  nome: string;
  sigla: "CEO" | "CTO" | "CMO" | "COO" | "CFO";
  foto?: string;
  linkedin?: string;
  textos: Record<Idioma, TextoDiretor>;
}

// A ordem aqui é a ordem em volta do radar, começando no topo e seguindo no sentido horário.
export const DIRETORIA: Diretor[] = [
  {
    id: "luan",
    nome: "Luan Sousa",
    sigla: "CEO",
    foto: "/img/equipe/luan-sousa.jpg",
    linkedin: "https://www.linkedin.com/in/luan-sousa-244a96418/",
    textos: {
      pt: {
        cargo: "Diretor-Geral",
        descricao:
          "Define a estratégia da MiraV e responde pelos resultados da empresa. É quem alinha a diretoria em torno de um mesmo objetivo: levar o VisaVision a cada vez mais salões, barbearias e clínicas.",
        diaADia: [
          "Define as metas e as prioridades da empresa",
          "Lidera a diretoria e acompanha os resultados de cada área",
          "Representa a MiraV diante de clientes, parceiros e investidores",
        ],
        frentes: ["Estratégia", "Resultados", "Liderança"],
      },
      en: {
        cargo: "Chief Executive Officer",
        descricao:
          "Sets MiraV's strategy and is accountable for the company's results. He keeps the board aligned around one goal: bringing VisaVision to more and more salons, barbershops and clinics.",
        diaADia: [
          "Sets the company's goals and priorities",
          "Leads the board and tracks the results of each area",
          "Represents MiraV to clients, partners and investors",
        ],
        frentes: ["Strategy", "Results", "Leadership"],
      },
      es: {
        cargo: "Director General",
        descricao:
          "Define la estrategia de MiraV y responde por los resultados de la empresa. Es quien alinea a la dirección en torno a un mismo objetivo: llevar el VisaVision a cada vez más salones, barberías y clínicas.",
        diaADia: [
          "Define las metas y las prioridades de la empresa",
          "Lidera la dirección y sigue los resultados de cada área",
          "Representa a MiraV ante clientes, socios e inversionistas",
        ],
        frentes: ["Estrategia", "Resultados", "Liderazgo"],
      },
    },
  },
  {
    id: "aluisio",
    nome: "Aluísio Alves",
    sigla: "CTO",
    foto: "/img/equipe/aluisio-alves.jpg",
    linkedin: "https://www.linkedin.com/in/aluisio-alves/",
    textos: {
      pt: {
        cargo: "Diretor de Tecnologia",
        descricao:
          "Define a estratégia de tecnologia, inovação, dados e inteligência artificial. Cuida de tudo o que faz o VisaVision funcionar: o espelho, a IA que reconhece os cortes, a API e o site.",
        diaADia: [
          "Escolhe as tecnologias e a arquitetura dos produtos",
          "Lidera o time de engenharia de software, IA e suporte",
          "Garante a segurança e a proteção dos dados dos clientes (LGPD)",
        ],
        frentes: ["Tecnologia", "Inovação", "Dados", "IA"],
      },
      en: {
        cargo: "Chief Technology Officer",
        descricao:
          "Sets the strategy for technology, innovation, data and artificial intelligence. He looks after everything that makes VisaVision work: the mirror, the AI that recognises haircuts, the API and the website.",
        diaADia: [
          "Chooses the technologies and the product architecture",
          "Leads the software engineering, AI and support team",
          "Ensures the security and protection of client data (LGPD)",
        ],
        frentes: ["Technology", "Innovation", "Data", "AI"],
      },
      es: {
        cargo: "Director de Tecnología",
        descricao:
          "Define la estrategia de tecnología, innovación, datos e inteligencia artificial. Cuida todo lo que hace funcionar el VisaVision: el espejo, la IA que reconoce los cortes, la API y el sitio.",
        diaADia: [
          "Elige las tecnologías y la arquitectura de los productos",
          "Lidera el equipo de ingeniería de software, IA y soporte",
          "Garantiza la seguridad y la protección de los datos de los clientes (LGPD)",
        ],
        frentes: ["Tecnología", "Innovación", "Datos", "IA"],
      },
    },
  },
  {
    id: "caio",
    nome: "Caio",
    sigla: "COO",
    textos: {
      pt: {
        cargo: "Diretor de Operações",
        descricao:
          "Responde pela operação, pela produção e pela logística, colocando em prática a estratégia definida pelo CEO. Garante que cada espelho seja montado, testado e entregue no prazo.",
        diaADia: [
          "Planeja a produção e acompanha a linha de montagem",
          "Cuida da qualidade e da logística de entrega",
          "Busca processos mais eficientes e com menos desperdício",
        ],
        frentes: ["Operação", "Produção", "Logística"],
      },
      en: {
        cargo: "Chief Operating Officer",
        descricao:
          "Is accountable for operations, production and logistics, putting the strategy set by the CEO into practice. He makes sure every mirror is assembled, tested and delivered on time.",
        diaADia: [
          "Plans production and oversees the assembly line",
          "Looks after quality and delivery logistics",
          "Seeks more efficient processes with less waste",
        ],
        frentes: ["Operations", "Production", "Logistics"],
      },
      es: {
        cargo: "Director de Operaciones",
        descricao:
          "Responde por la operación, la producción y la logística, poniendo en práctica la estrategia definida por el CEO. Garantiza que cada espejo se monte, se pruebe y se entregue a tiempo.",
        diaADia: [
          "Planifica la producción y supervisa la línea de montaje",
          "Cuida la calidad y la logística de entrega",
          "Busca procesos más eficientes y con menos desperdicio",
        ],
        frentes: ["Operación", "Producción", "Logística"],
      },
    },
  },
  {
    id: "ryan",
    nome: "Ryan",
    sigla: "CFO",
    foto: "/img/equipe/ryan.jpg",
    linkedin: "https://www.linkedin.com/in/ryan-pereira-da-silva-ab9852361/",
    textos: {
      pt: {
        cargo: "Diretor Financeiro",
        descricao:
          "Responde pela gestão financeira, pelo planejamento orçamentário, pela tesouraria e pela controladoria. Mantém a MiraV saudável para crescer com segurança.",
        diaADia: [
          "Monta e acompanha o orçamento da empresa",
          "Controla o caixa, os custos e os investimentos",
          "Prepara os relatórios financeiros para a diretoria",
        ],
        frentes: ["Finanças", "Orçamento", "Tesouraria", "Controladoria"],
      },
      en: {
        cargo: "Chief Financial Officer",
        descricao:
          "Is accountable for financial management, budget planning, treasury and controllership. He keeps MiraV healthy so it can grow safely.",
        diaADia: [
          "Builds and tracks the company budget",
          "Controls cash, costs and investments",
          "Prepares financial reports for the board",
        ],
        frentes: ["Finance", "Budget", "Treasury", "Controllership"],
      },
      es: {
        cargo: "Director Financiero",
        descricao:
          "Responde por la gestión financiera, la planificación presupuestaria, la tesorería y la contraloría. Mantiene a MiraV saludable para crecer con seguridad.",
        diaADia: [
          "Elabora y sigue el presupuesto de la empresa",
          "Controla la caja, los costos y las inversiones",
          "Prepara los informes financieros para la dirección",
        ],
        frentes: ["Finanzas", "Presupuesto", "Tesorería", "Contraloría"],
      },
    },
  },
  {
    id: "livia",
    nome: "Livia Felix",
    sigla: "CMO",
    foto: "/img/equipe/livia-felix.jpg",
    textos: {
      pt: {
        cargo: "Diretora de Marketing",
        descricao:
          "Responde pela estratégia de marca, marketing, comunicação e geração de demanda. Faz o VisaVision ser conhecido e desejado por quem trabalha com beleza.",
        diaADia: [
          "Cuida da identidade e do posicionamento da marca MiraV",
          "Planeja as campanhas, os conteúdos e a presença digital",
          "Gera oportunidades para o time de vendas",
        ],
        frentes: ["Marca", "Marketing", "Comunicação", "Demanda"],
      },
      en: {
        cargo: "Chief Marketing Officer",
        descricao:
          "Is accountable for brand strategy, marketing, communication and demand generation. She makes VisaVision known and wanted by people who work in beauty.",
        diaADia: [
          "Looks after the MiraV brand identity and positioning",
          "Plans campaigns, content and digital presence",
          "Generates opportunities for the sales team",
        ],
        frentes: ["Brand", "Marketing", "Communication", "Demand"],
      },
      es: {
        cargo: "Directora de Marketing",
        descricao:
          "Responde por la estrategia de marca, marketing, comunicación y generación de demanda. Hace que el VisaVision sea conocido y deseado por quienes trabajan en belleza.",
        diaADia: [
          "Cuida la identidad y el posicionamiento de la marca MiraV",
          "Planifica las campañas, los contenidos y la presencia digital",
          "Genera oportunidades para el equipo de ventas",
        ],
        frentes: ["Marca", "Marketing", "Comunicación", "Demanda"],
      },
    },
  },
];
