// Vagas da página Trabalhe Conosco.
//
// De onde vem cada informação:
// - Cargo, área, quantidade, regime (CLT), escala (5x2), horário (8h às 17h) e benefícios:
//   planilha "Organograma_Empresa_Medio_Porte.xlsx" da equipe (out/2026). Só os cargos CLT entram aqui.
// - Requisitos, atribuições e responsabilidades: textos escritos para o site a partir da função de cada
//   cargo na planilha. A equipe pode ajustar à vontade.
// - Salário: sempre "Salário competitivo com o mercado" (texto em i18n, t.vagas.salarioValor).
//
// Para adicionar uma vaga, copie um bloco e troque o slug (o endereço da página), a área e os textos.

import type { Idioma } from "@/lib/i18n";

export type AreaVaga = "rh" | "administrativo" | "comercial" | "logistica" | "producao" | "qualidade" | "tecnologia";

/** Área equivalente no campo "Área de interesse" do formulário (valores aceitos pela API). */
type AreaFormulario = "desenvolvimento" | "design" | "ia" | "comercial" | "atendimento" | "outra";

export interface TextoVaga {
  cargo: string;
  resumo: string;
  requisitos: string[];
  atribuicoes: string[];
  responsabilidades: string[];
}

export interface Vaga {
  slug: string;
  area: AreaVaga;
  quantidade: number;
  areaFormulario: AreaFormulario;
  textos: Record<Idioma, TextoVaga>;
}

export const VAGAS: Vaga[] = [
  {
    slug: "coordenador-recursos-humanos",
    area: "rh",
    quantidade: 1,
    areaFormulario: "outra",
    textos: {
      pt: {
        cargo: "Coordenador(a) de Recursos Humanos",
        resumo: "Cuidar do recrutamento, da folha de pagamento, dos benefícios e dos treinamentos da equipe.",
        requisitos: [
          "Graduação em Psicologia, Administração, Gestão de RH ou áreas afins",
          "Experiência com recrutamento e seleção e com rotinas de departamento pessoal",
          "Conhecimento da CLT, do eSocial e da gestão de benefícios",
          "Boa comunicação e postura ética com informações confidenciais",
          "Diferencial: experiência em indústria ou em empresa de tecnologia",
        ],
        atribuicoes: [
          "Conduzir os processos seletivos, da abertura da vaga à integração",
          "Acompanhar a folha de pagamento, as férias, as admissões e os desligamentos",
          "Administrar os benefícios (vale-refeição, vale-transporte, planos e seguro de vida)",
          "Organizar treinamentos e a integração de novos colaboradores",
        ],
        responsabilidades: [
          "Garantir que as rotinas de pessoal sigam a legislação trabalhista",
          "Apoiar os líderes no desenvolvimento e na avaliação das equipes",
          "Cuidar do clima organizacional e da retenção de talentos",
          "Manter os indicadores de RH atualizados (rotatividade, faltas e treinamentos)",
        ],
      },
      en: {
        cargo: "Human Resources Coordinator",
        resumo: "Lead recruitment, payroll, benefits and training for the team.",
        requisitos: [
          "Degree in Psychology, Business Administration, HR Management or a related field",
          "Experience in recruitment and selection and in personnel administration routines",
          "Knowledge of Brazilian labour law (CLT), eSocial and benefits management",
          "Good communication skills and ethical handling of confidential information",
          "Nice to have: experience in manufacturing or in a technology company",
        ],
        atribuicoes: [
          "Run hiring processes, from opening the position to onboarding",
          "Oversee payroll, vacations, hiring and terminations",
          "Manage benefits (meal and transportation allowances, health plans and life insurance)",
          "Organise training and onboarding for new employees",
        ],
        responsabilidades: [
          "Ensure personnel routines comply with labour law",
          "Support leaders in developing and evaluating their teams",
          "Look after the work environment and talent retention",
          "Keep HR metrics up to date (turnover, absenteeism and training)",
        ],
      },
      es: {
        cargo: "Coordinador(a) de Recursos Humanos",
        resumo: "Encargarse del reclutamiento, la nómina, los beneficios y la capacitación del equipo.",
        requisitos: [
          "Título en Psicología, Administración, Gestión de RR. HH. o áreas afines",
          "Experiencia en reclutamiento y selección y en rutinas de administración de personal",
          "Conocimiento de la legislación laboral brasileña (CLT), eSocial y gestión de beneficios",
          "Buena comunicación y ética en el manejo de información confidencial",
          "Deseable: experiencia en industria o en empresa de tecnología",
        ],
        atribuicoes: [
          "Conducir los procesos de selección, desde la apertura de la vacante hasta la integración",
          "Supervisar la nómina, las vacaciones, las altas y las bajas",
          "Administrar los beneficios (vales de comida y transporte, planes y seguro de vida)",
          "Organizar capacitaciones y la integración de nuevos colaboradores",
        ],
        responsabilidades: [
          "Garantizar que las rutinas de personal cumplan la legislación laboral",
          "Apoyar a los líderes en el desarrollo y la evaluación de sus equipos",
          "Cuidar el clima laboral y la retención de talento",
          "Mantener actualizados los indicadores de RR. HH. (rotación, ausentismo y capacitación)",
        ],
      },
    },
  },
  {
    slug: "supervisor-producao",
    area: "producao",
    quantidade: 6,
    areaFormulario: "outra",
    textos: {
      pt: {
        cargo: "Supervisor(a) de Produção",
        resumo: "Acompanhar os turnos, as metas e a qualidade da produção dos espelhos VisaVision.",
        requisitos: [
          "Formação técnica ou superior em Produção, Mecânica, Eletrônica ou áreas afins",
          "Experiência liderando equipes em linha de produção",
          "Conhecimento de indicadores de produção e de ferramentas de melhoria (5S, Kaizen)",
          "Habilidade com planilhas e relatórios",
        ],
        atribuicoes: [
          "Distribuir as tarefas do turno e acompanhar o ritmo da linha",
          "Conferir se a montagem segue os padrões de qualidade e de segurança",
          "Registrar a produção, as paradas e os desvios",
          "Treinar os operadores em novos processos",
        ],
        responsabilidades: [
          "Cumprir as metas de produção com qualidade",
          "Garantir o uso de EPIs e a segurança da equipe",
          "Propor melhorias que reduzam retrabalho e desperdício",
        ],
      },
      en: {
        cargo: "Production Supervisor",
        resumo: "Oversee shifts, targets and quality in the production of VisaVision mirrors.",
        requisitos: [
          "Technical or university degree in Production, Mechanics, Electronics or a related field",
          "Experience leading teams on a production line",
          "Knowledge of production metrics and improvement tools (5S, Kaizen)",
          "Good spreadsheet and reporting skills",
        ],
        atribuicoes: [
          "Assign shift tasks and monitor the pace of the line",
          "Check that assembly follows quality and safety standards",
          "Record output, stoppages and deviations",
          "Train operators on new processes",
        ],
        responsabilidades: [
          "Meet production targets with quality",
          "Ensure the team uses PPE and works safely",
          "Suggest improvements that reduce rework and waste",
        ],
      },
      es: {
        cargo: "Supervisor(a) de Producción",
        resumo: "Supervisar los turnos, las metas y la calidad de la producción de los espejos VisaVision.",
        requisitos: [
          "Formación técnica o universitaria en Producción, Mecánica, Electrónica o áreas afines",
          "Experiencia liderando equipos en línea de producción",
          "Conocimiento de indicadores de producción y herramientas de mejora (5S, Kaizen)",
          "Manejo de hojas de cálculo e informes",
        ],
        atribuicoes: [
          "Distribuir las tareas del turno y seguir el ritmo de la línea",
          "Verificar que el montaje cumpla los estándares de calidad y seguridad",
          "Registrar la producción, las paradas y los desvíos",
          "Capacitar a los operadores en nuevos procesos",
        ],
        responsabilidades: [
          "Cumplir las metas de producción con calidad",
          "Garantizar el uso de EPP y la seguridad del equipo",
          "Proponer mejoras que reduzcan el retrabajo y el desperdicio",
        ],
      },
    },
  },
  {
    slug: "analista-financeiro",
    area: "administrativo",
    quantidade: 3,
    areaFormulario: "outra",
    textos: {
      pt: {
        cargo: "Analista Financeiro(a)",
        resumo: "Cuidar das contas a pagar e a receber, do fluxo de caixa e dos relatórios financeiros.",
        requisitos: [
          "Graduação em Ciências Contábeis, Administração, Economia ou áreas afins",
          "Experiência com contas a pagar, contas a receber e conciliação bancária",
          "Excel ou Google Planilhas em nível intermediário ou avançado",
          "Familiaridade com sistemas de gestão (ERP)",
          "Organização e atenção aos detalhes",
        ],
        atribuicoes: [
          "Lançar e acompanhar pagamentos e recebimentos",
          "Fazer as conciliações bancárias e controlar o fluxo de caixa",
          "Emitir e conferir notas fiscais e boletos",
          "Preparar os relatórios financeiros mensais",
        ],
        responsabilidades: [
          "Manter o caixa previsível e os registros corretos",
          "Apoiar o orçamento e o controle de custos",
          "Identificar riscos de inadimplência e propor ações",
        ],
      },
      en: {
        cargo: "Financial Analyst",
        resumo: "Handle accounts payable and receivable, cash flow and financial reports.",
        requisitos: [
          "Degree in Accounting, Business Administration, Economics or a related field",
          "Experience with accounts payable, accounts receivable and bank reconciliation",
          "Intermediate or advanced Excel or Google Sheets",
          "Familiarity with ERP systems",
          "Organised and detail-oriented",
        ],
        atribuicoes: [
          "Record and track payments and receipts",
          "Reconcile bank accounts and control cash flow",
          "Issue and check invoices and payment slips",
          "Prepare monthly financial reports",
        ],
        responsabilidades: [
          "Keep cash flow predictable and records accurate",
          "Support budgeting and cost control",
          "Spot default risks and suggest actions",
        ],
      },
      es: {
        cargo: "Analista Financiero(a)",
        resumo: "Encargarse de las cuentas por pagar y por cobrar, el flujo de caja y los informes financieros.",
        requisitos: [
          "Título en Contabilidad, Administración, Economía o áreas afines",
          "Experiencia con cuentas por pagar, cuentas por cobrar y conciliación bancaria",
          "Excel o Google Sheets a nivel intermedio o avanzado",
          "Familiaridad con sistemas de gestión (ERP)",
          "Organización y atención al detalle",
        ],
        atribuicoes: [
          "Registrar y seguir pagos y cobros",
          "Hacer las conciliaciones bancarias y controlar el flujo de caja",
          "Emitir y revisar facturas y boletos",
          "Preparar los informes financieros mensuales",
        ],
        responsabilidades: [
          "Mantener la caja previsible y los registros correctos",
          "Apoyar el presupuesto y el control de costos",
          "Identificar riesgos de morosidad y proponer acciones",
        ],
      },
    },
  },
  {
    slug: "assistente-administrativo",
    area: "administrativo",
    quantidade: 2,
    areaFormulario: "outra",
    textos: {
      pt: {
        cargo: "Assistente Administrativo(a)",
        resumo: "Dar apoio administrativo, cuidar dos documentos e do atendimento interno.",
        requisitos: [
          "Ensino médio completo (cursar ensino superior é um diferencial)",
          "Pacote Office ou Google Workspace",
          "Boa comunicação escrita e verbal",
          "Organização e proatividade",
        ],
        atribuicoes: [
          "Organizar documentos, contratos e arquivos",
          "Atender colaboradores e fornecedores por telefone e e-mail",
          "Controlar agendas, materiais de escritório e correspondências",
          "Apoiar as áreas financeira e de RH nas rotinas do dia a dia",
        ],
        responsabilidades: [
          "Manter os documentos em ordem e fáceis de encontrar",
          "Garantir que as solicitações internas sejam respondidas no prazo",
          "Contribuir para um escritório organizado e eficiente",
        ],
      },
      en: {
        cargo: "Administrative Assistant",
        resumo: "Provide administrative support and handle documents and internal requests.",
        requisitos: [
          "High school diploma (pursuing a university degree is a plus)",
          "Microsoft Office or Google Workspace",
          "Good written and verbal communication",
          "Organised and proactive",
        ],
        atribuicoes: [
          "Organise documents, contracts and files",
          "Assist employees and suppliers by phone and email",
          "Manage calendars, office supplies and mail",
          "Support the finance and HR teams with daily routines",
        ],
        responsabilidades: [
          "Keep documents in order and easy to find",
          "Make sure internal requests are answered on time",
          "Help keep the office organised and efficient",
        ],
      },
      es: {
        cargo: "Asistente Administrativo(a)",
        resumo: "Brindar apoyo administrativo y encargarse de los documentos y la atención interna.",
        requisitos: [
          "Secundaria completa (cursar estudios universitarios es deseable)",
          "Paquete Office o Google Workspace",
          "Buena comunicación oral y escrita",
          "Organización y proactividad",
        ],
        atribuicoes: [
          "Organizar documentos, contratos y archivos",
          "Atender a colaboradores y proveedores por teléfono y correo electrónico",
          "Controlar agendas, material de oficina y correspondencia",
          "Apoyar a las áreas de finanzas y RR. HH. en las rutinas diarias",
        ],
        responsabilidades: [
          "Mantener los documentos en orden y fáciles de encontrar",
          "Garantizar que las solicitudes internas se respondan a tiempo",
          "Contribuir a una oficina organizada y eficiente",
        ],
      },
    },
  },
  {
    slug: "analista-compras",
    area: "administrativo",
    quantidade: 2,
    areaFormulario: "outra",
    textos: {
      pt: {
        cargo: "Analista de Compras",
        resumo: "Fazer cotações, negociar e comprar junto aos fornecedores.",
        requisitos: [
          "Graduação em Administração, Logística, Engenharia ou áreas afins",
          "Experiência com compras de materiais industriais ou eletrônicos",
          "Habilidade de negociação e de análise de propostas",
          "Excel intermediário e vivência com sistemas de gestão (ERP)",
          "Diferencial: inglês para contato com fornecedores internacionais",
        ],
        atribuicoes: [
          "Fazer cotações e comparar preços, prazos e condições",
          "Negociar com fornecedores de vidros, componentes eletrônicos e embalagens",
          "Emitir pedidos de compra e acompanhar as entregas",
          "Cadastrar e avaliar fornecedores",
        ],
        responsabilidades: [
          "Garantir que a produção tenha material no prazo certo",
          "Reduzir custos sem perder qualidade",
          "Manter uma base de fornecedores confiável",
        ],
      },
      en: {
        cargo: "Purchasing Analyst",
        resumo: "Request quotes, negotiate and buy from suppliers.",
        requisitos: [
          "Degree in Business Administration, Logistics, Engineering or a related field",
          "Experience purchasing industrial or electronic materials",
          "Negotiation skills and ability to analyse proposals",
          "Intermediate Excel and experience with ERP systems",
          "Nice to have: English for contact with international suppliers",
        ],
        atribuicoes: [
          "Request quotes and compare prices, lead times and terms",
          "Negotiate with suppliers of glass, electronic components and packaging",
          "Issue purchase orders and track deliveries",
          "Register and evaluate suppliers",
        ],
        responsabilidades: [
          "Make sure production has materials on time",
          "Reduce costs without losing quality",
          "Maintain a reliable supplier base",
        ],
      },
      es: {
        cargo: "Analista de Compras",
        resumo: "Cotizar, negociar y comprar a los proveedores.",
        requisitos: [
          "Título en Administración, Logística, Ingeniería o áreas afines",
          "Experiencia en compras de materiales industriales o electrónicos",
          "Habilidad de negociación y de análisis de propuestas",
          "Excel intermedio y experiencia con sistemas de gestión (ERP)",
          "Deseable: inglés para el contacto con proveedores internacionales",
        ],
        atribuicoes: [
          "Hacer cotizaciones y comparar precios, plazos y condiciones",
          "Negociar con proveedores de vidrio, componentes electrónicos y embalajes",
          "Emitir órdenes de compra y seguir las entregas",
          "Registrar y evaluar proveedores",
        ],
        responsabilidades: [
          "Garantizar que la producción tenga material a tiempo",
          "Reducir costos sin perder calidad",
          "Mantener una base de proveedores confiable",
        ],
      },
    },
  },
  {
    slug: "analista-marketing",
    area: "comercial",
    quantidade: 3,
    areaFormulario: "comercial",
    textos: {
      pt: {
        cargo: "Analista de Marketing",
        resumo: "Planejar campanhas e a comunicação da marca e analisar os resultados.",
        requisitos: [
          "Graduação em Marketing, Publicidade, Comunicação ou áreas afins",
          "Experiência com planejamento de campanhas e redes sociais",
          "Conhecimento de métricas e de ferramentas como o Google Analytics",
          "Boa escrita e criatividade",
          "Diferencial: experiência com o mercado de beleza ou de tecnologia",
        ],
        atribuicoes: [
          "Planejar o calendário de campanhas e de conteúdos",
          "Acompanhar os resultados e montar relatórios",
          "Apoiar eventos, feiras e ações com salões e barbearias",
          "Trabalhar junto com design, tráfego pago e vendas",
        ],
        responsabilidades: [
          "Fortalecer a marca MiraV e o VisaVision",
          "Gerar demanda qualificada para o time comercial",
          "Transformar os dados das campanhas em decisões",
        ],
      },
      en: {
        cargo: "Marketing Analyst",
        resumo: "Plan campaigns and brand communication and analyse the results.",
        requisitos: [
          "Degree in Marketing, Advertising, Communications or a related field",
          "Experience planning campaigns and managing social media",
          "Knowledge of metrics and tools such as Google Analytics",
          "Strong writing skills and creativity",
          "Nice to have: experience in the beauty or technology market",
        ],
        atribuicoes: [
          "Plan the campaign and content calendar",
          "Track results and build reports",
          "Support events, trade shows and activities with salons and barbershops",
          "Work closely with design, paid media and sales",
        ],
        responsabilidades: [
          "Strengthen the MiraV and VisaVision brands",
          "Generate qualified demand for the sales team",
          "Turn campaign data into decisions",
        ],
      },
      es: {
        cargo: "Analista de Marketing",
        resumo: "Planificar campañas y la comunicación de la marca y analizar los resultados.",
        requisitos: [
          "Título en Marketing, Publicidad, Comunicación o áreas afines",
          "Experiencia en planificación de campañas y redes sociales",
          "Conocimiento de métricas y herramientas como Google Analytics",
          "Buena redacción y creatividad",
          "Deseable: experiencia en el mercado de belleza o tecnología",
        ],
        atribuicoes: [
          "Planificar el calendario de campañas y contenidos",
          "Seguir los resultados y elaborar informes",
          "Apoyar eventos, ferias y acciones con salones y barberías",
          "Trabajar junto con diseño, tráfico pago y ventas",
        ],
        responsabilidades: [
          "Fortalecer las marcas MiraV y VisaVision",
          "Generar demanda calificada para el equipo comercial",
          "Convertir los datos de las campañas en decisiones",
        ],
      },
    },
  },
  {
    slug: "designer-produtor-conteudo",
    area: "comercial",
    quantidade: 1,
    areaFormulario: "design",
    textos: {
      pt: {
        cargo: "Designer e Produtor(a) de Conteúdo",
        resumo: "Criar peças visuais e conteúdos para os canais digitais da MiraV.",
        requisitos: [
          "Formação em Design, Publicidade ou áreas afins",
          "Domínio de Figma, Photoshop e Illustrator (ou equivalentes)",
          "Noções de edição de vídeo para redes sociais",
          "Portfólio com trabalhos recentes",
          "Diferencial: motion design",
        ],
        atribuicoes: [
          "Criar posts, vídeos curtos, banners e apresentações",
          "Aplicar a identidade visual da MiraV em todos os canais",
          "Produzir fotos e vídeos de demonstração do espelho",
          "Adaptar as peças para as campanhas pagas",
        ],
        responsabilidades: [
          "Manter a marca consistente e reconhecível",
          "Entregar as peças no prazo do calendário de conteúdo",
          "Testar formatos e acompanhar o que traz mais resultado",
        ],
      },
      en: {
        cargo: "Designer and Content Creator",
        resumo: "Create visuals and content for MiraV's digital channels.",
        requisitos: [
          "Degree in Design, Advertising or a related field",
          "Proficiency in Figma, Photoshop and Illustrator (or equivalents)",
          "Basic video editing for social media",
          "Portfolio with recent work",
          "Nice to have: motion design",
        ],
        atribuicoes: [
          "Create posts, short videos, banners and presentations",
          "Apply MiraV's visual identity across all channels",
          "Produce photos and demo videos of the mirror",
          "Adapt assets for paid campaigns",
        ],
        responsabilidades: [
          "Keep the brand consistent and recognisable",
          "Deliver assets on time for the content calendar",
          "Test formats and track what performs best",
        ],
      },
      es: {
        cargo: "Diseñador(a) y Productor(a) de Contenido",
        resumo: "Crear piezas visuales y contenidos para los canales digitales de MiraV.",
        requisitos: [
          "Formación en Diseño, Publicidad o áreas afines",
          "Dominio de Figma, Photoshop e Illustrator (o equivalentes)",
          "Nociones de edición de video para redes sociales",
          "Portafolio con trabajos recientes",
          "Deseable: motion design",
        ],
        atribuicoes: [
          "Crear publicaciones, videos cortos, banners y presentaciones",
          "Aplicar la identidad visual de MiraV en todos los canales",
          "Producir fotos y videos de demostración del espejo",
          "Adaptar las piezas para las campañas pagas",
        ],
        responsabilidades: [
          "Mantener la marca coherente y reconocible",
          "Entregar las piezas a tiempo según el calendario de contenido",
          "Probar formatos y seguir lo que da más resultado",
        ],
      },
    },
  },
  {
    slug: "especialista-trafego-pago",
    area: "comercial",
    quantidade: 2,
    areaFormulario: "comercial",
    textos: {
      pt: {
        cargo: "Especialista em Tráfego Pago",
        resumo: "Gerir os anúncios e as campanhas pagas no Google e na Meta.",
        requisitos: [
          "Experiência comprovada com Google Ads e Meta Ads",
          "Conhecimento de Google Analytics, Tag Manager e pixels de conversão",
          "Capacidade de analisar dados e otimizar o investimento",
          "Diferencial: certificações do Google ou da Meta",
        ],
        atribuicoes: [
          "Criar, configurar e otimizar as campanhas pagas",
          "Definir públicos, orçamentos e testes A/B",
          "Acompanhar métricas como custo por lead e retorno sobre o investimento",
          "Montar relatórios de desempenho",
        ],
        responsabilidades: [
          "Gerar leads qualificados com o menor custo possível",
          "Usar bem o orçamento de mídia",
          "Compartilhar os aprendizados com marketing e vendas",
        ],
      },
      en: {
        cargo: "Paid Media Specialist",
        resumo: "Manage paid ads and campaigns on Google and Meta.",
        requisitos: [
          "Proven experience with Google Ads and Meta Ads",
          "Knowledge of Google Analytics, Tag Manager and conversion pixels",
          "Ability to analyse data and optimise spend",
          "Nice to have: Google or Meta certifications",
        ],
        atribuicoes: [
          "Create, set up and optimise paid campaigns",
          "Define audiences, budgets and A/B tests",
          "Track metrics such as cost per lead and return on ad spend",
          "Build performance reports",
        ],
        responsabilidades: [
          "Generate qualified leads at the lowest possible cost",
          "Make good use of the media budget",
          "Share learnings with marketing and sales",
        ],
      },
      es: {
        cargo: "Especialista en Tráfico Pago",
        resumo: "Gestionar los anuncios y las campañas pagas en Google y Meta.",
        requisitos: [
          "Experiencia comprobada con Google Ads y Meta Ads",
          "Conocimiento de Google Analytics, Tag Manager y píxeles de conversión",
          "Capacidad de analizar datos y optimizar la inversión",
          "Deseable: certificaciones de Google o Meta",
        ],
        atribuicoes: [
          "Crear, configurar y optimizar las campañas pagas",
          "Definir públicos, presupuestos y pruebas A/B",
          "Seguir métricas como costo por lead y retorno de la inversión",
          "Elaborar informes de rendimiento",
        ],
        responsabilidades: [
          "Generar leads calificados al menor costo posible",
          "Aprovechar bien el presupuesto de medios",
          "Compartir los aprendizajes con marketing y ventas",
        ],
      },
    },
  },
  {
    slug: "executivo-vendas",
    area: "comercial",
    quantidade: 10,
    areaFormulario: "comercial",
    textos: {
      pt: {
        cargo: "Executivo(a) de Vendas",
        resumo: "Prospectar clientes e fechar negócios com barbearias, salões e clínicas de estética.",
        requisitos: [
          "Experiência com vendas consultivas para empresas (B2B)",
          "Boa comunicação e capacidade de negociação",
          "Vivência com CRM",
          "Diferencial: CNH categoria B e conhecimento do mercado de beleza e estética",
        ],
        atribuicoes: [
          "Prospectar barbearias, salões, clínicas de estética e lojas de coloração",
          "Fazer demonstrações do VisaVision",
          "Elaborar propostas e negociar condições",
          "Registrar contatos e oportunidades no CRM",
        ],
        responsabilidades: [
          "Cumprir as metas de vendas",
          "Construir relacionamentos duradouros com os clientes",
          "Levar ao time de produto o que os clientes pedem",
        ],
      },
      en: {
        cargo: "Sales Executive",
        resumo: "Prospect clients and close deals with barbershops, salons and beauty clinics.",
        requisitos: [
          "Experience in consultative business-to-business (B2B) sales",
          "Good communication and negotiation skills",
          "Experience with a CRM",
          "Nice to have: driver's licence and knowledge of the beauty market",
        ],
        atribuicoes: [
          "Prospect barbershops, salons, beauty clinics and colour studios",
          "Run VisaVision demonstrations",
          "Prepare proposals and negotiate terms",
          "Log contacts and opportunities in the CRM",
        ],
        responsabilidades: [
          "Meet sales targets",
          "Build lasting relationships with clients",
          "Bring client requests back to the product team",
        ],
      },
      es: {
        cargo: "Ejecutivo(a) de Ventas",
        resumo: "Prospectar clientes y cerrar negocios con barberías, salones y clínicas estéticas.",
        requisitos: [
          "Experiencia en ventas consultivas a empresas (B2B)",
          "Buena comunicación y capacidad de negociación",
          "Experiencia con CRM",
          "Deseable: licencia de conducir y conocimiento del mercado de belleza",
        ],
        atribuicoes: [
          "Prospectar barberías, salones, clínicas estéticas y estudios de coloración",
          "Hacer demostraciones del VisaVision",
          "Elaborar propuestas y negociar condiciones",
          "Registrar contactos y oportunidades en el CRM",
        ],
        responsabilidades: [
          "Cumplir las metas de ventas",
          "Construir relaciones duraderas con los clientes",
          "Llevar al equipo de producto lo que piden los clientes",
        ],
      },
    },
  },
  {
    slug: "analista-atendimento-cliente",
    area: "comercial",
    quantidade: 3,
    areaFormulario: "atendimento",
    textos: {
      pt: {
        cargo: "Analista de Atendimento ao Cliente",
        resumo: "Atender os clientes, resolver as demandas e manter a satisfação de quem usa o VisaVision.",
        requisitos: [
          "Ensino médio completo (ensino superior é um diferencial)",
          "Experiência com atendimento ao cliente ou suporte",
          "Boa comunicação escrita e verbal, com empatia",
          "Familiaridade com ferramentas de atendimento e CRM",
        ],
        atribuicoes: [
          "Atender os clientes por telefone, e-mail, chat e WhatsApp",
          "Registrar e acompanhar os chamados até a solução",
          "Orientar os clientes no uso do espelho VisaVision",
          "Encaminhar os casos técnicos ao suporte",
        ],
        responsabilidades: [
          "Garantir respostas rápidas e cordiais",
          "Manter a satisfação e a permanência dos clientes",
          "Identificar reclamações recorrentes e propor melhorias",
        ],
      },
      en: {
        cargo: "Customer Service Analyst",
        resumo: "Assist clients, solve their requests and keep VisaVision users satisfied.",
        requisitos: [
          "High school diploma (a university degree is a plus)",
          "Experience in customer service or support",
          "Good written and verbal communication, with empathy",
          "Familiarity with help desk tools and CRM",
        ],
        atribuicoes: [
          "Assist clients by phone, email, chat and WhatsApp",
          "Log and follow up tickets until they are solved",
          "Guide clients on using the VisaVision mirror",
          "Escalate technical cases to support",
        ],
        responsabilidades: [
          "Ensure quick and friendly responses",
          "Keep clients satisfied and retained",
          "Spot recurring complaints and suggest improvements",
        ],
      },
      es: {
        cargo: "Analista de Atención al Cliente",
        resumo: "Atender a los clientes, resolver sus solicitudes y mantener satisfechos a quienes usan el VisaVision.",
        requisitos: [
          "Secundaria completa (estudios universitarios son deseables)",
          "Experiencia en atención al cliente o soporte",
          "Buena comunicación oral y escrita, con empatía",
          "Familiaridad con herramientas de atención y CRM",
        ],
        atribuicoes: [
          "Atender a los clientes por teléfono, correo electrónico, chat y WhatsApp",
          "Registrar y seguir las solicitudes hasta su solución",
          "Orientar a los clientes en el uso del espejo VisaVision",
          "Derivar los casos técnicos a soporte",
        ],
        responsabilidades: [
          "Garantizar respuestas rápidas y cordiales",
          "Mantener la satisfacción y la permanencia de los clientes",
          "Identificar reclamos recurrentes y proponer mejoras",
        ],
      },
    },
  },
  {
    slug: "analista-logistica",
    area: "logistica",
    quantidade: 2,
    areaFormulario: "outra",
    textos: {
      pt: {
        cargo: "Analista de Logística",
        resumo: "Planejar o transporte, o estoque e as entregas dos espelhos.",
        requisitos: [
          "Graduação em Logística, Administração, Engenharia ou áreas afins",
          "Experiência com planejamento de transporte e controle de estoque",
          "Excel intermediário e vivência com sistemas de gestão (ERP ou WMS)",
          "Capacidade de análise e de negociação com transportadoras",
        ],
        atribuicoes: [
          "Planejar as rotas e os prazos de entrega",
          "Cotar e contratar transportadoras",
          "Controlar os níveis de estoque e os inventários",
          "Acompanhar as entregas e resolver as ocorrências",
        ],
        responsabilidades: [
          "Entregar os produtos no prazo e sem avarias",
          "Reduzir os custos de frete e de armazenagem",
          "Manter o estoque correto e atualizado",
        ],
      },
      en: {
        cargo: "Logistics Analyst",
        resumo: "Plan transportation, inventory and mirror deliveries.",
        requisitos: [
          "Degree in Logistics, Business Administration, Engineering or a related field",
          "Experience in transportation planning and inventory control",
          "Intermediate Excel and experience with ERP or WMS systems",
          "Analytical skills and ability to negotiate with carriers",
        ],
        atribuicoes: [
          "Plan delivery routes and lead times",
          "Get quotes from and hire carriers",
          "Control stock levels and inventory counts",
          "Track deliveries and solve issues",
        ],
        responsabilidades: [
          "Deliver products on time and undamaged",
          "Reduce freight and storage costs",
          "Keep inventory accurate and up to date",
        ],
      },
      es: {
        cargo: "Analista de Logística",
        resumo: "Planificar el transporte, el inventario y las entregas de los espejos.",
        requisitos: [
          "Título en Logística, Administración, Ingeniería o áreas afines",
          "Experiencia en planificación de transporte y control de inventario",
          "Excel intermedio y experiencia con sistemas de gestión (ERP o WMS)",
          "Capacidad de análisis y de negociación con transportistas",
        ],
        atribuicoes: [
          "Planificar las rutas y los plazos de entrega",
          "Cotizar y contratar transportistas",
          "Controlar los niveles de inventario y los conteos",
          "Seguir las entregas y resolver incidencias",
        ],
        responsabilidades: [
          "Entregar los productos a tiempo y sin daños",
          "Reducir los costos de flete y almacenamiento",
          "Mantener el inventario correcto y actualizado",
        ],
      },
    },
  },
  {
    slug: "auxiliar-estoque-expedicao",
    area: "logistica",
    quantidade: 4,
    areaFormulario: "outra",
    textos: {
      pt: {
        cargo: "Auxiliar de Estoque e Expedição",
        resumo: "Receber, separar e despachar as mercadorias.",
        requisitos: [
          "Ensino médio completo",
          "Experiência em almoxarifado, estoque ou expedição",
          "Atenção e cuidado no manuseio de produtos frágeis",
          "Diferencial: curso de operador de empilhadeira",
        ],
        atribuicoes: [
          "Receber e conferir os materiais dos fornecedores",
          "Separar, embalar e etiquetar os pedidos",
          "Organizar o estoque e apoiar os inventários",
          "Carregar e conferir os despachos",
        ],
        responsabilidades: [
          "Manter o estoque organizado e identificado",
          "Despachar os pedidos corretos e bem embalados",
          "Seguir as normas de segurança do trabalho",
        ],
      },
      en: {
        cargo: "Warehouse and Shipping Assistant",
        resumo: "Receive, pick and ship goods.",
        requisitos: [
          "High school diploma",
          "Experience in a warehouse, stockroom or shipping",
          "Care and attention when handling fragile products",
          "Nice to have: forklift operator course",
        ],
        atribuicoes: [
          "Receive and check materials from suppliers",
          "Pick, pack and label orders",
          "Organise the stock and support inventory counts",
          "Load and check shipments",
        ],
        responsabilidades: [
          "Keep the stock organised and labelled",
          "Ship correct, well-packed orders",
          "Follow workplace safety rules",
        ],
      },
      es: {
        cargo: "Auxiliar de Almacén y Despacho",
        resumo: "Recibir, separar y despachar las mercancías.",
        requisitos: [
          "Secundaria completa",
          "Experiencia en almacén, inventario o despacho",
          "Atención y cuidado al manipular productos frágiles",
          "Deseable: curso de operador de montacargas",
        ],
        atribuicoes: [
          "Recibir y revisar los materiales de los proveedores",
          "Separar, embalar y etiquetar los pedidos",
          "Organizar el almacén y apoyar los inventarios",
          "Cargar y revisar los despachos",
        ],
        responsabilidades: [
          "Mantener el almacén organizado e identificado",
          "Despachar pedidos correctos y bien embalados",
          "Seguir las normas de seguridad laboral",
        ],
      },
    },
  },
  {
    slug: "tecnico-integracao-testes",
    area: "producao",
    quantidade: 2,
    areaFormulario: "outra",
    textos: {
      pt: {
        cargo: "Técnico(a) de Integração e Testes",
        resumo: "Integrar os componentes e testar os espelhos inteligentes antes da entrega.",
        requisitos: [
          "Curso técnico em Eletrônica, Eletrotécnica, Mecatrônica ou Informática",
          "Experiência com montagem e testes de equipamentos eletrônicos",
          "Leitura de esquemas elétricos e uso de multímetro",
          "Noções de redes e de configuração de software embarcado",
        ],
        atribuicoes: [
          "Integrar telas, câmeras, sensores e placas aos espelhos",
          "Instalar e configurar o software VisaVision",
          "Executar os testes funcionais e registrar os resultados",
          "Diagnosticar e corrigir falhas",
        ],
        responsabilidades: [
          "Liberar apenas os equipamentos aprovados em todos os testes",
          "Documentar os defeitos e apoiar a melhoria do produto",
          "Manter os instrumentos e as bancadas em ordem",
        ],
      },
      en: {
        cargo: "Integration and Testing Technician",
        resumo: "Integrate components and test the smart mirrors before delivery.",
        requisitos: [
          "Technical course in Electronics, Electrical Engineering, Mechatronics or IT",
          "Experience assembling and testing electronic equipment",
          "Reading wiring diagrams and using a multimeter",
          "Basic networking and embedded software configuration",
        ],
        atribuicoes: [
          "Integrate screens, cameras, sensors and boards into the mirrors",
          "Install and configure the VisaVision software",
          "Run functional tests and record the results",
          "Diagnose and fix faults",
        ],
        responsabilidades: [
          "Release only units that pass every test",
          "Document defects and help improve the product",
          "Keep instruments and workbenches in order",
        ],
      },
      es: {
        cargo: "Técnico(a) de Integración y Pruebas",
        resumo: "Integrar los componentes y probar los espejos inteligentes antes de la entrega.",
        requisitos: [
          "Curso técnico en Electrónica, Electrotecnia, Mecatrónica o Informática",
          "Experiencia en montaje y pruebas de equipos electrónicos",
          "Lectura de esquemas eléctricos y uso de multímetro",
          "Nociones de redes y de configuración de software embebido",
        ],
        atribuicoes: [
          "Integrar pantallas, cámaras, sensores y placas en los espejos",
          "Instalar y configurar el software VisaVision",
          "Ejecutar las pruebas funcionales y registrar los resultados",
          "Diagnosticar y corregir fallas",
        ],
        responsabilidades: [
          "Liberar solo los equipos aprobados en todas las pruebas",
          "Documentar los defectos y apoyar la mejora del producto",
          "Mantener los instrumentos y los bancos de trabajo en orden",
        ],
      },
    },
  },
  {
    slug: "operador-montagem",
    area: "producao",
    quantidade: 8,
    areaFormulario: "outra",
    textos: {
      pt: {
        cargo: "Operador(a) de Montagem",
        resumo: "Montar os espelhos VisaVision na linha de produção.",
        requisitos: [
          "Ensino médio completo",
          "Habilidade manual e atenção aos detalhes",
          "Diferencial: experiência em linha de montagem",
        ],
        atribuicoes: [
          "Montar molduras, vidros e componentes conforme as instruções de trabalho",
          "Usar ferramentas manuais e elétricas com segurança",
          "Conferir as peças antes e depois de cada etapa",
          "Manter o posto de trabalho limpo e organizado",
        ],
        responsabilidades: [
          "Cumprir as metas de produção do turno",
          "Seguir os padrões de qualidade e de segurança",
          "Avisar o supervisor sobre falhas ou falta de material",
        ],
      },
      en: {
        cargo: "Assembly Operator",
        resumo: "Assemble VisaVision mirrors on the production line.",
        requisitos: ["High school diploma", "Manual dexterity and attention to detail", "Nice to have: assembly line experience"],
        atribuicoes: [
          "Assemble frames, glass and components following work instructions",
          "Use hand and power tools safely",
          "Check parts before and after each step",
          "Keep the workstation clean and organised",
        ],
        responsabilidades: [
          "Meet the shift's production targets",
          "Follow quality and safety standards",
          "Tell the supervisor about faults or missing materials",
        ],
      },
      es: {
        cargo: "Operador(a) de Montaje",
        resumo: "Montar los espejos VisaVision en la línea de producción.",
        requisitos: ["Secundaria completa", "Habilidad manual y atención al detalle", "Deseable: experiencia en línea de montaje"],
        atribuicoes: [
          "Montar marcos, vidrios y componentes según las instrucciones de trabajo",
          "Usar herramientas manuales y eléctricas con seguridad",
          "Revisar las piezas antes y después de cada etapa",
          "Mantener el puesto de trabajo limpio y ordenado",
        ],
        responsabilidades: [
          "Cumplir las metas de producción del turno",
          "Seguir los estándares de calidad y seguridad",
          "Avisar al supervisor sobre fallas o falta de material",
        ],
      },
    },
  },
  {
    slug: "inspetor-qualidade",
    area: "qualidade",
    quantidade: 4,
    areaFormulario: "outra",
    textos: {
      pt: {
        cargo: "Inspetor(a) de Qualidade",
        resumo: "Inspecionar os produtos e os processos conforme os padrões da MiraV.",
        requisitos: [
          "Curso técnico ou superior em Qualidade, Produção, Mecânica ou áreas afins",
          "Experiência com inspeção de qualidade na indústria",
          "Uso de instrumentos de medição (paquímetro, trena, multímetro)",
          "Diferencial: conhecimento da norma ISO 9001",
        ],
        atribuicoes: [
          "Inspecionar as matérias-primas, as peças e os produtos acabados",
          "Registrar as não conformidades e acompanhar a correção",
          "Aplicar os checklists de qualidade na linha",
          "Apoiar as auditorias internas",
        ],
        responsabilidades: [
          "Garantir que nenhum espelho com defeito chegue ao cliente",
          "Manter os registros de qualidade completos",
          "Propor ações para reduzir os defeitos",
        ],
      },
      en: {
        cargo: "Quality Inspector",
        resumo: "Inspect products and processes against MiraV's standards.",
        requisitos: [
          "Technical or university degree in Quality, Production, Mechanics or a related field",
          "Experience in quality inspection in manufacturing",
          "Using measuring instruments (calipers, tape measure, multimeter)",
          "Nice to have: knowledge of ISO 9001",
        ],
        atribuicoes: [
          "Inspect raw materials, parts and finished products",
          "Record non-conformities and follow up on corrections",
          "Apply quality checklists on the line",
          "Support internal audits",
        ],
        responsabilidades: [
          "Make sure no defective mirror reaches a client",
          "Keep quality records complete",
          "Suggest actions to reduce defects",
        ],
      },
      es: {
        cargo: "Inspector(a) de Calidad",
        resumo: "Inspeccionar los productos y los procesos según los estándares de MiraV.",
        requisitos: [
          "Formación técnica o universitaria en Calidad, Producción, Mecánica o áreas afines",
          "Experiencia en inspección de calidad en la industria",
          "Uso de instrumentos de medición (calibre, cinta métrica, multímetro)",
          "Deseable: conocimiento de la norma ISO 9001",
        ],
        atribuicoes: [
          "Inspeccionar las materias primas, las piezas y los productos terminados",
          "Registrar las no conformidades y seguir su corrección",
          "Aplicar las listas de verificación de calidad en la línea",
          "Apoyar las auditorías internas",
        ],
        responsabilidades: [
          "Garantizar que ningún espejo defectuoso llegue al cliente",
          "Mantener completos los registros de calidad",
          "Proponer acciones para reducir los defectos",
        ],
      },
    },
  },
  {
    slug: "engenheiro-software-ia",
    area: "tecnologia",
    quantidade: 2,
    areaFormulario: "ia",
    textos: {
      pt: {
        cargo: "Engenheiro(a) de Software e IA",
        resumo: "Desenvolver os sistemas e as soluções de inteligência artificial do VisaVision.",
        requisitos: [
          "Graduação em Ciência da Computação, Engenharia ou áreas afins",
          "Experiência com Go, Python ou TypeScript",
          "Conhecimento de visão computacional e de integração com modelos de IA",
          "PostgreSQL e APIs REST",
          "Diferencial: WebGL, three.js ou processamento de imagens",
        ],
        atribuicoes: [
          "Desenvolver e manter a API, o site e o software do espelho",
          "Integrar modelos de IA com visão e medir a qualidade das respostas",
          "Escrever testes automatizados e revisar código",
          "Monitorar o desempenho, os custos e a segurança",
        ],
        responsabilidades: [
          "Entregar funcionalidades estáveis e bem testadas",
          "Proteger os dados dos clientes, seguindo a LGPD",
          "Propor melhorias técnicas e de produto",
        ],
      },
      en: {
        cargo: "Software and AI Engineer",
        resumo: "Build VisaVision's systems and artificial intelligence solutions.",
        requisitos: [
          "Degree in Computer Science, Engineering or a related field",
          "Experience with Go, Python or TypeScript",
          "Knowledge of computer vision and integrating AI models",
          "PostgreSQL and REST APIs",
          "Nice to have: WebGL, three.js or image processing",
        ],
        atribuicoes: [
          "Build and maintain the API, the website and the mirror software",
          "Integrate vision AI models and measure the quality of their answers",
          "Write automated tests and review code",
          "Monitor performance, costs and security",
        ],
        responsabilidades: [
          "Ship stable, well-tested features",
          "Protect client data in line with Brazil's LGPD",
          "Suggest technical and product improvements",
        ],
      },
      es: {
        cargo: "Ingeniero(a) de Software e IA",
        resumo: "Desarrollar los sistemas y las soluciones de inteligencia artificial del VisaVision.",
        requisitos: [
          "Título en Ciencias de la Computación, Ingeniería o áreas afines",
          "Experiencia con Go, Python o TypeScript",
          "Conocimiento de visión por computadora e integración con modelos de IA",
          "PostgreSQL y API REST",
          "Deseable: WebGL, three.js o procesamiento de imágenes",
        ],
        atribuicoes: [
          "Desarrollar y mantener la API, el sitio y el software del espejo",
          "Integrar modelos de IA con visión y medir la calidad de las respuestas",
          "Escribir pruebas automatizadas y revisar código",
          "Monitorear el rendimiento, los costos y la seguridad",
        ],
        responsabilidades: [
          "Entregar funcionalidades estables y bien probadas",
          "Proteger los datos de los clientes según la LGPD brasileña",
          "Proponer mejoras técnicas y de producto",
        ],
      },
    },
  },
  {
    slug: "tecnico-suporte-ti",
    area: "tecnologia",
    quantidade: 2,
    areaFormulario: "atendimento",
    textos: {
      pt: {
        cargo: "Técnico(a) de Suporte de TI",
        resumo: "Dar suporte aos usuários e cuidar dos equipamentos e da rede.",
        requisitos: [
          "Curso técnico ou superior em TI, Redes ou áreas afins",
          "Experiência com suporte a usuários e manutenção de computadores",
          "Conhecimento de Windows, redes e Wi-Fi",
          "Boa comunicação para explicar soluções a quem não é da área",
        ],
        atribuicoes: [
          "Atender os chamados de colaboradores e clientes",
          "Instalar e configurar computadores, impressoras e espelhos",
          "Cuidar da rede, dos acessos e dos backups",
          "Manter o inventário de equipamentos",
        ],
        responsabilidades: [
          "Resolver os chamados dentro do prazo",
          "Manter os equipamentos e a rede funcionando",
          "Seguir as boas práticas de segurança da informação",
        ],
      },
      en: {
        cargo: "IT Support Technician",
        resumo: "Support users and look after equipment and the network.",
        requisitos: [
          "Technical or university degree in IT, Networking or a related field",
          "Experience in user support and computer maintenance",
          "Knowledge of Windows, networks and Wi-Fi",
          "Good communication to explain solutions to non-technical people",
        ],
        atribuicoes: [
          "Handle tickets from employees and clients",
          "Install and configure computers, printers and mirrors",
          "Look after the network, access and backups",
          "Keep the equipment inventory",
        ],
        responsabilidades: [
          "Solve tickets on time",
          "Keep equipment and the network running",
          "Follow information security best practices",
        ],
      },
      es: {
        cargo: "Técnico(a) de Soporte de TI",
        resumo: "Dar soporte a los usuarios y cuidar los equipos y la red.",
        requisitos: [
          "Formación técnica o universitaria en TI, Redes o áreas afines",
          "Experiencia en soporte a usuarios y mantenimiento de computadoras",
          "Conocimiento de Windows, redes y Wi-Fi",
          "Buena comunicación para explicar soluciones a personas no técnicas",
        ],
        atribuicoes: [
          "Atender las solicitudes de colaboradores y clientes",
          "Instalar y configurar computadoras, impresoras y espejos",
          "Cuidar la red, los accesos y las copias de seguridad",
          "Mantener el inventario de equipos",
        ],
        responsabilidades: [
          "Resolver las solicitudes a tiempo",
          "Mantener los equipos y la red funcionando",
          "Seguir las buenas prácticas de seguridad de la información",
        ],
      },
    },
  },
];

export const buscarVaga = (slug: string) => VAGAS.find((v) => v.slug === slug);
